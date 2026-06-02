import { NavLink, useNavigate } from "react-router-dom";
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

function CustomerShell({ customerName, children }) {
  const navigate = useNavigate();
  const displayName = customerName || "Customer";

  const linkClass = ({ isActive }) =>
    `cd-nav-link ${isActive ? "cd-nav-link-active" : ""}`;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="cd-shell">
      <header className="cd-topbar">
        <span className="cd-topbar-brand">Food Delivery</span>
        <div className="cd-topbar-actions">
          <span className="cd-topbar-profile" title={displayName}>
            {customerInitials(displayName)}
          </span>
          <button type="button" className="cd-topbar-logout" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            Log out
          </button>
        </div>
      </header>

      <div className="cd-body">
        <aside className="cd-sidebar">
          <div className="cd-sidebar-user">
            <div className="cd-sidebar-icon-wrap">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                person
              </span>
            </div>
            <div>
              <h3 className="cd-sidebar-name">{displayName}</h3>
              <p className="cd-sidebar-role">Customer</p>
            </div>
          </div>

          <nav className="cd-nav">
            <NavLink to="/customer/dashboard" className={linkClass} end>
              <span className="material-symbols-outlined">dashboard</span>
              Dashboard
            </NavLink>
            <NavLink to="/customer/restaurants" className={linkClass}>
              <span className="material-symbols-outlined">storefront</span>
              Browse restaurants
            </NavLink>
            <NavLink to="/customer/orders" className={linkClass}>
              <span className="material-symbols-outlined">receipt_long</span>
              My orders
            </NavLink>
            <NavLink to="/setup/customer" className={linkClass}>
              <span className="material-symbols-outlined">settings</span>
              Profile settings
            </NavLink>
          </nav>

          <div className="cd-sidebar-footer">
            <div className="cd-sidebar-tip">
              <p className="cd-sidebar-tip-title">Hungry?</p>
              <p className="cd-sidebar-tip-text">
                Browse nearby restaurants and place an order. Track delivery status from your
                dashboard.
              </p>
            </div>
          </div>
        </aside>

        <main className="cd-main">{children}</main>
      </div>
    </div>
  );
}

export default CustomerShell;
