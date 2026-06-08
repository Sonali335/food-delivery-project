import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCustomerOrders } from "../api/orders";
import { getAllRestaurants } from "../api/restaurant";
import { connectSocket } from "../socket";
import { orderStatusLabel } from "../utils/orderStatus";
import CustomerLayout from "../components/customer/CustomerLayout";
import "../components/customer/customer-dashboard.css";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function statusBadgeClass(status) {
  const key = (status || "").toLowerCase().replace(/-/g, "_");
  return `cd-badge cd-badge-${key}`;
}

function statusLabel(status) {
  return orderStatusLabel(status);
}

function restaurantNameFor(order, nameById) {
  const id = order.restaurantId != null ? String(order.restaurantId) : "";
  return nameById[id] || "Restaurant";
}

function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [nameById, setNameById] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([getCustomerOrders(), getAllRestaurants()])
      .then(([ordersRes, restaurantsRes]) => {
        if (cancelled) return;
        const map = {};
        (restaurantsRes.restaurants || []).forEach((r) => {
          map[String(r.id)] = r.name;
        });
        setNameById(map);
        setOrders(ordersRes.orders || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load orders");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

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

  return (
    <CustomerLayout>
      <div className="cd-page-header">
        <div>
          <h1 className="cd-page-title">My orders</h1>
          <p className="cd-page-subtitle">Track status and view order details.</p>
        </div>
        <Link to="/customer/restaurants" className="cd-btn-primary">
          <span className="material-symbols-outlined">add</span>
          New order
        </Link>
      </div>

      {error ? <div className="cd-alert-error">{error}</div> : null}

      <div className="cd-panel">
        {loading ? (
          <p className="cd-empty">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="cd-empty">
            No orders yet.{" "}
            <Link to="/customer/restaurants">Browse restaurants</Link>
          </p>
        ) : (
          <ul className="cd-order-list">
            {orders.map((order) => (
              <li key={order._id}>
                <Link to={`/customer/orders/${order._id}`} className="cd-order-item">
                  <div>
                    <p className="cd-order-name">Order #{String(order._id).slice(-6)}</p>
                    <p className="cd-order-meta">
                      {restaurantNameFor(order, nameById)} · $
                      {Number(order.totalAmount).toFixed(2)} · Placed {formatDate(order.createdAt)}
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
    </CustomerLayout>
  );
}

export default CustomerOrders;
