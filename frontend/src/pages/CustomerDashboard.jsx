import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCustomerOrders } from "../api/orders";
import { getAllRestaurants } from "../api/restaurant";
import { connectSocket } from "../socket";
import { resolveMediaUrl } from "../utils/mediaUrl";
import CustomerLayout from "../components/customer/CustomerLayout";
import "../components/customer/customer-dashboard.css";

const ACTIVE_STATUSES = ["PLACED", "ACCEPTED", "PREPARING", "PICKED_UP"];

const FILTER_CHIPS = [
  { id: "all", label: "All restaurants" },
  { id: "open", label: "Open now" },
  { id: "rated", label: "Top rated" },
];

function statusLabel(status) {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function CustomerDashboard() {
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get("q") || "").trim().toLowerCase();
  const [restaurants, setRestaurants] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [nameById, setNameById] = useState({});
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([getAllRestaurants(), getCustomerOrders()])
      .then(([restaurantsRes, ordersRes]) => {
        if (cancelled) return;
        const list = restaurantsRes.restaurants || [];
        const map = {};
        list.forEach((r) => {
          map[String(r.id)] = r.name;
        });
        setNameById(map);
        setRestaurants(list);
        const orders = ordersRes.orders || [];
        setActiveOrder(orders.find((o) => ACTIVE_STATUSES.includes(o.status)) || null);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load restaurants");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const socket = connectSocket();
    if (!socket) {
      return () => {
        cancelled = true;
      };
    }
    const onOrderUpdate = (payload) => {
      setActiveOrder((prev) => {
        if (!prev || String(prev._id) !== payload.orderId) return prev;
        return { ...prev, status: payload.status };
      });
    };
    socket.on("order:update", onOrderUpdate);
    return () => {
      cancelled = true;
      socket.off("order:update", onOrderUpdate);
    };
  }, []);

  const cuisineOptions = useMemo(() => {
    const set = new Set();
    restaurants.forEach((r) => {
      if (r.cuisine) set.add(r.cuisine);
    });
    return Array.from(set).sort();
  }, [restaurants]);

  const [cuisineFilter, setCuisineFilter] = useState("");

  const filtered = useMemo(() => {
    let list = [...restaurants];
    if (searchQuery) {
      list = list.filter((r) => {
        const hay = `${r.name} ${r.location || ""} ${r.cuisine || ""}`.toLowerCase();
        return hay.includes(searchQuery);
      });
    }
    if (cuisineFilter) {
      list = list.filter((r) => r.cuisine === cuisineFilter);
    }
    if (filter === "open") {
      list = list.filter((r) => r.status === "open");
    }
    if (filter === "rated") {
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    return list;
  }, [restaurants, searchQuery, filter, cuisineFilter]);

  return (
    <CustomerLayout>
      <div className="cd-browse-layout">
        <aside className="cd-browse-sidebar">
          <section className="cd-browse-filter-section">
            <h3>Cuisine</h3>
            <button
              type="button"
              className={`cd-browse-cuisine-chip ${!cuisineFilter ? "cd-browse-cuisine-chip-active" : ""}`}
              onClick={() => setCuisineFilter("")}
            >
              All
            </button>
            {cuisineOptions.map((c) => (
              <button
                key={c}
                type="button"
                className={`cd-browse-cuisine-chip ${cuisineFilter === c ? "cd-browse-cuisine-chip-active" : ""}`}
                onClick={() => setCuisineFilter(c === cuisineFilter ? "" : c)}
              >
                {c}
              </button>
            ))}
          </section>
          <section className="cd-browse-filter-section">
            <h3>Status</h3>
            <label className="cd-browse-check">
              <input
                type="checkbox"
                checked={filter === "open"}
                onChange={(e) => setFilter(e.target.checked ? "open" : "all")}
              />
              Open for orders
            </label>
          </section>
        </aside>

        <section className="cd-browse-main">
          {error ? <div className="cd-alert-error">{error}</div> : null}

          {activeOrder ? (
            <div className="cd-active-banner">
              <div>
                <p className="cd-active-banner-label">Order in progress</p>
                <p className="cd-active-banner-text">
                  {nameById[String(activeOrder.restaurantId)] || "Restaurant"} ·{" "}
                  {statusLabel(activeOrder.status)} · $
                  {Number(activeOrder.totalAmount).toFixed(2)}
                </p>
              </div>
              <Link to={`/customer/orders/${activeOrder._id}`} className="cd-btn-outline">
                Track order
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          ) : null}

          <div className="cd-hero-promo">
            <div className="cd-hero-promo-content">
              <span className="cd-hero-promo-badge">Welcome</span>
              <h1>Order from local restaurants</h1>
              <p>Browse menus, add to your cart, and track delivery in real time.</p>
              <Link to="/customer/orders" className="cd-hero-promo-btn">
                View your orders
              </Link>
            </div>
          </div>

          <div className="cd-browse-chips">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={`cd-browse-chip ${filter === chip.id ? "cd-browse-chip-active" : ""}`}
                onClick={() => setFilter(chip.id)}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="cd-browse-section-head">
            <h2>Restaurants near you</h2>
            {!loading ? (
              <span className="cd-browse-count">{filtered.length} places</span>
            ) : null}
          </div>

          {loading ? (
            <p className="cd-empty">Loading restaurants…</p>
          ) : filtered.length === 0 ? (
            <p className="cd-empty">No restaurants match your search. Try another filter.</p>
          ) : (
            <div className="cd-browse-grid" id="restaurants">
              {filtered.map((r) => {
                const img = resolveMediaUrl(r.image);
                const isClosed = r.status === "closed";
                return (
                  <Link
                    key={r.id}
                    to={`/customer/restaurant/${r.id}`}
                    className={`cd-browse-card ${isClosed ? "cd-browse-card-closed" : ""}`}
                  >
                    <div className="cd-browse-card-image">
                      {img ? (
                        <img src={img} alt="" />
                      ) : (
                        <div className="cd-browse-card-placeholder">
                          <span className="material-symbols-outlined">restaurant</span>
                        </div>
                      )}
                      {r.rating != null && r.rating > 0 ? (
                        <span className="cd-browse-card-rating">
                          <span
                            className="material-symbols-outlined"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          {Number(r.rating).toFixed(1)}
                        </span>
                      ) : null}
                      {r.status === "open" ? (
                        <span className="cd-browse-card-tag">Open</span>
                      ) : r.status === "busy" ? (
                        <span className="cd-browse-card-tag cd-browse-card-tag-busy">Busy</span>
                      ) : null}
                    </div>
                    <div className="cd-browse-card-body">
                      <div className="cd-browse-card-top">
                        <h3>{r.name}</h3>
                        <span className="cd-browse-card-price-hint">$$</span>
                      </div>
                      <p className="cd-browse-card-meta">
                        {[r.cuisine, r.location].filter(Boolean).join(" · ")}
                      </p>
                      <p className="cd-browse-card-foot">
                        <span>
                          <span className="material-symbols-outlined">schedule</span>
                          20–40 min
                        </span>
                        <span>
                          <span className="material-symbols-outlined">delivery_dining</span>
                          {isClosed ? "Closed" : "Delivery"}
                        </span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </CustomerLayout>
  );
}

export default CustomerDashboard;
