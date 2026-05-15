import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStatus, updateStatus } from "../api/restaurant";
import Button from "../components/Button";
import styles from "./pages.module.css";

function RestaurantDashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Restaurant dashboard</h1>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 className={styles.title} style={{ fontSize: "1.125rem" }}>
          Current restaurant status
        </h2>
        {error ? <div className={styles.error}>{error}</div> : null}
        {loading ? (
          <p className={styles.hint}>Loading status…</p>
        ) : (
          <p className={styles.success} style={{ marginBottom: "0.75rem" }}>
            {status}
          </p>
        )}
      </section>

      <div className={styles.actions} style={{ marginBottom: "1.5rem" }}>
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
