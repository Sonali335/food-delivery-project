import { NavLink, useNavigate } from "react-router-dom";
import "./driver-dashboard.css";

function driverInitials(name) {
  const parts = String(name || "D")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() || "DR";
}

function DriverShell({
  driverName,
  isOnline,
  onToggleOnline,
  availabilityLoading = false,
  children,
}) {
  const navigate = useNavigate();
  const displayName = driverName || "Driver";
  const online = Boolean(isOnline);

  const linkClass = ({ isActive }) =>
    `dd-nav-link ${isActive ? "dd-nav-link-active" : ""}`;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dd-shell">
      <header className="dd-topbar">
        <span className="dd-topbar-brand">GourmetGo</span>
        <div className="dd-topbar-actions">
          <div className="dd-online-toggle">
            <span className={`dd-online-label ${online ? "" : "dd-online-label-off"}`}>
              {online ? "Online" : "Offline"}
            </span>
            <button
              type="button"
              className={`dd-toggle-track ${online ? "dd-toggle-track-on" : ""}`}
              onClick={onToggleOnline}
              disabled={availabilityLoading}
              aria-label={online ? "Go offline" : "Go online"}
              aria-pressed={online}
            >
              <span className="dd-toggle-thumb" />
            </button>
          </div>
          <span className="dd-topbar-profile" title={displayName}>
            {driverInitials(displayName)}
          </span>
          <button type="button" className="dd-topbar-logout" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            Log out
          </button>
        </div>
      </header>

      <div className="dd-body">
        <aside className="dd-sidebar">
          <div className="dd-sidebar-driver">
            <div className="dd-sidebar-icon-wrap">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                delivery_dining
              </span>
            </div>
            <div>
              <h3 className="dd-sidebar-name">{displayName}</h3>
              <p className="dd-sidebar-role">Delivery partner</p>
            </div>
          </div>

          <nav className="dd-nav">
            <NavLink to="/driver/dashboard" className={linkClass} end>
              <span className="material-symbols-outlined">dashboard</span>
              Dashboard
            </NavLink>
            <NavLink to="/driver/dashboard#deliveries" className={linkClass}>
              <span className="material-symbols-outlined">list_alt</span>
              Order history
            </NavLink>
            <NavLink to="/driver/dashboard#earnings" className={linkClass}>
              <span className="material-symbols-outlined">payments</span>
              Earnings
            </NavLink>
            <NavLink to="/setup/driver" className={linkClass}>
              <span className="material-symbols-outlined">settings</span>
              Settings
            </NavLink>
          </nav>

          <div className="dd-sidebar-footer">
            <div className="dd-sidebar-tip">
              <p className="dd-sidebar-tip-title">Availability</p>
              <p className="dd-sidebar-tip-text">
                Toggle your online status from the header to receive new delivery requests when
                you are ready.
              </p>
            </div>
          </div>
        </aside>

        <main className="dd-main">{children}</main>
      </div>
    </div>
  );
}

export default DriverShell;
