import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRestaurant } from "../api/restaurant";
import { getMenuByRestaurant } from "../api/menu";
import { createOrder } from "../api/orders";
import CustomerLayout from "../components/customer/CustomerLayout";
import { loadStoredCart, saveStoredCart } from "../utils/customerCart";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { formatPrepTimeLabel, maxPrepTimeFromItems } from "../utils/prepTime";
import "../components/customer/customer-dashboard.css";

const DELIVERY_FEE = 2.99;

function slugifyCategory(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function categoryIcon(name) {
  const n = String(name).toLowerCase();
  if (n.includes("drink") || n.includes("beverage")) return "local_bar";
  if (n.includes("dessert") || n.includes("sweet")) return "icecream";
  if (n.includes("side") || n.includes("extra")) return "flatware";
  if (n.includes("featured") || n.includes("popular")) return "star";
  return "restaurant";
}

function groupItemsByCategory(items) {
  const map = new Map();
  items.forEach((item) => {
    const cat = item.category?.trim() || "Menu";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(item);
  });
  return Array.from(map.entries()).map(([name, list]) => ({
    name,
    id: slugifyCategory(name),
    items: list,
  }));
}

function MenuItemCard({ item, onAdd }) {
  return (
    <article className="cd-menu-card">
      <div className="cd-menu-card-image">
        {item.image ? <img src={resolveMediaUrl(item.image) || item.image} alt="" /> : null}
      </div>
      <div className="cd-menu-card-body">
        <div className="cd-menu-card-head">
          <h4>{item.name}</h4>
          <span className="cd-menu-card-price">${Number(item.price).toFixed(2)}</span>
        </div>
        {item.description ? <p className="cd-menu-card-desc">{item.description}</p> : null}
        {item.prepTime != null ? (
          <p className="cd-menu-prep-time">Prep: {formatPrepTimeLabel(item.prepTime)}</p>
        ) : null}
        <button type="button" className="cd-menu-card-add" onClick={() => onAdd(item)}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>
            add
          </span>
          Add to cart
        </button>
      </div>
    </article>
  );
}

function MenuItemRow({ item, onAdd }) {
  return (
    <article className="cd-menu-row">
      <div className="cd-menu-row-thumb">
        {item.image ? <img src={resolveMediaUrl(item.image) || item.image} alt="" /> : null}
      </div>
      <div className="cd-menu-row-body">
        <div>
          <div className="cd-menu-card-head">
            <h4>{item.name}</h4>
            <span className="cd-menu-card-price">${Number(item.price).toFixed(2)}</span>
          </div>
          {item.description ? (
            <p className="cd-menu-card-desc" style={{ marginBottom: 0 }}>
              {item.description}
            </p>
          ) : null}
          {item.prepTime != null ? (
            <p className="cd-menu-prep-time" style={{ marginTop: "0.25rem" }}>
              Prep: {formatPrepTimeLabel(item.prepTime)}
            </p>
          ) : null}
        </div>
        <button type="button" className="cd-menu-row-add" onClick={() => onAdd(item)}>
          Add
        </button>
      </div>
    </article>
  );
}

function CustomerRestaurantMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    const stored = loadStoredCart();
    if (stored.restaurantId === id && stored.lines.length) {
      setCart(stored.lines);
    }
  }, [id]);

  useEffect(() => {
    saveStoredCart(id, cart);
  }, [id, cart]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([getRestaurant(id), getMenuByRestaurant(id)])
      .then(([restaurantRes, menuRes]) => {
        if (cancelled) return;
        setRestaurant(restaurantRes.restaurant || null);
        const list = (menuRes.items || []).map((item) => ({
          ...item,
          image: resolveMediaUrl(item.image) || item.image,
        }));
        setItems(list);
        const groups = groupItemsByCategory(list);
        if (groups.length > 0) setActiveCategory(groups[0].id);
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

  const categories = useMemo(() => groupItemsByCategory(items), [items]);

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => sum + Number(line.price) * line.quantity, 0);
  const total = cart.length > 0 ? subtotal + DELIVERY_FEE : 0;
  const cartPrepMinutes = useMemo(() => maxPrepTimeFromItems(cart), [cart]);

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
          prepTime: item.prepTime,
        },
      ];
    });
  };

  const removeFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((line) => line.menuItemId !== menuItemId));
  };

  const changeQuantity = (menuItemId, delta) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.menuItemId !== menuItemId) return line;
          const next = line.quantity + delta;
          if (next <= 0) return null;
          return { ...line, quantity: next };
        })
        .filter(Boolean)
    );
  };

  const scrollToCategory = (catId) => {
    setActiveCategory(catId);
    const el = document.getElementById(`menu-cat-${catId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
      saveStoredCart(null, []);
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
      <Link to="/customer/restaurants" className="cd-browse-back">
        <span className="material-symbols-outlined">arrow_back</span>
        All restaurants
      </Link>

      {error ? <div className="cd-alert-error">{error}</div> : null}

      {loading ? (
        <p className="cd-empty">Loading menu…</p>
      ) : restaurant ? (
        <div className="cd-menu-layout">
          {/* Left: category nav */}
          <aside className="cd-menu-categories">
            <span className="cd-menu-cat-label">Menu</span>
            {categories.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`cd-menu-cat-link ${activeCategory === group.id ? "cd-menu-cat-link-active" : ""}`}
                onClick={() => scrollToCategory(group.id)}
              >
                <span
                  className="material-symbols-outlined"
                  style={
                    activeCategory === group.id
                      ? { fontVariationSettings: "'FILL' 1" }
                      : undefined
                  }
                >
                  {categoryIcon(group.name)}
                </span>
                {group.name}
              </button>
            ))}
          </aside>

          {/* Center: menu */}
          <section className="cd-menu-content">
            <div className="cd-menu-hero">
              {restaurant.image ? (
                <img src={resolveMediaUrl(restaurant.image) || restaurant.image} alt="" />
              ) : null}
              <div className="cd-menu-hero-overlay" />
              <div className="cd-menu-hero-text">
                <h2>{restaurant.name}</h2>
                <p className="cd-menu-hero-meta">
                  {restaurant.rating != null ? (
                    <>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: "'FILL' 1", color: "#34d399" }}
                      >
                        stars
                      </span>
                      {restaurant.rating} ·{" "}
                    </>
                  ) : null}
                  {restaurant.location}
                  {restaurant.cuisine ? ` · ${restaurant.cuisine}` : ""}
                  {restaurant.status ? ` · ${restaurant.status}` : ""}
                </p>
              </div>
            </div>

            {categories.length > 0 ? (
              <div className="cd-menu-cat-tabs">
                {categories.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    className={`cd-menu-cat-tab ${activeCategory === group.id ? "cd-menu-cat-tab-active" : ""}`}
                    onClick={() => scrollToCategory(group.id)}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            ) : null}

            {items.length === 0 ? (
              <p className="cd-empty">No menu items available.</p>
            ) : (
              categories.map((group, index) => (
                <div key={group.id} id={`menu-cat-${group.id}`} className="cd-menu-section">
                  <h3 className="cd-menu-section-title">
                    {index === 0 ? "Popular choices" : group.name}
                  </h3>
                  {index === 0 ? (
                    <div className="cd-menu-grid">
                      {group.items.map((item) => (
                        <MenuItemCard key={item.itemId} item={item} onAdd={addToCart} />
                      ))}
                    </div>
                  ) : (
                    group.items.map((item) => (
                      <MenuItemRow key={item.itemId} item={item} onAdd={addToCart} />
                    ))
                  )}
                </div>
              ))
            )}
          </section>

          {/* Right: sticky cart */}
          <aside className="cd-menu-cart">
            <div className="cd-menu-cart-panel">
              <div className="cd-menu-cart-header">
                <h3>Your order</h3>
                <span className="cd-menu-cart-count">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="cd-menu-cart-items">
                {cart.length === 0 ? (
                  <p className="cd-empty" style={{ padding: 0 }}>
                    Your cart is empty. Add items from the menu.
                  </p>
                ) : (
                  <>
                    {cart.map((line) => (
                      <div key={line.menuItemId} className="cd-menu-cart-line">
                        <div className="cd-menu-cart-line-info">
                          <p className="cd-menu-cart-line-name">{line.name}</p>
                          <div className="cd-menu-qty">
                            <button
                              type="button"
                              className="cd-menu-qty-btn"
                              onClick={() => changeQuantity(line.menuItemId, -1)}
                              aria-label="Decrease quantity"
                            >
                              <span className="material-symbols-outlined">remove</span>
                            </button>
                            <span className="cd-menu-qty-value">{line.quantity}</span>
                            <button
                              type="button"
                              className="cd-menu-qty-btn"
                              onClick={() => changeQuantity(line.menuItemId, 1)}
                              aria-label="Increase quantity"
                            >
                              <span className="material-symbols-outlined">add</span>
                            </button>
                          </div>
                        </div>
                        <div className="cd-menu-cart-line-end">
                          <span className="cd-menu-cart-line-price">
                            ${(Number(line.price) * line.quantity).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            className="cd-menu-cart-delete"
                            onClick={() => removeFromCart(line.menuItemId)}
                            aria-label={`Remove ${line.name}`}
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {cartPrepMinutes ? (
                      <p className="cd-menu-cart-prep">
                        Est. prep time: up to {formatPrepTimeLabel(cartPrepMinutes)}
                      </p>
                    ) : null}

                    <div className="cd-menu-cart-totals">
                      <div className="cd-menu-cart-total-row">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="cd-menu-cart-total-row">
                        <span>Delivery fee</span>
                        <span>${DELIVERY_FEE.toFixed(2)}</span>
                      </div>
                      <div className="cd-menu-cart-grand">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="cd-menu-cart-footer">
                <button
                  type="button"
                  className="cd-menu-checkout"
                  disabled={placing || cart.length === 0}
                  onClick={handlePlaceOrder}
                >
                  <span className="material-symbols-outlined">shopping_bag</span>
                  {placing ? "Placing order…" : "Checkout"}
                </button>
                <p className="cd-menu-cart-hint">Taxes and fees may apply at checkout.</p>
              </div>
            </div>
          </aside>
        </div>
      ) : !error ? (
        <p className="cd-empty">Restaurant not found.</p>
      ) : null}
    </CustomerLayout>
  );
}

export default CustomerRestaurantMenu;
