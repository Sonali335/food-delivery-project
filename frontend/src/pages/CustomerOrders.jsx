import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCustomerOrders } from "../api/orders";
import styles from "./pages.module.css";

function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getCustomerOrders()
      .then(({ orders: list }) => {
        if (!cancelled) setOrders(list || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load orders");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
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
              Order {String(order._id).slice(-6)} — {order.status} — $
              {Number(order.totalAmount).toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CustomerOrders;
