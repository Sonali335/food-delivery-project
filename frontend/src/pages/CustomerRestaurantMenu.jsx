import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRestaurant } from "../api/restaurant";
import { getMenuByRestaurant } from "../api/menu";
import { createOrder } from "../api/orders";
import CustomerLayout from "../components/customer/CustomerLayout";
import "../components/customer/customer-dashboard.css";

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
    <CustomerLayout>
      <div className="cd-page-header">
        <div>
          <h1 className="cd-page-title">{restaurant?.name || "Restaurant"}</h1>
          {restaurant ? (
            <p className="cd-page-subtitle">
              {restaurant.location}
              {restaurant.cuisine ? ` · ${restaurant.cuisine}` : ""}
              {restaurant.rating != null ? ` · ★ ${restaurant.rating}` : ""}
            </p>
          ) : null}
        </div>
        <Link to="/customer/restaurants" className="cd-btn-outline">
          <span className="material-symbols-outlined">arrow_back</span>
          All restaurants
        </Link>
      </div>

      {error ? <div className="cd-alert-error">{error}</div> : null}

      {loading ? (
        <p className="cd-empty">Loading menu…</p>
      ) : restaurant ? (
        <div className="cd-content-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="cd-panel">
            <div className="cd-panel-header">
              <h3 className="cd-panel-title">Menu</h3>
            </div>
            {items.length === 0 ? (
              <p className="cd-empty">No menu items available.</p>
            ) : (
              <ul className="cd-order-list">
                {items.map((item) => (
                  <li key={item.itemId} className="cd-order-item" style={{ cursor: "default" }}>
                    <div style={{ display: "flex", gap: "0.75rem", flex: 1 }}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          width={56}
                          height={56}
                          style={{ objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                        />
                      ) : null}
                      <div>
                        <p className="cd-order-name">{item.name}</p>
                        <p className="cd-order-meta">
                          {item.category ? `${item.category} · ` : ""}
                          {item.description || ""}
                        </p>
                        <p className="cd-order-meta">${Number(item.price).toFixed(2)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cd-btn-primary"
                      style={{ flexShrink: 0 }}
                      onClick={() => addToCart(item)}
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="cd-panel">
            <div className="cd-panel-header">
              <h3 className="cd-panel-title">Your cart</h3>
            </div>
            {cart.length === 0 ? (
              <p className="cd-empty">Your cart is empty.</p>
            ) : (
              <>
                <ul className="cd-order-list">
                  {cart.map((line) => (
                    <li key={line.menuItemId} className="cd-order-item" style={{ cursor: "default" }}>
                      <div>
                        <p className="cd-order-name">
                          {line.name} × {line.quantity}
                        </p>
                        <p className="cd-order-meta">
                          ${(Number(line.price) * line.quantity).toFixed(2)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div style={{ padding: "1rem 1.5rem 1.5rem" }}>
                  <p className="cd-order-name" style={{ marginBottom: "1rem" }}>
                    Total: ${cartTotal.toFixed(2)}
                  </p>
                  <button
                    type="button"
                    className="cd-btn-primary"
                    disabled={placing}
                    onClick={handlePlaceOrder}
                  >
                    {placing ? "Placing order…" : "Place order"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : !error ? (
        <p className="cd-empty">Restaurant not found.</p>
      ) : null}
    </CustomerLayout>
  );
}

export default CustomerRestaurantMenu;
