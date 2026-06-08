import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrder } from "../api/orders";
import { getRestaurant } from "../api/restaurant";
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

function CustomerOrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getOrder(id)
      .then(async ({ order: o }) => {
        if (cancelled) return;
        setOrder(o || null);
        if (!o?.restaurantId) return;
        try {
          const { restaurant: r } = await getRestaurant(String(o.restaurantId));
          if (!cancelled) setRestaurant(r || null);
        } catch {
          if (!cancelled) setRestaurant(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load order");
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
      if (String(payload.orderId) !== String(id)) return;
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: payload.status,
              updatedAt: payload.updatedAt,
            }
          : prev
      );
    };

    socket.on("order:update", onOrderUpdate);

    return () => {
      cancelled = true;
      socket.off("order:update", onOrderUpdate);
    };
  }, [id]);

  return (
    <CustomerLayout>
      <div className="cd-page-header">
        <div>
          <h1 className="cd-page-title">Order #{String(id).slice(-6)}</h1>
          {order ? (
            <p className="cd-page-subtitle">
              <span className={statusBadgeClass(order.status)} style={{ marginRight: "0.5rem" }}>
                {statusLabel(order.status)}
              </span>
              Placed {formatDate(order.createdAt)}
            </p>
          ) : null}
        </div>
        <Link to="/customer/orders" className="cd-btn-outline">
          <span className="material-symbols-outlined">arrow_back</span>
          All orders
        </Link>
      </div>

      {error ? <div className="cd-alert-error">{error}</div> : null}

      {loading ? (
        <p className="cd-empty">Loading order…</p>
      ) : order ? (
        <div className="cd-panel" style={{ maxWidth: "40rem" }}>
          {restaurant ? (
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f5f5f5" }}>
              <h3 className="cd-panel-title">Restaurant</h3>
              <p className="cd-order-meta" style={{ marginTop: "0.5rem" }}>
                <strong>{restaurant.name}</strong>
                {restaurant.location ? ` · ${restaurant.location}` : ""}
              </p>
            </div>
          ) : null}
          <div style={{ padding: "1.25rem 1.5rem" }}>
            <h3 className="cd-panel-title">Items</h3>
            <ul className="cd-order-list" style={{ marginTop: "0.75rem" }}>
              {(order.items || []).map((line, index) => (
                <li
                  key={`${line.menuItemId}-${index}`}
                  className="cd-order-item"
                  style={{ cursor: "default", paddingLeft: 0, paddingRight: 0 }}
                >
                  <div>
                    <p className="cd-order-name">
                      {line.name} × {line.quantity}
                    </p>
                    <p className="cd-order-meta">
                      ${(Number(line.price) * line.quantity).toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="cd-order-name" style={{ marginTop: "1.25rem" }}>
              Total: ${Number(order.totalAmount).toFixed(2)}
            </p>
            <p className="cd-order-meta" style={{ marginTop: "0.5rem" }}>
              Last updated {formatDate(order.updatedAt)}
            </p>
          </div>
        </div>
      ) : !error ? (
        <p className="cd-empty">Order not found.</p>
      ) : null}
    </CustomerLayout>
  );
}

export default CustomerOrderDetails;
