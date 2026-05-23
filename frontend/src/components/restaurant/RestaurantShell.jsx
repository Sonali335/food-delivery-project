import { NavLink, useNavigate } from "react-router-dom";
import "./restaurant-dashboard.css";

function RestaurantShell({
  restaurantName,
  status,
  statusLoading = false,
  statusSaving = false,
  onSetStatus,
  children,
}) {
  const navigate = useNavigate();
  const displayName = restaurantName || "My Restaurant";
  const normalizedStatus = (status || "open").toLowerCase();

  const linkClass = ({ isActive }) =>
    `rd-nav-link ${isActive ? "rd-nav-link-active" : ""}`;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="rd-shell">
      <header className="rd-topbar">
        <span className="rd-topbar-brand">Restaurant Portal</span>
        <div className="rd-topbar-actions">
          {onSetStatus ? (
            <label className="rd-topbar-status-select-wrap">
              <span
                className={`rd-topbar-status-select-inner rd-topbar-status-select-inner-${normalizedStatus}`}
              >
                <select
                  className="rd-topbar-status-select"
                  value={normalizedStatus}
                  disabled={statusSaving || statusLoading}
                  onChange={(e) => onSetStatus(e.target.value)}
                  aria-label="Restaurant status"
                >
                  <option value="open">Open</option>
                  <option value="busy">Busy</option>
                  <option value="closed">Closed</option>
                </select>
                <span className="material-symbols-outlined rd-topbar-status-chevron" aria-hidden>
                  expand_more
                </span>
              </span>
            </label>
          ) : (
            <span className={`rd-status-pill rd-status-pill-${normalizedStatus}`}>
              {normalizedStatus}
            </span>
          )}
          <button type="button" className="rd-topbar-logout" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            Log out
          </button>
        </div>
      </header>

      <div className="rd-body">
        <aside className="rd-sidebar">
          <div className="rd-sidebar-restaurant">
            <div className="rd-sidebar-icon-wrap">
              <span className="material-symbols-outlined">restaurant</span>
            </div>
            <div>
              <h3 className="rd-sidebar-name">{displayName}</h3>
              <p className="rd-sidebar-role">Restaurant partner</p>
            </div>
          </div>

          <nav className="rd-nav">
            <NavLink to="/restaurant/dashboard" className={linkClass} end>
              <span className="material-symbols-outlined">dashboard</span>
              Dashboard
            </NavLink>
            <NavLink to="/restaurant/menu" className={linkClass}>
              <span className="material-symbols-outlined">menu_book</span>
              Menu management
            </NavLink>
            <NavLink to="/restaurant/categories" className={linkClass}>
              <span className="material-symbols-outlined">category</span>
              Categories
            </NavLink>
            <NavLink to="/setup/restaurant" className={linkClass}>
              <span className="material-symbols-outlined">settings</span>
              Profile settings
            </NavLink>
          </nav>

          <div className="rd-sidebar-footer">
            <div className="rd-sidebar-tip">
              <p className="rd-sidebar-tip-title">Store status</p>
              <p className="rd-sidebar-tip-text">
                Change status from the dropdown in the header to control whether customers can
                place orders.
              </p>
            </div>
          </div>
        </aside>

        <main className="rd-main">{children}</main>
      </div>
    </div>
  );
}

export default RestaurantShell;
