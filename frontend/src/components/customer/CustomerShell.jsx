import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getCartItemCount, getCartRestaurantId } from "../../utils/customerCart";
import "./customer-dashboard.css";

function customerInitials(name) {
  const parts = String(name || "C")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() || "CU";
}

function locationLabel(profile) {
  const addr = profile?.addresses?.[0];
  if (addr?.city) return addr.city;
  if (addr?.state) return addr.state;
  return "Your area";
}

function CustomerShell({ customerName, customerProfile, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = customerName || "Customer";
  const [cartCount, setCartCount] = useState(() => getCartItemCount());
  const [search, setSearch] = useState("");

  const isMenuPage = /^\/customer\/restaurant\//.test(location.pathname);
  const showBrowseSearch = location.pathname === "/customer/dashboard" || location.pathname === "/customer/restaurants";

  useEffect(() => {
    const sync = () => setCartCount(getCartItemCount());
    sync();
    window.addEventListener("food-delivery-cart-update", sync);
    return () => window.removeEventListener("food-delivery-cart-update", sync);
  }, [location.pathname]);

  useEffect(() => {
    if (!showBrowseSearch) return;
    const params = new URLSearchParams(location.search);
    setSearch(params.get("q") || "");
  }, [location.pathname, location.search, showBrowseSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/customer/dashboard?q=${encodeURIComponent(q)}` : "/customer/dashboard");
  };

  const cartHref = (() => {
    const rid = getCartRestaurantId();
    return rid ? `/customer/restaurant/${rid}` : "/customer/dashboard";
  })();

  const navClass = ({ isActive }) =>
    `cd-app-nav-link ${isActive ? "cd-app-nav-link-active" : ""}`;

  const bottomNavClass = ({ isActive }) =>
    `cd-bottom-nav-link ${isActive ? "cd-bottom-nav-link-active" : ""}`;

  return (
    <div className="cd-app">
      <header className="cd-app-header">
        <div className="cd-app-header-inner">
          <Link to="/customer/dashboard" className="cd-app-brand">
            Food Delivery
          </Link>

          {showBrowseSearch ? (
            <form className="cd-app-search" onSubmit={handleSearchSubmit}>
              <span className="material-symbols-outlined cd-app-search-icon">search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search restaurants, dishes…"
                aria-label="Search restaurants"
              />
            </form>
          ) : null}

          <div className="cd-app-header-end">
            <nav className="cd-app-nav" aria-label="Main">
              <NavLink to="/customer/dashboard" className={navClass} end>
                Home
              </NavLink>
              <NavLink to="/customer/orders" className={navClass}>
                Orders
              </NavLink>
            </nav>

            <div className="cd-app-location" title="Delivery area">
              <span className="material-symbols-outlined">location_on</span>
              <span>{locationLabel(customerProfile)}</span>
            </div>

            <Link to={cartHref} className="cd-app-cart" aria-label="Cart">
              <span className="material-symbols-outlined">shopping_cart</span>
              {cartCount > 0 ? (
                <span className="cd-app-cart-badge">{cartCount > 9 ? "9+" : cartCount}</span>
              ) : null}
            </Link>

            <Link
              to="/setup/customer"
              className="cd-app-avatar"
              title={displayName}
              aria-label="Profile settings"
            >
              {customerInitials(displayName)}
            </Link>

            <button type="button" className="cd-app-logout" onClick={() => {
              sessionStorage.removeItem("food_delivery_customer_cart");
              localStorage.clear();
              navigate("/login");
            }}>
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className={`cd-app-main ${isMenuPage ? "cd-app-main-menu" : ""}`}>{children}</main>

      <nav className="cd-bottom-nav" aria-label="Mobile navigation">
        <NavLink to="/customer/dashboard" className={bottomNavClass} end>
          <span className="material-symbols-outlined">home</span>
          <span>Home</span>
        </NavLink>
        <NavLink to="/customer/dashboard" className={bottomNavClass}>
          <span className="material-symbols-outlined">storefront</span>
          <span>Browse</span>
        </NavLink>
        <NavLink to="/customer/orders" className={bottomNavClass}>
          <span className="material-symbols-outlined">receipt_long</span>
          <span>Orders</span>
        </NavLink>
        <NavLink to="/setup/customer" className={bottomNavClass}>
          <span className="material-symbols-outlined">person</span>
          <span>Profile</span>
        </NavLink>
      </nav>

      {cartCount > 0 && !isMenuPage ? (
        <Link to={cartHref} className="cd-cart-fab" aria-label="View cart">
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="cd-cart-fab-badge">{cartCount}</span>
        </Link>
      ) : null}
    </div>
  );
}

export default CustomerShell;
