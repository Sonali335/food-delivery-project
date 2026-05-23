import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { getHomePathForRole } from "../utils/roleHome";
import Button from "../components/Button";
import { deleteProfile } from "../api/profile";
import { getCustomerOrders } from "../api/orders";
import { connectSocket } from "../socket";
import styles from "./pages.module.css";

const SETUP_BY_ROLE = {
  customer: "/setup/customer",
  driver: "/setup/driver",
  restaurant: "/setup/restaurant",
};

function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "unknown";
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const setupPath = SETUP_BY_ROLE[role];

  useEffect(() => {
    if (role !== "customer") return undefined;

    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError("");
    getCustomerOrders()
      .then(({ orders: list }) => {
        if (!cancelled) setOrders(list || []);
      })
      .catch((e) => {
        if (!cancelled) setOrdersError(e.message || "Failed to load orders");
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    const socket = connectSocket();
    if (!socket) return () => {
      cancelled = true;
    };

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
  }, [role]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleUpdateProfile = () => {
    if (setupPath) navigate(setupPath);
  };

  const handleDeleteProfile = async () => {
    setDeleteError("");
    const ok = window.confirm(
      "This will permanently delete your profile and account. Continue?"
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteProfile();
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      setDeleteError(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (role === "restaurant" || role === "driver") {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.success}>Logged in as: {role}</p>
      {deleteError ? <div className={styles.error}>{deleteError}</div> : null}

      {role === "customer" ? (
        <section style={{ marginTop: "1rem" }}>
          <h2 className={styles.title} style={{ fontSize: "1.125rem" }}>
            My orders
          </h2>
          {ordersLoading ? <p className={styles.hint}>Loading orders…</p> : null}
          {ordersError ? <div className={styles.error}>{ordersError}</div> : null}
          {!ordersLoading && !ordersError && orders.length === 0 ? (
            <p className={styles.hint}>No orders yet.</p>
          ) : null}
          <ul style={{ listStyle: "none", padding: 0 }}>
            {orders.map((order) => (
              <li key={order._id} style={{ marginBottom: "0.5rem" }}>
                Order {String(order._id).slice(-6)} — {order.status} — ${order.totalAmount?.toFixed(2)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className={styles.actions}>
        <Button
          text="Update profile"
          onClick={handleUpdateProfile}
          disabled={!setupPath}
        />
        <Button
          text={deleting ? "Deleting..." : "Delete profile"}
          onClick={handleDeleteProfile}
          disabled={deleting || !setupPath}
        />
        <Button text="Log out" onClick={handleLogout} disabled={false} />
      </div>
    </div>
  );
}

export default Dashboard;
