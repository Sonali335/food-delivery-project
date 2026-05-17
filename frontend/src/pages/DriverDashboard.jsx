import { useEffect, useState } from "react";
import { getProfile } from "../api/profile";
import styles from "./pages.module.css";

function DriverDashboard() {
  const [driverName, setDriverName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      <div className={styles.actions} style={{ marginTop: "1rem" }}>
        <button type="button">Toggle Availability</button>
        <button type="button">My Deliveries</button>
      </div>
    </div>
  );
}

export default DriverDashboard;
