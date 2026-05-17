import { useEffect, useState } from "react";
import { getProfile } from "../api/profile";
import { updateLocation } from "../api/driver";
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

      <div className={styles.actions} style={{ marginTop: "1rem" }}>
        <button type="button">Toggle Availability</button>
        <button type="button">My Deliveries</button>
      </div>
    </div>
  );
}

export default DriverDashboard;
