import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRestaurant } from "../api/restaurant";
import { getMenuByRestaurant } from "../api/menu";
import styles from "./pages.module.css";

function CustomerRestaurantMenu() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([getRestaurant(id), getMenuByRestaurant(id)])
      .then(([restaurantRes, menuRes]) => {
        if (cancelled) return;
        setRestaurant(restaurantRes.restaurant || null);
        setItems(menuRes.items || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load restaurant");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className={styles.page}>
      <p className={styles.hint}>
        <Link to="/customer/restaurants">← All restaurants</Link>
      </p>
      {error ? <div className={styles.error}>{error}</div> : null}
      {loading ? (
        <p className={styles.hint}>Loading…</p>
      ) : restaurant ? (
        <>
          <h1 className={styles.title}>{restaurant.name}</h1>
          <p className={styles.hint}>
            {restaurant.location}
            {restaurant.cuisine ? ` · ${restaurant.cuisine}` : ""}
            {restaurant.rating != null ? ` · ★ ${restaurant.rating}` : ""}
            {restaurant.status ? ` · ${restaurant.status}` : ""}
          </p>
          {restaurant.image ? (
            <img
              src={restaurant.image}
              alt=""
              width={120}
              height={80}
              style={{ objectFit: "cover", borderRadius: 4, marginBottom: "1rem" }}
            />
          ) : null}
          <h2 className={styles.title} style={{ fontSize: "1.125rem" }}>
            Menu
          </h2>
          {items.length === 0 ? (
            <p className={styles.hint}>No menu items available.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {items.map((item) => (
                <li
                  key={item.itemId}
                  style={{
                    borderBottom: "1px solid #d6d3d1",
                    padding: "0.75rem 0",
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-start",
                  }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      width={56}
                      height={56}
                      style={{ objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                    />
                  ) : null}
                  <div>
                    <strong>{item.name}</strong>
                    {item.category ? (
                      <span className={styles.hint}> · {item.category}</span>
                    ) : null}
                    <div className={styles.hint}>{item.description}</div>
                    <div>${Number(item.price).toFixed(2)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : !error ? (
        <p className={styles.hint}>Restaurant not found.</p>
      ) : null}
    </div>
  );
}

export default CustomerRestaurantMenu;
