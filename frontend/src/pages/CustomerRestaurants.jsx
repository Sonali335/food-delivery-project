import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllRestaurants } from "../api/restaurant";
import CustomerLayout from "../components/customer/CustomerLayout";
import "../components/customer/customer-dashboard.css";

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
        {loading ? (
          <p className="cd-empty">Loading restaurants…</p>
        ) : restaurants.length === 0 ? (
          <p className="cd-empty">No restaurants available right now.</p>
        ) : (
          <div className="cd-restaurant-grid" style={{ padding: "1.5rem" }}>
            {restaurants.map((r) => (
              <Link key={r.id} to={`/customer/restaurant/${r.id}`} className="cd-restaurant-card">
                {r.image ? <img src={r.image} alt="" /> : null}
                <div className="cd-restaurant-card-body">
                  <h4>{r.name}</h4>
                  <p>
                    {r.location}
                    {r.cuisine ? ` · ${r.cuisine}` : ""}
                    {r.rating != null ? ` · ★ ${r.rating}` : ""}
                    {r.status ? ` · ${r.status}` : ""}
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
