import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCustomerOrders } from "../api/orders";
import { getAllRestaurants } from "../api/restaurant";
import { getProfile } from "../api/profile";
import { connectSocket } from "../socket";
import CustomerLayout from "../components/customer/CustomerLayout";
import "../components/customer/customer-dashboard.css";

const ACTIVE_STATUSES = ["PLACED", "ACCEPTED", "PREPARING", "PICKED_UP"];

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function statusBadgeClass(status) {
  const key = (status || "").toLowerCase().replace(/-/g, "_");
  return `cd-badge cd-badge-${key}`;
}

function statusLabel(status) {
  if (!status) return "—";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function computeStats(orders) {
  const todayOrders = orders.filter((o) => isToday(o.createdAt));
  const todaySpent = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const activeCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  return {
    todayCount: todayOrders.length,
    todaySpent,
    activeCount,
    totalCount: orders.length,
  };
}

function CustomerDashboard() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [orders, setOrders] = useState([]);
  const [nameById, setNameById] = useState({});
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then(({ profile }) => {
        if (!cancelled && profile?.username) setCustomerName(profile.username.trim());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setOrdersError("");
      try {
        const [ordersRes, restaurantsRes] = await Promise.all([
          getCustomerOrders(),
          getAllRestaurants(),
        ]);
        if (cancelled) return;
        const map = {};
        const restaurants = restaurantsRes.restaurants || [];
        restaurants.forEach((r) => {
          map[String(r.id)] = r.name;
        });
        setNameById(map);
        setOrders(ordersRes.orders || []);
        setFeaturedRestaurants(restaurants.filter((r) => r.status !== "closed").slice(0, 4));
      } catch (e) {
        if (!cancelled) setOrdersError(e.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };

    load();

    const socket = connectSocket();
    if (!socket) {
      return () => {
        cancelled = true;
      };
    }

    const onOrderUpdate = (payload) => {
      setOrders((prev) =>
        prev.map((o) =>
          String(o._id) === payload.orderId
            ? { ...o, status: payload.status, updatedAt: payload.updatedAt }
            : o
        )
      );
    };

    socket.on("order:update", onOrderUpdate);

    return () => {
      cancelled = true;
      socket.off("order:update", onOrderUpdate);
    };
  }, []);

  const stats = useMemo(() => computeStats(orders), [orders]);
  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);
  const activeOrder = useMemo(
    () => orders.find((o) => ACTIVE_STATUSES.includes(o.status)),
    [orders]
  );

  const welcomeName = customerName || "there";

  return (
    <CustomerLayout>
      <div className="cd-page-header">
        <div>
          <h1 className="cd-page-title">Dashboard overview</h1>
          <p className="cd-page-subtitle">
            Welcome back, {welcomeName}. Here&apos;s your ordering activity.
          </p>
        </div>
        <Link to="/customer/restaurants" className="cd-btn-primary">
          <span className="material-symbols-outlined">storefront</span>
          Order food
        </Link>
      </div>

      {ordersError ? <div className="cd-alert-error">{ordersError}</div> : null}

      {activeOrder ? (
        <div className="cd-active-card">
          <h3>Order in progress</h3>
          <p>
            {nameById[String(activeOrder.restaurantId)] || "Restaurant"} ·{" "}
            {statusLabel(activeOrder.status)} · ${Number(activeOrder.totalAmount).toFixed(2)}
          </p>
          <Link to={`/customer/orders/${activeOrder._id}`} className="cd-btn-outline">
            View order details
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      ) : null}

      <div className="cd-stats-grid">
        <div className="cd-stat-card">
          <div className="cd-stat-icon cd-stat-icon-green">
            <span className="material-symbols-outlined">shopping_bag</span>
          </div>
          <p className="cd-stat-label">Today&apos;s orders</p>
          <p className="cd-stat-value">
            {ordersLoading ? "…" : stats.todayCount}
            <span className="cd-stat-meta">{stats.totalCount} total</span>
          </p>
        </div>
        <div className="cd-stat-card">
          <div className="cd-stat-icon cd-stat-icon-amber">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <p className="cd-stat-label">Spent today</p>
          <p className="cd-stat-value">
            {ordersLoading ? "…" : `$${stats.todaySpent.toFixed(2)}`}
          </p>
        </div>
        <div className="cd-stat-card">
          <div className="cd-stat-icon cd-stat-icon-blue">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <p className="cd-stat-label">Active orders</p>
          <p className="cd-stat-value">
            {ordersLoading ? "…" : stats.activeCount}
            <span className="cd-stat-meta">In progress</span>
          </p>
        </div>
      </div>

      <div className="cd-content-grid">
        <div className="cd-panel">
          <div className="cd-panel-header">
            <h3 className="cd-panel-title">Recent orders</h3>
          </div>
          {ordersLoading ? (
            <p className="cd-empty">Loading orders…</p>
          ) : recentOrders.length === 0 ? (
            <p className="cd-empty">
              No orders yet.{" "}
              <Link to="/customer/restaurants">Browse restaurants</Link> to get started.
            </p>
          ) : (
            <ul className="cd-order-list">
              {recentOrders.map((order) => (
                <li key={order._id}>
                  <Link to={`/customer/orders/${order._id}`} className="cd-order-item">
                    <div>
                      <p className="cd-order-name">
                        Order #{String(order._id).slice(-6)}
                      </p>
                      <p className="cd-order-meta">
                        {nameById[String(order.restaurantId)] || "Restaurant"} · $
                        {Number(order.totalAmount).toFixed(2)}
                      </p>
                    </div>
                    <span className={statusBadgeClass(order.status)}>
                      {statusLabel(order.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="cd-panel">
          <div className="cd-panel-header">
            <h3 className="cd-panel-title">Quick links</h3>
          </div>
          <div className="cd-quick-links">
            <button
              type="button"
              className="cd-quick-link"
              onClick={() => navigate("/customer/restaurants")}
            >
              <span className="material-symbols-outlined">storefront</span>
              Browse restaurants
            </button>
            <button
              type="button"
              className="cd-quick-link"
              onClick={() => navigate("/customer/orders")}
            >
              <span className="material-symbols-outlined">receipt_long</span>
              My orders
            </button>
            <button
              type="button"
              className="cd-quick-link"
              onClick={() => navigate("/setup/customer")}
            >
              <span className="material-symbols-outlined">settings</span>
              Profile settings
            </button>
          </div>
        </div>
      </div>

      {featuredRestaurants.length > 0 ? (
        <div className="cd-panel" style={{ marginTop: "1.5rem" }}>
          <div className="cd-panel-header">
            <h3 className="cd-panel-title">Popular near you</h3>
          </div>
          <div className="cd-restaurant-grid">
            {featuredRestaurants.map((r) => (
              <Link key={r.id} to={`/customer/restaurant/${r.id}`} className="cd-restaurant-card">
                {r.image ? <img src={r.image} alt="" /> : null}
                <div className="cd-restaurant-card-body">
                  <h4>{r.name}</h4>
                  <p>
                    {r.location}
                    {r.rating != null ? ` · ★ ${r.rating}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </CustomerLayout>
  );
}

export default CustomerDashboard;
