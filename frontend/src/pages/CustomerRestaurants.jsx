import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllRestaurants } from "../api/restaurant";
import { resolveMediaUrl } from "../utils/mediaUrl";
import CustomerLayout from "../components/customer/CustomerLayout";
import "../components/customer/customer-dashboard.css";

function CustomerRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) => {
      const hay = `${r.name} ${r.location || ""} ${r.cuisine || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [restaurants, search]);

  return (
    <CustomerLayout>
      <div className="cd-page-header">
        <div>
          <h1 className="cd-page-title">Browse restaurants</h1>
          <p className="cd-page-subtitle">Pick a restaurant and add items to your cart.</p>
        </div>
        <Link to="/customer/dashboard" className="cd-btn-outline">
          <span className="material-symbols-outlined">dashboard</span>
          Dashboard
        </Link>
      </div>

      {error ? <div className="cd-alert-error">{error}</div> : null}

      <div className="cd-panel">
        <div className="cd-panel-toolbar">
          <div className="cd-search-wrap">
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, cuisine, or location"
              aria-label="Search restaurants"
            />
          </div>
        </div>

        {loading ? (
          <p className="cd-empty">Loading restaurants…</p>
        ) : filtered.length === 0 ? (
          <p className="cd-empty">No restaurants match your search.</p>
        ) : (
          <div className="cd-restaurant-grid cd-restaurant-grid-padded">
            {filtered.map((r) => (
              <Link
                key={r.id}
                to={`/customer/restaurant/${r.id}`}
                className="cd-restaurant-card cd-restaurant-card-large"
              >
                {r.image ? (
                  <img src={resolveMediaUrl(r.image) || r.image} alt="" />
                ) : (
                  <div className="cd-restaurant-card-placeholder cd-restaurant-card-placeholder-lg">
                    <span className="material-symbols-outlined">restaurant</span>
                  </div>
                )}
                <div className="cd-restaurant-card-body">
                  <h4>{r.name}</h4>
                  <p>
                    {r.location}
                    {r.cuisine ? ` · ${r.cuisine}` : ""}
                    {r.rating != null ? ` · ★ ${r.rating}` : ""}
                    {r.status === "open"
                      ? " · Open"
                      : r.status
                        ? ` · ${r.status}`
                        : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

export default CustomerRestaurants;
