import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrder } from "../api/orders";
import { getRestaurant } from "../api/restaurant";
import { connectSocket } from "../socket";
import styles from "./pages.module.css";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
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
    <div className={styles.page}>
      <p className={styles.hint}>
        <Link to="/customer/orders">← All orders</Link>
      </p>
      {error ? <div className={styles.error}>{error}</div> : null}
      {loading ? (
        <p className={styles.hint}>Loading…</p>
      ) : order ? (
        <>
          <h1 className={styles.title}>Order {String(order._id).slice(-6)}</h1>
          <p>
            <strong>Status:</strong> {order.status}
          </p>
          {restaurant ? (
            <section style={{ marginTop: "1rem" }}>
              <h2 className={styles.title} style={{ fontSize: "1.125rem" }}>
                Restaurant
              </h2>
              <p className={styles.hint}>
                <strong>{restaurant.name}</strong>
                {restaurant.location ? ` · ${restaurant.location}` : ""}
                {restaurant.status ? ` · ${restaurant.status}` : ""}
              </p>
            </section>
          ) : (
            <p className={styles.hint} style={{ marginTop: "1rem" }}>
              Restaurant ID: {String(order.restaurantId)}
            </p>
          )}
          <section style={{ marginTop: "1rem" }}>
            <h2 className={styles.title} style={{ fontSize: "1.125rem" }}>
              Items
            </h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {(order.items || []).map((line, index) => (
                <li
                  key={`${line.menuItemId}-${index}`}
                  style={{
                    borderBottom: "1px solid #d6d3d1",
                    padding: "0.5rem 0",
                  }}
                >
                  {line.name} × {line.quantity} — $
                  {(Number(line.price) * line.quantity).toFixed(2)}
                </li>
              ))}
            </ul>
          </section>
          <p style={{ marginTop: "1rem" }}>
            <strong>Total:</strong> ${Number(order.totalAmount).toFixed(2)}
          </p>
          <p className={styles.hint}>Placed {formatDate(order.createdAt)}</p>
          <p className={styles.hint}>Last updated {formatDate(order.updatedAt)}</p>
        </>
      ) : !error ? (
        <p className={styles.hint}>Order not found.</p>
      ) : null}
    </div>
  );
}

export default CustomerOrderDetails;
