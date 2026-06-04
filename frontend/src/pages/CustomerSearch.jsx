import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { searchMenuItems } from "../api/menu";
import { getAllRestaurants } from "../api/restaurant";
import { resolveMediaUrl } from "../utils/mediaUrl";
import CustomerLayout from "../components/customer/CustomerLayout";
import "../components/customer/customer-dashboard.css";

function CustomerSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [input, setInput] = useState(query);
  const [foodResults, setFoodResults] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setInput(query);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const q = query.trim();

    if (!q) {
      setFoodResults([]);
      setRestaurants([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    setLoading(true);
    setError("");

    Promise.all([searchMenuItems(q), getAllRestaurants()])
      .then(([foodRes, restaurantRes]) => {
        if (cancelled) return;
        setFoodResults(foodRes.items || []);
        setRestaurants(restaurantRes.restaurants || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Search failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const restaurantMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return restaurants.filter((r) => {
      const hay = `${r.name} ${r.location || ""} ${r.cuisine || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [restaurants, query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = input.trim();
    if (q) {
      setSearchParams({ q });
    } else {
      navigate("/customer/search");
    }
  };

  return (
    <CustomerLayout>
      <div className="cd-page-header">
        <div>
          <h1 className="cd-page-title">Search food</h1>
          <p className="cd-page-subtitle">
            Find dishes from any restaurant — like searching on Uber Eats.
          </p>
        </div>
        <Link to="/customer/restaurants" className="cd-btn-outline">
          <span className="material-symbols-outlined">storefront</span>
          Browse restaurants
        </Link>
      </div>

      <div className="cd-panel cd-search-panel">
        <form className="cd-search-hero" onSubmit={handleSubmit}>
          <span className="material-symbols-outlined">search</span>
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search pizza, burger, biryani…"
            aria-label="Search food across all restaurants"
            autoFocus
          />
          <button type="submit" className="cd-btn-primary cd-search-submit">
            Search
          </button>
        </form>

        {error ? <div className="cd-alert-error cd-search-alert">{error}</div> : null}

        {!query.trim() ? (
          <p className="cd-empty cd-search-hint">
            Type a dish name above to see matching items from every restaurant.
          </p>
        ) : loading ? (
          <p className="cd-empty">Searching…</p>
        ) : (
          <>
            <section className="cd-search-section">
              <h2 className="cd-search-section-title">
                Food results
                <span className="cd-search-count">{foodResults.length}</span>
              </h2>
              {foodResults.length === 0 ? (
                <p className="cd-empty">No dishes match &ldquo;{query}&rdquo;.</p>
              ) : (
                <div className="cd-food-results">
                  {foodResults.map((item) => (
                    <Link
                      key={item.itemId}
                      to={`/customer/restaurant/${item.restaurant.id}`}
                      className="cd-food-result-card"
                    >
                      {item.image ? (
                        <img src={resolveMediaUrl(item.image) || item.image} alt="" />
                      ) : (
                        <div className="cd-food-result-placeholder">
                          <span className="material-symbols-outlined">lunch_dining</span>
                        </div>
                      )}
                      <div className="cd-food-result-body">
                        <div className="cd-food-result-head">
                          <h3>{item.name}</h3>
                          <span className="cd-food-result-price">
                            ${Number(item.price).toFixed(2)}
                          </span>
                        </div>
                        {item.description ? (
                          <p className="cd-food-result-desc">{item.description}</p>
                        ) : null}
                        <p className="cd-food-result-restaurant">
                          <span className="material-symbols-outlined">storefront</span>
                          {item.restaurant.name}
                          {item.restaurant.location ? ` · ${item.restaurant.location}` : ""}
                          {item.restaurant.status !== "open"
                            ? ` · ${item.restaurant.status}`
                            : ""}
                        </p>
                        {item.category ? (
                          <span className="cd-food-result-tag">{item.category}</span>
                        ) : null}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {restaurantMatches.length > 0 ? (
              <section className="cd-search-section">
                <h2 className="cd-search-section-title">
                  Restaurants
                  <span className="cd-search-count">{restaurantMatches.length}</span>
                </h2>
                <ul className="cd-search-restaurant-list">
                  {restaurantMatches.map((r) => (
                    <li key={r.id}>
                      <Link to={`/customer/restaurant/${r.id}`} className="cd-search-restaurant-row">
                        <span className="material-symbols-outlined">restaurant</span>
                        <div>
                          <p className="cd-search-restaurant-name">{r.name}</p>
                          <p className="cd-search-restaurant-meta">
                            {r.location}
                            {r.cuisine ? ` · ${r.cuisine}` : ""}
                          </p>
                        </div>
                        <span className="material-symbols-outlined cd-search-restaurant-arrow">
                          chevron_right
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>
    </CustomerLayout>
  );
}

export default CustomerSearch;
