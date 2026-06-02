import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRestaurantOrders, updateOrderStatus } from "../api/orders";
import { getProfile } from "../api/profile";
import { connectSocket } from "../socket";
import RestaurantLayout from "../components/restaurant/RestaurantLayout";

const ACTIVE_STATUSES = ["PLACED", "ACCEPTED", "PREPARING"];

const AVATAR_COLORS = [
  { bg: "#d1fae5", text: "#047857" },
  { bg: "#dbeafe", text: "#1d4ed8" },
  { bg: "#f3e8ff", text: "#7c3aed" },
  { bg: "#ffedd5", text: "#c2410c" },
];

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

function formatItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "—";
  return items.map((line) => `${line.quantity}x ${line.name}`).join(", ");
}

function customerLabel(customerId) {
  const id = String(customerId || "");
  return `Customer ${id.slice(-4).toUpperCase()}`;
}

function customerInitials(customerId) {
  const id = String(customerId || "??");
  return id.slice(-2).toUpperCase();
}

function avatarColor(customerId) {
  const id = String(customerId || "");
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function statusBadgeClass(status) {
  const key = (status || "").toLowerCase().replace(/-/g, "_");
  return `rd-badge rd-badge-${key}`;
}

function statusLabel(status) {
  if (!status) return "—";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function computeStats(orders) {
  const todayOrders = orders.filter((o) => isToday(o.createdAt));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const activeCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  return {
    todayCount: todayOrders.length,
    todayRevenue,
    activeCount,
    totalCount: orders.length,
  };
}

function RestaurantDashboard() {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orderActionId, setOrderActionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then(({ profile }) => {
        if (!cancelled && profile?.restaurantName) setRestaurantName(profile.restaurantName);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      setOrdersError("");
      try {
        const { orders: list } = await getRestaurantOrders();
        if (!cancelled) setOrders(list || []);
      } catch (e) {
        if (!cancelled) setOrdersError(e.message || "Failed to load orders");
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };

    loadOrders();

    const socket = connectSocket();
    if (!socket) {
      return () => {
        cancelled = true;
      };
    }

    const onOrderUpdate = (payload) => {
      setOrders((prev) => {
        const idx = prev.findIndex((o) => String(o._id) === payload.orderId);
        if (idx >= 0) {
          return prev.map((o) =>
            String(o._id) === payload.orderId
              ? { ...o, status: payload.status, updatedAt: payload.updatedAt }
              : o
          );
        }
        loadOrders();
        return prev;
      });
    };

    socket.on("order:update", onOrderUpdate);

    return () => {
      cancelled = true;
      socket.off("order:update", onOrderUpdate);
    };
  }, []);

  const stats = useMemo(() => computeStats(orders), [orders]);
  const recentOrders = useMemo(() => orders.slice(0, 10), [orders]);

  const handleOrderStatus = async (orderId, nextStatus) => {
    setOrderActionId(orderId);
    setOrdersError("");
    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (e) {
      setOrdersError(e.message || "Order update failed");
    } finally {
      setOrderActionId(null);
    }
  };

  const welcomeName = restaurantName || "your restaurant";

  return (
    <RestaurantLayout>
      <div className="rd-page-header">
        <div>
          <h1 className="rd-page-title">Dashboard overview</h1>
          <p className="rd-page-subtitle">
            Welcome back, {welcomeName}. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="rd-header-actions">
          <button type="button" className="rd-btn-primary" onClick={() => navigate("/restaurant/menu")}>
            <span className="material-symbols-outlined">add_circle</span>
            Manage menu
          </button>
        </div>
      </div>

      {ordersError ? <div className="rd-alert-error">{ordersError}</div> : null}

      <div className="rd-stats-grid">
        <div className="rd-stat-card">
          <div className="rd-stat-top">
            <div className="rd-stat-icon rd-stat-icon-green">
              <span className="material-symbols-outlined">shopping_basket</span>
            </div>
          </div>
          <p className="rd-stat-label">Today&apos;s orders</p>
          <p className="rd-stat-value">
            {ordersLoading ? "…" : stats.todayCount}
            <span className="rd-stat-meta">{stats.totalCount} total</span>
          </p>
        </div>

        <div className="rd-stat-card">
          <div className="rd-stat-top">
            <div className="rd-stat-icon rd-stat-icon-amber">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <p className="rd-stat-label">Today&apos;s revenue</p>
          <p className="rd-stat-value">
            {ordersLoading ? "…" : `$${stats.todayRevenue.toFixed(2)}`}
            <span className="rd-stat-meta">Today</span>
          </p>
        </div>

        <div className="rd-stat-card">
          <div className="rd-stat-top">
            <div className="rd-stat-icon rd-stat-icon-blue">
              <span className="material-symbols-outlined">timer</span>
            </div>
          </div>
          <p className="rd-stat-label">Active orders</p>
          <p className="rd-stat-value">
            {ordersLoading ? "…" : stats.activeCount}
            <span className="rd-stat-meta">In progress</span>
          </p>
        </div>
      </div>

      <div className="rd-content-grid">
        <div className="rd-panel">
          <div className="rd-panel-header">
            <h3 className="rd-panel-title">Recent orders</h3>
          </div>
          {ordersLoading ? (
            <p className="rd-empty">Loading orders…</p>
          ) : recentOrders.length === 0 ? (
            <p className="rd-empty">No orders yet.</p>
          ) : (
            <div className="rd-table-wrap">
              <table className="rd-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const avatar = avatarColor(order.customerId);
                    return (
                      <tr key={order._id}>
                        <td className="rd-order-id">#{String(order._id).slice(-6)}</td>
                        <td>
                          <div className="rd-customer-cell">
                            <span
                              className="rd-avatar"
                              style={{ background: avatar.bg, color: avatar.text }}
                            >
                              {customerInitials(order.customerId)}
                            </span>
                            <span>{customerLabel(order.customerId)}</span>
                          </div>
                        </td>
                        <td className="rd-items-text">{formatItems(order.items)}</td>
                        <td>
                          <span className={statusBadgeClass(order.status)}>
                            {statusLabel(order.status)}
                          </span>
                        </td>
                        <td className="rd-amount">${Number(order.totalAmount).toFixed(2)}</td>
                        <td>
                          <div className="rd-order-actions">
                            {order.status === "PLACED" ? (
                              <button
                                type="button"
                                className="rd-action-btn"
                                disabled={orderActionId === order._id}
                                onClick={() => handleOrderStatus(order._id, "ACCEPTED")}
                              >
                                Accept
                              </button>
                            ) : null}
                            {order.status === "ACCEPTED" ? (
                              <button
                                type="button"
                                className="rd-action-btn"
                                disabled={orderActionId === order._id}
                                onClick={() => handleOrderStatus(order._id, "PREPARING")}
                              >
                                Preparing
                              </button>
                            ) : null}
                            {["PLACED", "ACCEPTED", "PREPARING"].includes(order.status) ? (
                              <button
                                type="button"
                                className="rd-action-btn"
                                disabled={orderActionId === order._id}
                                onClick={() => handleOrderStatus(order._id, "CANCELLED")}
                              >
                                Cancel
                              </button>
                            ) : null}
                            {!["PLACED", "ACCEPTED", "PREPARING"].includes(order.status) ? (
                              <span className="rd-items-text">—</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rd-side-panel">
          <div className="rd-info-card">
            <h3>Quick links</h3>
            <div className="rd-quick-links">
              <button
                type="button"
                className="rd-quick-link"
                onClick={() => navigate("/restaurant/menu")}
              >
                <span className="material-symbols-outlined">menu_book</span>
                Menu items
              </button>
              <button
                type="button"
                className="rd-quick-link"
                onClick={() => navigate("/restaurant/categories")}
              >
                <span className="material-symbols-outlined">category</span>
                Categories
              </button>
              <button
                type="button"
                className="rd-quick-link"
                onClick={() => navigate("/restaurant/settings")}
              >
                <span className="material-symbols-outlined">settings</span>
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </RestaurantLayout>
  );
}

export default RestaurantDashboard;
