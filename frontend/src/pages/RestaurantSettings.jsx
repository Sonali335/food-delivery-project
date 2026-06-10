import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  completeRestaurantProfile,
  deleteProfile,
  getProfile,
  tryPasswordUpdateIfFilled,
} from "../api/profile";
import { patchRestaurantSettings } from "../api/restaurant";
import PasswordUpdateFields from "../components/PasswordUpdateFields";
import RestaurantLocationPicker from "../components/restaurant/RestaurantLocationPicker";
import { useRestaurantProfile } from "../components/restaurant/RestaurantProfileContext";
import {
  addressFromStoredLocation,
  composeAddress,
  isAddressComplete,
} from "../utils/restaurantAddress";
import {
  WEEKDAYS,
  hoursStatusHint,
  isOpenByHours,
  parseOpeningHours,
} from "../utils/restaurantHours";

const PREP_TIME_OPTIONS = [10, 15, 20, 25, 30, 35, 40];

const STATUS_OPTIONS = [
  { value: "open", label: "Open", icon: "check_circle" },
  { value: "busy", label: "Busy", icon: "schedule" },
  { value: "closed", label: "Closed", icon: "block" },
];

function statusVisibilityLabel(status) {
  const s = (status || "open").toLowerCase();
  if (s === "open") return { pill: "Live", sub: "Currently Open" };
  if (s === "busy") return { pill: "Busy", sub: "Limited availability" };
  return { pill: "Hidden", sub: "Currently Closed" };
}

