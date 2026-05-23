import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  completeRestaurantProfile,
  deleteProfile,
  getProfile,
  tryPasswordUpdateIfFilled,
} from "../api/profile";
import RestaurantLayout from "../components/restaurant/RestaurantLayout";
import PasswordUpdateFields from "../components/PasswordUpdateFields";
import styles from "./pages.module.css";

const emptyPlaceholders = {
  restaurantName: "",
  phone: "",
  location: "",
};

function pick(prev, current) {
  const c = String(current ?? "").trim();
  if (c) return c;
  return String(prev ?? "").trim();
}

function RestaurantProfileSetup() {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [placeholders, setPlaceholders] = useState(emptyPlaceholders);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then(({ profile }) => {
        if (cancelled || !profile) return;
        setPlaceholders({
          restaurantName: profile.restaurantName ?? "",
          phone: profile.phone ?? "",
          location: profile.location ?? "",
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await tryPasswordUpdateIfFilled({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      await completeRestaurantProfile({
        restaurantName: pick(placeholders.restaurantName, restaurantName),
        phone: pick(placeholders.phone, phone),
        location: pick(placeholders.location, location),
      });
      navigate("/restaurant/dashboard");
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
          <button type="submit" className={styles.srSubmit} aria-hidden tabIndex={-1}>
            Submit
          </button>
          <div className="rd-form-field">
            <label htmlFor="restaurantName">Restaurant name</label>
            <input
              id="restaurantName"
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder={placeholders.restaurantName}
            />
          </div>
          <div className="rd-form-field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={placeholders.phone}
            />
          </div>
          <div className="rd-form-field">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={placeholders.location}
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
            <button
              type="button"
              className="rd-btn-outline"
              onClick={() => navigate("/restaurant/dashboard")}
            >
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
            Permanently remove your restaurant profile and login. This cannot be undone.
          </p>
          <button
            type="button"
            className="rd-menu-card-delete"
            onClick={handleDeleteProfile}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete profile"}
          </button>
        </section>
      </div>
    </RestaurantLayout>
  );
}

export default RestaurantProfileSetup;
