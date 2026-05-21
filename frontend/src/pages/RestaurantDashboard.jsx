import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStatus, updateStatus } from "../api/restaurant";
import { getRestaurantOrders, updateOrderStatus } from "../api/orders";
import { connectSocket } from "../socket";
import Button from "../components/Button";
import styles from "./pages.module.css";

function RestaurantDashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orderActionId, setOrderActionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError("");
      try {
        const data = await getStatus();
        if (!cancelled) setStatus(data.status || "open");
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load status");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
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
    if (!socket) return () => {
      cancelled = true;
    };

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

  const handleOrderStatus = async (orderId, status) => {
    setOrderActionId(orderId);
    setOrdersError("");
    try {
      await updateOrderStatus(orderId, status);
    } catch (e) {
      setOrdersError(e.message || "Order update failed");
    } finally {
      setOrderActionId(null);
    }
  };

  const applyStatus = async (next) => {
    setSaving(true);
    setError("");
    try {
      const data = await updateStatus(next);
      setStatus(data.status || next);
    } catch (e) {
      setError(e.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const normalizedStatus = (status || "open").toLowerCase();
  const statusLabel =
    normalizedStatus === "open" || normalizedStatus === "closed" || normalizedStatus === "busy"
      ? normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
      : "Open";

  const badgeStyle = (() => {
    const base = {
      display: "inline-block",
      marginTop: "0.5rem",
      marginBottom: "0.25rem",
      padding: "0.35rem 0.65rem",
      borderRadius: "6px",
      fontSize: "0.875rem",
      fontWeight: 600,
    };
    if (normalizedStatus === "open") {
      return { ...base, backgroundColor: "#d1fae5", color: "#065f46" };
    }
    if (normalizedStatus === "closed") {
      return { ...base, backgroundColor: "#fee2e2", color: "#991b1b" };
    }
    if (normalizedStatus === "busy") {
      return { ...base, backgroundColor: "#fef9c3", color: "#854d0e" };
    }
    return { ...base, backgroundColor: "#d1fae5", color: "#065f46" };
  })();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Restaurant dashboard</h1>
      {loading ? (
        <span className={styles.hint} style={{ display: "inline-block", marginTop: "0.5rem" }}>
          Loading status…
        </span>
      ) : (
        <span style={badgeStyle}>Status: {statusLabel}</span>
      )}
      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.actions} style={{ marginTop: "1.25rem", marginBottom: "1.5rem" }}>
        <Button text="Manage menu" onClick={() => navigate("/restaurant/menu")} disabled={false} />
        <Button
          text="Manage categories"
          onClick={() => navigate("/restaurant/categories")}
          disabled={false}
        />
        <Button
          text="Change status"
          onClick={() => document.getElementById("status")?.scrollIntoView({ behavior: "smooth" })}
          disabled={false}
        />
      </div>

      <section style={{ marginTop: "1.5rem" }}>
        <h2 className={styles.title} style={{ fontSize: "1.125rem" }}>
          Orders
        </h2>
        {ordersLoading ? <p className={styles.hint}>Loading orders…</p> : null}
        {ordersError ? <div className={styles.error}>{ordersError}</div> : null}
        {!ordersLoading && orders.length === 0 ? <p className={styles.hint}>No orders yet.</p> : null}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {orders.map((order) => (
            <li key={order._id} style={{ marginBottom: "0.75rem" }}>
              <span>
                Order {String(order._id).slice(-6)} — {order.status} — ${order.totalAmount?.toFixed(2)}
              </span>
              <div className={styles.actions} style={{ marginTop: "0.25rem" }}>
                {order.status === "PLACED" ? (
                  <button
                    type="button"
                    disabled={orderActionId === order._id}
                    onClick={() => handleOrderStatus(order._id, "ACCEPTED")}
                  >
                    Accept
                  </button>
                ) : null}
                {order.status === "ACCEPTED" ? (
                  <button
                    type="button"
                    disabled={orderActionId === order._id}
                    onClick={() => handleOrderStatus(order._id, "PREPARING")}
                  >
                    Preparing
                  </button>
                ) : null}
                {["PLACED", "ACCEPTED", "PREPARING"].includes(order.status) ? (
                  <button
                    type="button"
                    disabled={orderActionId === order._id}
                    onClick={() => handleOrderStatus(order._id, "CANCELLED")}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="status">
        <h2 className={styles.title} style={{ fontSize: "1.125rem" }}>
          Change status
        </h2>
        <p className={styles.hint}>Set whether you are accepting orders.</p>
        <div className={styles.actions}>
          <button type="button" disabled={saving || loading} onClick={() => applyStatus("open")}>
            Open
          </button>
          <button type="button" disabled={saving || loading} onClick={() => applyStatus("closed")}>
            Closed
          </button>
          <button type="button" disabled={saving || loading} onClick={() => applyStatus("busy")}>
            Busy
          </button>
        </div>
      </section>
    </div>
  );
}

export default RestaurantDashboard;
