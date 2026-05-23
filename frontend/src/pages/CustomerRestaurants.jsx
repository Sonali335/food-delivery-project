import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllRestaurants } from "../api/restaurant";
import styles from "./pages.module.css";

function CustomerRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getAllRestaurants()
      .then(({ restaurants: list }) => {
        if (!cancelled) setRestaurants(list || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load restaurants");
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
      <h1 className={styles.title}>Restaurants</h1>
      <p className={styles.hint}>
        <Link to="/dashboard">Back to dashboard</Link>
      </p>
      {error ? <div className={styles.error}>{error}</div> : null}
      {loading ? (
        <p className={styles.hint}>Loading…</p>
      ) : restaurants.length === 0 ? (
        <p className={styles.hint}>No restaurants available.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {restaurants.map((r) => (
            <li
              key={r.id}
              style={{
                borderBottom: "1px solid #d6d3d1",
                padding: "0.75rem 0",
              }}
            >
              <Link to={`/customer/restaurant/${r.id}`}>
                <strong>{r.name}</strong>
              </Link>
              <div className={styles.hint} style={{ marginTop: "0.25rem" }}>
                {r.location}
                {r.cuisine ? ` · ${r.cuisine}` : ""}
                {r.rating != null ? ` · ★ ${r.rating}` : ""}
                {r.status ? ` · ${r.status}` : ""}
              </div>
              {r.image ? (
                <img
                  src={r.image}
                  alt=""
                  width={80}
                  height={56}
                  style={{ objectFit: "cover", borderRadius: 4, marginTop: "0.5rem" }}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CustomerRestaurants;
