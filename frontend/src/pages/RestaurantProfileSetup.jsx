import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  completeRestaurantProfile,
  deleteProfile,
  getProfile,
  tryPasswordUpdateIfFilled,
} from "../api/profile";
import { getStatus, updateStatus } from "../api/restaurant";
import RestaurantShell from "../components/restaurant/RestaurantShell";
import Input from "../components/Input";
import Button from "../components/Button";
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
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("open");
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profileRes, statusRes] = await Promise.all([
          getProfile(),
          getStatus().catch(() => ({ status: "open" })),
        ]);
        if (cancelled) return;
        const profile = profileRes.profile;
        if (profile) {
          setPlaceholders({
            restaurantName: profile.restaurantName ?? "",
            phone: profile.phone ?? "",
            location: profile.location ?? "",
          });
          setDisplayName(profile.restaurantName ?? "");
        }
        setStatus(statusRes.status || "open");
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyStatus = async (next) => {
    setStatusSaving(true);
    setError("");
    try {
      const data = await updateStatus(next);
      setStatus(data.status || next);
    } catch (e) {
      setError(e.message || "Could not update status");
    } finally {
      setStatusSaving(false);
    }
  };

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
    <RestaurantShell
      restaurantName={displayName}
      status={status}
      statusLoading={statusLoading}
      statusSaving={statusSaving}
      onSetStatus={applyStatus}
    >
      <div className="rd-page-header">
        <div>
          <h1 className="rd-page-title">Profile settings</h1>
          <p className="rd-page-subtitle">Update your restaurant details or account password.</p>
        </div>
      </div>

      <div className="rd-info-card" style={{ maxWidth: "32rem" }}>
        <form onSubmit={handleSubmit}>
          <button type="submit" className={styles.srSubmit} aria-hidden tabIndex={-1}>
            Submit
          </button>
          <Input
            label="Restaurant name"
            type="text"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            placeholder={placeholders.restaurantName}
          />
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={placeholders.phone}
          />
          <Input
            label="Location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={placeholders.location}
          />
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
          <div className={styles.actions}>
            <Button
              text="Back to dashboard"
              variant="secondary"
              onClick={() => navigate("/restaurant/dashboard")}
              disabled={false}
            />
            <Button
              text={loading ? "Saving..." : "Save changes"}
              disabled={loading}
              onClick={handleSubmit}
            />
          </div>
        </form>

        <section style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e5e5" }}>
          <h2 className={styles.title} style={{ fontSize: "1.125rem" }}>
            Delete account
          </h2>
          <p className={styles.hint}>
            Permanently remove your restaurant profile and login. This cannot be undone.
          </p>
          <Button
            text={deleting ? "Deleting..." : "Delete profile"}
            onClick={handleDeleteProfile}
            disabled={deleting}
          />
        </section>
      </div>
    </RestaurantShell>
  );
}

export default RestaurantProfileSetup;
