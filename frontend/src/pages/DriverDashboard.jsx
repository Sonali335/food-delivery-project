import { useEffect, useState } from "react";
import { getProfile } from "../api/profile";
import { updateLocation } from "../api/driver";
import { getDriverOrders, updateOrderStatus } from "../api/orders";
import { connectSocket } from "../socket";
import styles from "./pages.module.css";

function DriverDashboard() {
  const [driverName, setDriverName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locationSuccess, setLocationSuccess] = useState("");
  const [locationError, setLocationError] = useState("");
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orderActionId, setOrderActionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError("");
      try {
        const { profile } = await getProfile();
        if (!cancelled) {
          setDriverName(profile?.username?.trim() || "Driver");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Failed to load profile");
          setDriverName("Driver");
        }
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
        const { orders: list } = await getDriverOrders();
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

  const handleUpdateLocation = async () => {
    setLocationSuccess("");
    setLocationError("");
    setUpdatingLocation(true);
    try {
      await updateLocation(Number(lat), Number(lng));
      setLocationSuccess("Location updated successfully.");
    } catch (e) {
      setLocationError(e.message || "Failed to update location");
    } finally {
      setUpdatingLocation(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Driver dashboard</h1>
      {loading ? (
        <p className={styles.hint}>Loading…</p>
      ) : (
        <>
          <p>Welcome, {driverName}</p>
          <p>Role: Driver</p>
        </>
      )}
      {error ? <div className={styles.error}>{error}</div> : null}

      <section style={{ marginTop: "1rem" }}>
        <h2 className={styles.title} style={{ fontSize: "1.125rem" }}>
          Earnings Summary
        </h2>
        <p>Today&apos;s Earnings: $0.00</p>
        <p>Weekly Earnings: $0.00</p>
        <p>Total Earnings: $0.00</p>
      </section>

      <section style={{ marginTop: "1rem" }}>
        <h2 className={styles.title} style={{ fontSize: "1.125rem" }}>
          Update Location
        </h2>
        <label>
          Latitude
          <br />
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
        </label>
        <br />
        <label>
          Longitude
          <br />
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </label>
        <br />
        <button type="button" onClick={handleUpdateLocation} disabled={updatingLocation}>
          {updatingLocation ? "Updating…" : "Update Location"}
        </button>
        {locationSuccess ? <p className={styles.success}>{locationSuccess}</p> : null}
        {locationError ? <div className={styles.error}>{locationError}</div> : null}
      </section>

      <section style={{ marginTop: "1rem" }}>
        <h2 className={styles.title} style={{ fontSize: "1.125rem" }}>
          My deliveries
        </h2>
        {ordersLoading ? <p className={styles.hint}>Loading orders…</p> : null}
        {ordersError ? <div className={styles.error}>{ordersError}</div> : null}
        {!ordersLoading && orders.length === 0 ? (
          <p className={styles.hint}>No assigned deliveries yet.</p>
        ) : null}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {orders.map((order) => (
            <li key={order._id} style={{ marginBottom: "0.75rem" }}>
              <span>
                Order {String(order._id).slice(-6)} — {order.status} — ${order.totalAmount?.toFixed(2)}
              </span>
              <div className={styles.actions} style={{ marginTop: "0.25rem" }}>
                {order.status === "PREPARING" ? (
                  <button
                    type="button"
                    disabled={orderActionId === order._id}
                    onClick={() => handleOrderStatus(order._id, "PICKED_UP")}
                  >
                    Pick up
                  </button>
                ) : null}
                {order.status === "PICKED_UP" ? (
                  <button
                    type="button"
                    disabled={orderActionId === order._id}
                    onClick={() => handleOrderStatus(order._id, "DELIVERED")}
                  >
                    Mark delivered
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.actions} style={{ marginTop: "1rem" }}>
        <button type="button">Toggle Availability</button>
      </div>
    </div>
  );
}

export default DriverDashboard;
