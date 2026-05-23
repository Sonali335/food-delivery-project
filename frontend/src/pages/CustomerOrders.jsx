import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCustomerOrders } from "../api/orders";
import { getAllRestaurants } from "../api/restaurant";
import { connectSocket } from "../socket";
import styles from "./pages.module.css";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
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
    <div className={styles.page}>
      <h1 className={styles.title}>My orders</h1>
      <p className={styles.hint}>
        <Link to="/customer/restaurants">Browse restaurants</Link>
        {" · "}
        <Link to="/dashboard">Dashboard</Link>
      </p>
      {error ? <div className={styles.error}>{error}</div> : null}
      {loading ? (
        <p className={styles.hint}>Loading…</p>
      ) : orders.length === 0 ? (
        <p className={styles.hint}>No orders yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {orders.map((order) => (
            <li
              key={order._id}
              style={{
                borderBottom: "1px solid #d6d3d1",
                padding: "0.75rem 0",
              }}
            >
              <Link to={`/customer/orders/${order._id}`}>
                <strong>Order {String(order._id).slice(-6)}</strong>
              </Link>
              <div className={styles.hint} style={{ marginTop: "0.25rem" }}>
                {restaurantNameFor(order, nameById)} · {order.status} · $
                {Number(order.totalAmount).toFixed(2)}
              </div>
              <div className={styles.hint}>Placed {formatDate(order.createdAt)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CustomerOrders;