function RestaurantSettings() {
  const navigate = useNavigate();
  const {
    status,
    setRestaurantName: setShellRestaurantName,
    applyStatus,
    statusSaving,
    statusLoading,
  } = useRestaurantProfile();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [restaurantName, setRestaurantName] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [addressParts, setAddressParts] = useState(() => addressFromStoredLocation(""));
  const [locationLat, setLocationLat] = useState(null);
  const [locationLng, setLocationLng] = useState(null);
  const [phone, setPhone] = useState("");
  const [prepTime, setPrepTime] = useState(20);
  const [hours, setHours] = useState(() => parseOpeningHours(null));

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const statusSyncing = useRef(false);

  const normalizedStatus = (status || "open").toLowerCase();
  const scheduleOpen = useMemo(() => isOpenByHours(hours), [hours]);
  const hoursHint = useMemo(() => hoursStatusHint(hours), [hours]);
  const vis = statusVisibilityLabel(normalizedStatus);
  const statusBusy = statusSaving || statusLoading;

  const enforceClosedOutsideHours = async () => {
    if (scheduleOpen || normalizedStatus === "closed") return;
    if (statusSyncing.current) return;
    statusSyncing.current = true;
    try {
      await applyStatus("closed");
    } catch (e) {
      setError(e.message || "Could not update status");
    } finally {
      statusSyncing.current = false;
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { profile } = await getProfile();
        if (cancelled || !profile) return;
        setRestaurantName(profile.restaurantName ?? "");
        setCuisineType(profile.cuisineType ?? "");
        setPhone(profile.phone ?? "");
        setAddressParts(addressFromStoredLocation(profile.location ?? ""));
        const lat = profile.locationLat;
        const lng = profile.locationLng;
        setLocationLat(Number.isFinite(lat) ? lat : null);
        setLocationLng(Number.isFinite(lng) ? lng : null);
        setHours(parseOpeningHours(profile.openingHours));
        const loadedPrep = Number(profile.prepTime);
        setPrepTime(PREP_TIME_OPTIONS.includes(loadedPrep) ? loadedPrep : 20);
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

  useEffect(() => {
    if (loading) return;
    enforceClosedOutsideHours();
  }, [loading, scheduleOpen, hours, normalizedStatus]);

  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => {
      enforceClosedOutsideHours();
    }, 60_000);
    return () => clearInterval(id);
  }, [loading, scheduleOpen, hours, normalizedStatus]);

  const updateDay = (key, patch) => {
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleStatusPick = async (next) => {
    if (next === normalizedStatus || statusBusy) return;
    if ((next === "open" || next === "busy") && !scheduleOpen) return;
    setError("");
    try {
      await applyStatus(next);
    } catch (e) {
      setError(e.message || "Could not update status");
    }
  };

  const validate = () => {
    if (!restaurantName.trim()) return "Restaurant name is required.";
    if (!phone.trim()) return "Phone is required.";
    if (!isAddressComplete(addressParts)) {
      return "Street address, city, and country are required.";
    }
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

      if (!scheduleOpen && normalizedStatus !== "closed") {
        await applyStatus("closed");
      }

      const trimmedName = restaurantName.trim();
      await patchRestaurantSettings({ prepTime: Number(prepTime) });

      await completeRestaurantProfile({
        restaurantName: trimmedName,
        phone: phone.trim(),
        location: composeAddress(addressParts),
        locationLat,
        locationLng,
        cuisineType: cuisineType.trim(),
        openingHours: JSON.stringify(hours),
      });
      setShellRestaurantName(trimmedName);
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
      sessionStorage.removeItem("food_delivery_restaurant_shell");
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      setDeleteError(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <p className="rd-empty">Loading settings…</p>;
  }

  return (
    <>
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
        <section className="rd-set-card rd-set-card-hero">
          <div className="rd-set-card-head">
            <div className="rd-set-icon-wrap rd-set-icon-green">
              <span className="material-symbols-outlined">restaurant</span>
            </div>
            <h3 className="rd-set-card-title">Restaurant Information</h3>
          </div>
          <div className="rd-set-form-grid rd-set-form-grid--info">
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
              <label htmlFor="prepTime">Average Preparation Time</label>
              <select
                id="prepTime"
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
              >
                {PREP_TIME_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rd-set-card rd-set-card-half rd-set-card-hours">
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

        <section className="rd-set-card rd-set-card-half rd-set-card-status">
          <div className="rd-set-card-head rd-set-card-head-compact">
            <div className="rd-set-icon-wrap rd-set-icon-green">
              <span className="material-symbols-outlined">storefront</span>
            </div>
            <div className="rd-set-card-head-text">
              <h3 className="rd-set-card-title">Customer-facing status</h3>
              <span className={`rd-set-live-pill rd-set-live-pill-${normalizedStatus}`}>
                {vis.pill}
              </span>
            </div>
          </div>
          <div className="rd-set-status-body">
          <div className="rd-set-visibility-head rd-set-visibility-head-compact">
            <div>
              <p className="rd-set-visibility-title">Store availability</p>
              <p className="rd-set-visibility-hint">
                <span className="material-symbols-outlined">schedule</span>
                {hoursHint}
                {!scheduleOpen ? " · Closed until hours begin." : ""}
              </p>
            </div>
          </div>

          <div className="rd-set-status-chips" role="group" aria-label="Store status">
            {STATUS_OPTIONS.map((opt) => {
              const active = normalizedStatus === opt.value;
              const disabled =
                statusBusy ||
                (opt.value !== "closed" && !scheduleOpen);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`rd-set-status-chip rd-set-status-chip-${opt.value} ${
                    active ? "rd-set-status-chip-active" : ""
                  }`}
                  disabled={disabled}
                  aria-pressed={active}
                  onClick={() => handleStatusPick(opt.value)}
                >
                  <span className="material-symbols-outlined">{opt.icon}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="rd-set-visibility-foot">
            Updates the header immediately. Outside operating hours, only Closed is available.
          </p>
          </div>
        </section>

        <section className="rd-set-card rd-set-card-full">
          <div className="rd-set-card-head">
            <div className="rd-set-icon-wrap rd-set-icon-mint">
              <span className="material-symbols-outlined">map</span>
            </div>
            <div>
              <h3 className="rd-set-card-title">Restaurant location</h3>
              <p className="rd-set-card-subtitle">
                Enter an address, use GPS, or click the map to place your pin. Save when finished.
              </p>
            </div>
          </div>
          <RestaurantLocationPicker
            addressParts={addressParts}
            lat={locationLat}
            lng={locationLng}
            onAddressPartsChange={setAddressParts}
            onAddressPartsEdit={(next) => {
              setAddressParts(next);
              setLocationLat(null);
              setLocationLng(null);
            }}
            onPositionChange={(nextLat, nextLng) => {
              setLocationLat(nextLat);
              setLocationLng(nextLng);
            }}
          />
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
    </>
  );
}

export default RestaurantSettings;
