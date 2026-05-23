import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRestaurant } from "../api/restaurant";
import { getMenuByRestaurant } from "../api/menu";
import { createOrder } from "../api/orders";
import Button from "../components/Button";
import styles from "./pages.module.css";

function CustomerRestaurantMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

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

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.menuItemId === item.itemId);
      if (existing) {
        return prev.map((line) =>
          line.menuItemId === item.itemId
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ];
    });
  };

  const cartTotal = cart.reduce(
    (sum, line) => sum + Number(line.price) * line.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError("Add at least one item to your cart");
      return;
    }
    setError("");
    setPlacing(true);
    try {
      await createOrder({
        restaurantId: id,
        items: cart.map(({ menuItemId, name, quantity, price }) => ({
          menuItemId,
          name,
          quantity,
          price,
        })),
      });
      setCart([]);
      navigate("/customer/orders");
    } catch (e) {
      setError(e.message || "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

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
                  <div style={{ flex: 1 }}>
                    <strong>{item.name}</strong>
                    {item.category ? (
                      <span className={styles.hint}> · {item.category}</span>
                    ) : null}
                    <div className={styles.hint}>{item.description}</div>
                    <div>${Number(item.price).toFixed(2)}</div>
                    <div style={{ marginTop: "0.5rem" }}>
                      <Button
                        text="Add to Cart"
                        onClick={() => addToCart(item)}
                        disabled={false}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <section style={{ marginTop: "1.5rem" }}>
            <h2 className={styles.title} style={{ fontSize: "1.125rem" }}>
              Cart
            </h2>
            {cart.length === 0 ? (
              <p className={styles.hint}>Your cart is empty.</p>
            ) : (
              <>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {cart.map((line) => (
                    <li
                      key={line.menuItemId}
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
                <p style={{ marginTop: "0.75rem" }}>
                  <strong>Total: ${cartTotal.toFixed(2)}</strong>
                </p>
                <div className={styles.actions}>
                  <Button
                    text={placing ? "Placing order…" : "Place Order"}
                    onClick={handlePlaceOrder}
                    disabled={placing}
                  />
                </div>
              </>
            )}
          </section>
        </>
      ) : !error ? (
        <p className={styles.hint}>Restaurant not found.</p>
      ) : null}
    </div>
  );
}

export default CustomerRestaurantMenu;
