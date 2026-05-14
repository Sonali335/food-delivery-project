import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStatus, updateStatus } from "../api/restaurant";
import styles from "./pages.module.css";

function StatusBlock() {
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

  const apply = async (next) => {
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
    <div>
      <h2 className={styles.title} style={{ fontSize: "1.125rem" }}>
        Restaurant status
      </h2>
      {error ? <div className={styles.error}>{error}</div> : null}
      {loading ? (
        <p className={styles.hint}>Loading…</p>
      ) : (
        <>
          <p className={styles.success}>Current: {status}</p>
          <div className={styles.actions}>
            <button type="button" disabled={saving} onClick={() => apply("open")}>
              Open
            </button>
            <button type="button" disabled={saving} onClick={() => apply("closed")}>
              Closed
            </button>
            <button type="button" disabled={saving} onClick={() => apply("busy")}>
              Busy
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function RestaurantDashboard() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Restaurant dashboard</h1>
      <p className={styles.hint}>Choose an area to manage.</p>
      <div className={styles.cardGrid}>
        <Link className={styles.linkButton} to="/restaurant/menu">
          Manage menu items
        </Link>
        <Link className={styles.linkButton} to="/restaurant/categories">
          Manage categories
        </Link>
        <Link className={styles.linkButton} to="/restaurant/dashboard#status">
          Update restaurant status
        </Link>
      </div>
      <div id="status" style={{ marginTop: "2rem" }}>
        <StatusBlock />
      </div>
    </div>
  );
}

export default RestaurantDashboard;
