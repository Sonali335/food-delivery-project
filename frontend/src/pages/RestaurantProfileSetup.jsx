import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  completeRestaurantProfile,
  deleteProfile,
  getProfile,
  tryPasswordUpdateIfFilled,
} from "../api/profile";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import RestaurantLayout from "../components/restaurant/RestaurantLayout";
import PasswordUpdateFields from "../components/PasswordUpdateFields";
import { getHomePathForRole } from "../utils/roleHome";
import { isRestaurantProfileComplete } from "../utils/profileComplete";
import styles from "./pages.module.css";

function RestaurantProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const onboarding = location.state?.onboarding === true;

  const [restaurantName, setRestaurantName] = useState("");
  const [phone, setPhone] = useState("");
  const [locationText, setLocationText] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then(({ profile }) => {
        if (cancelled) return;
        if (profile) {
          setRestaurantName(profile.restaurantName ?? "");
          setPhone(profile.phone ?? "");
          setLocationText(profile.location ?? "");
          if (onboarding && isRestaurantProfileComplete(profile)) {
            navigate(getHomePathForRole("restaurant"), { replace: true });
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate, onboarding]);

  const validate = () => {
    if (!restaurantName.trim()) return "Restaurant name is required.";
    if (!phone.trim()) return "Phone is required.";
    if (!locationText.trim()) return "Location is required.";
    return null;
  };

  const handleSubmit = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      if (!onboarding) {
        await tryPasswordUpdateIfFilled({
          currentPassword,
          newPassword,
          confirmPassword,
        });
      }
      await completeRestaurantProfile({
        restaurantName: restaurantName.trim(),
        phone: phone.trim(),
        location: locationText.trim(),
      });
      navigate(getHomePathForRole("restaurant"), { replace: true });
    } catch (err) {
      setError(err.message || "Could not save profile");
    } finally {
      setLoading(false);
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

  if (checking) {
    return (
      <div className="auth-shell" style={{ minHeight: "40vh" }}>
        <p style={{ textAlign: "center" }}>Loading…</p>
      </div>
    );
  }

  const fields = (
    <>
      <AuthField
        id="restaurantName"
        label="Restaurant name"
        type="text"
        icon="storefront"
        value={restaurantName}
        onChange={(e) => setRestaurantName(e.target.value)}
        required
      />
      <AuthField
        id="phone"
        label="Phone"
        type="tel"
        icon="call"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      <AuthField
        id="location"
        label="Location"
        type="text"
        icon="location_on"
        value={locationText}
        onChange={(e) => setLocationText(e.target.value)}
        placeholder="City, area, or full address"
        required
      />
    </>
  );

  if (onboarding) {
    return (
      <AuthLayout
        title="Complete your restaurant profile"
        subtitle="Add your business details so orders and your dashboard display correctly."
        heroIcon="restaurant"
        showBack={false}
      >
        <form className="auth-form" onSubmit={handleSubmit}>
          {fields}
          {error ? <div className="auth-alert-error">{error}</div> : null}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Saving…" : "Continue to dashboard"}
            <span className="material-symbols-outlined" aria-hidden>
              arrow_forward
            </span>
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <RestaurantLayout>
      <div className="rd-page-header">
        <div>
          <h1 className="rd-page-title">Profile settings</h1>
          <p className="rd-page-subtitle">Update your restaurant details or account password.</p>
        </div>
      </div>
      <div className="rd-form-panel">
        <form onSubmit={handleSubmit}>
          <div className="rd-form-field">
            <label htmlFor="restaurantName">Restaurant name *</label>
            <input
              id="restaurantName"
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
            />
          </div>
          <div className="rd-form-field">
            <label htmlFor="phone">Phone *</label>
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="rd-form-field">
            <label htmlFor="location">Location *</label>
            <input
              id="location"
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              required
            />
          </div>
          <PasswordUpdateFields
            currentPassword={currentPassword}
            onCurrentPasswordChange={setCurrentPassword}
            newPassword={newPassword}
            onNewPasswordChange={setNewPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
          />
          {error ? <div className={styles.error}>{error}</div> : null}
          {deleteError ? <div className={styles.error}>{deleteError}</div> : null}
          <div className="rd-form-actions">
            <button type="button" className="rd-btn-outline" onClick={() => navigate("/restaurant/dashboard")}>
              Back to dashboard
            </button>
            <button type="submit" className="rd-btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
        <section style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e5e5" }}>
          <h2 className="rd-panel-title" style={{ fontSize: "1.125rem" }}>
            Delete account
          </h2>
          <p className="rd-page-subtitle" style={{ marginBottom: "1rem" }}>
            Permanently remove your restaurant profile and login.
          </p>
          <button type="button" className="rd-menu-card-delete" onClick={handleDeleteProfile} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete profile"}
          </button>
        </section>
      </div>
    </RestaurantLayout>
  );
}

export default RestaurantProfileSetup;
