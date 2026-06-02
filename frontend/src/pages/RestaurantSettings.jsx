import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateStatus } from "../api/restaurant";
import {
  completeRestaurantProfile,
  deleteProfile,
  getProfile,
  tryPasswordUpdateIfFilled,
} from "../api/profile";
import PasswordUpdateFields from "../components/PasswordUpdateFields";
import RestaurantLayout from "../components/restaurant/RestaurantLayout";

const WEEKDAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const defaultDayHours = () => ({
  open: true,
  start: "09:00",
  end: "22:00",
});

function parseOpeningHours(raw) {
  if (!raw || typeof raw !== "string") {
    return Object.fromEntries(WEEKDAYS.map((d) => [d.key, defaultDayHours()]));
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return Object.fromEntries(
        WEEKDAYS.map((d) => [
          d.key,
          {
            open: parsed[d.key]?.open !== false,
            start: parsed[d.key]?.start || "09:00",
            end: parsed[d.key]?.end || "22:00",
          },
        ])
      );
    }
  } catch {
    /* legacy plain text */
  }
  return Object.fromEntries(WEEKDAYS.map((d) => [d.key, defaultDayHours()]));
}

function statusVisibilityLabel(status) {
  const s = (status || "open").toLowerCase();
  if (s === "open") return { pill: "Live", sub: "Currently Open", accepting: true };
  if (s === "busy") return { pill: "Busy", sub: "Limited availability", accepting: true };
  return { pill: "Hidden", sub: "Currently Closed", accepting: false };
}

function RestaurantSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [restaurantName, setRestaurantName] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [locationText, setLocationText] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState(() => parseOpeningHours(null));
  const [status, setStatus] = useState("open");
  const [acceptingOrders, setAcceptingOrders] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { profile } = await getProfile();
        if (cancelled || !profile) return;
        setRestaurantName(profile.restaurantName ?? "");
        setCuisineType(profile.cuisineType ?? "");
        setPhone(profile.phone ?? "");
        setLocationText(profile.location ?? "");
        setHours(parseOpeningHours(profile.openingHours));
        const s = (profile.status || "open").toLowerCase();
        setStatus(s);
        setAcceptingOrders(s !== "closed");
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateDay = (key, patch) => {
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleAcceptingToggle = (checked) => {
    setAcceptingOrders(checked);
    if (!checked) {
      setStatus("closed");
    } else if (status === "closed") {
      setStatus("open");
    }
  };

  const validate = () => {
    if (!restaurantName.trim()) return "Restaurant name is required.";
    if (!phone.trim()) return "Phone is required.";
    if (!locationText.trim()) return "Location is required.";
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    try {
      await tryPasswordUpdateIfFilled({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      const nextStatus = acceptingOrders ? (status === "closed" ? "open" : status) : "closed";
      await updateStatus(nextStatus);
      setStatus(nextStatus);
      await completeRestaurantProfile({
        restaurantName: restaurantName.trim(),
        phone: phone.trim(),
        location: locationText.trim(),
        cuisineType: cuisineType.trim(),
        openingHours: JSON.stringify(hours),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("All changes saved successfully.");
    } catch (err) {
      setError(err.message || "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    setDeleteError("");
    const ok = window.confirm(
      "This will permanently delete your profile and account. Continue?"
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteProfile();
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      setDeleteError(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const vis = statusVisibilityLabel(status);

  if (loading) {
    return (
      <RestaurantLayout>
        <p className="rd-empty">Loading settings…</p>
      </RestaurantLayout>
    );
  }

  return (
    <RestaurantLayout>
      <header className="rd-set-header">
        <div>
          <h1 className="rd-page-title">Settings</h1>
          <p className="rd-page-subtitle">
            Configure your restaurant profile and operations
          </p>
        </div>
        <button
          type="button"
          className="rd-set-save-top"
          disabled={saving}
          onClick={handleSave}
        >
          <span className="material-symbols-outlined">save</span>
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </header>

      {error ? <div className="rd-alert-error">{error}</div> : null}
      {success ? <div className="rd-set-success">{success}</div> : null}
      {deleteError ? <div className="rd-alert-error">{deleteError}</div> : null}

      <form className="rd-set-grid" onSubmit={handleSave}>
        <div className="rd-set-top-row">
          <section className="rd-set-card rd-set-card-info">
            <div className="rd-set-card-head">
              <div className="rd-set-icon-wrap rd-set-icon-green">
                <span className="material-symbols-outlined">restaurant</span>
              </div>
              <h3 className="rd-set-card-title">Restaurant Information</h3>
            </div>
            <div className="rd-set-form-grid">
              <div className="rd-set-field">
                <label htmlFor="restaurantName">Restaurant Name</label>
                <input
                  id="restaurantName"
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                />
              </div>
              <div className="rd-set-field">
                <label htmlFor="cuisineType">Cuisine Type</label>
                <input
                  id="cuisineType"
                  type="text"
                  value={cuisineType}
                  onChange={(e) => setCuisineType(e.target.value)}
                  placeholder="e.g. Italian, Organic"
                />
              </div>
              <div className="rd-set-field">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="rd-set-field">
                <label htmlFor="location">Location / Address</label>
                <input
                  id="location"
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="City, area, or full address"
                  required
                />
              </div>
            </div>
          </section>

          <section className="rd-set-card rd-set-card-vis">
            <div className="rd-set-vis-head">
              <h3 className="rd-set-card-title-sm">Store Visibility</h3>
              <span className={`rd-set-live-pill rd-set-live-pill-${status}`}>{vis.pill}</span>
            </div>
            <div className="rd-set-toggle-row">
              <div className="rd-set-toggle-label">
                <span className="material-symbols-outlined">storefront</span>
                <span>Accepting Orders</span>
              </div>
              <label className="rd-set-switch">
                <input
                  type="checkbox"
                  checked={acceptingOrders}
                  onChange={(e) => handleAcceptingToggle(e.target.checked)}
                />
                <span className="rd-set-switch-track" />
              </label>
            </div>
            <p className="rd-set-toggle-hint">
              Switching this off sets your store to closed and hides you from new customer orders.
            </p>
            <div className="rd-set-status-row">
              <label htmlFor="storeStatus">Operational status</label>
              <select
                id="storeStatus"
                value={status}
                disabled={!acceptingOrders}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="open">Open</option>
                <option value="busy">Busy</option>
                <option value="closed">Closed</option>
              </select>
              <p className="rd-set-status-sub">{vis.sub}</p>
            </div>
          </section>
        </div>

        <section className="rd-set-card rd-set-card-half">
          <div className="rd-set-card-head">
            <div className="rd-set-icon-wrap rd-set-icon-amber">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <h3 className="rd-set-card-title">Operating Hours</h3>
          </div>
          <ul className="rd-set-hours-list">
            {WEEKDAYS.map((day) => {
              const row = hours[day.key];
              return (
                <li key={day.key} className="rd-set-hours-row">
                  <span className="rd-set-hours-day">{day.label}</span>
                  {row.open ? (
                    <div className="rd-set-hours-times">
                      <input
                        type="time"
                        value={row.start}
                        onChange={(e) => updateDay(day.key, { start: e.target.value })}
                      />
                      <span>—</span>
                      <input
                        type="time"
                        value={row.end}
                        onChange={(e) => updateDay(day.key, { end: e.target.value })}
                      />
                    </div>
                  ) : (
                    <span className="rd-set-hours-closed">Closed</span>
                  )}
                  <label className="rd-set-switch rd-set-switch-sm">
                    <input
                      type="checkbox"
                      checked={row.open}
                      onChange={(e) => updateDay(day.key, { open: e.target.checked })}
                    />
                    <span className="rd-set-switch-track" />
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rd-set-card rd-set-card-half rd-set-card-muted">
          <div className="rd-set-card-head">
            <div className="rd-set-icon-wrap rd-set-icon-mint">
              <span className="material-symbols-outlined">map</span>
            </div>
            <h3 className="rd-set-card-title">Delivery Logistics</h3>
          </div>
          <div className="rd-set-form-grid">
            <div className="rd-set-field">
              <label>Delivery Radius (km)</label>
              <input type="number" disabled placeholder="8" />
            </div>
            <div className="rd-set-field">
              <label>Minimum Order</label>
              <input type="number" disabled placeholder="25" />
            </div>
          </div>
          <div className="rd-set-map-placeholder">
            <span className="material-symbols-outlined">location_on</span>
            <p>Delivery zone map — coming soon</p>
            <p className="rd-set-map-sub">Primary service area: {locationText || "Not set"}</p>
          </div>
        </section>

        <section className="rd-set-card rd-set-card-full">
          <div className="rd-set-card-head">
            <div className="rd-set-icon-wrap rd-set-icon-gold">
              <span className="material-symbols-outlined">lock</span>
            </div>
            <h3 className="rd-set-card-title">Account Security</h3>
          </div>
          <PasswordUpdateFields
            currentPassword={currentPassword}
            onCurrentPasswordChange={setCurrentPassword}
            newPassword={newPassword}
            onNewPasswordChange={setNewPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
          />
        </section>

        <section className="rd-set-card rd-set-card-full rd-set-card-muted">
          <div className="rd-set-card-head">
            <div className="rd-set-icon-wrap rd-set-icon-gold">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
            <h3 className="rd-set-card-title">Payout Information</h3>
          </div>
          <p className="rd-set-coming-soon">
            Bank and payout details will be available in a future update.
          </p>
        </section>

        <section className="rd-set-card rd-set-card-full rd-set-danger-zone">
          <h3 className="rd-set-card-title">Delete account</h3>
          <p className="rd-page-subtitle">
            Permanently remove your restaurant profile and login. This cannot be undone.
          </p>
          <button
            type="button"
            className="rd-menu-card-delete"
            onClick={handleDeleteProfile}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete profile and account"}
          </button>
        </section>

        <div className="rd-set-form-footer">
          <button type="submit" className="rd-btn-primary" disabled={saving}>
            <span className="material-symbols-outlined">save</span>
            {saving ? "Saving…" : "Save All Changes"}
          </button>
        </div>
      </form>
    </RestaurantLayout>
  );
}

export default RestaurantSettings;
