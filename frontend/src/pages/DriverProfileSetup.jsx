import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeDriverProfile, getProfile, tryPasswordUpdateIfFilled } from "../api/profile";
import DriverLayout from "../components/driver/DriverLayout";
import PasswordUpdateFields from "../components/PasswordUpdateFields";
import styles from "./pages.module.css";

const emptyPlaceholders = {
  username: "",
  phone: "",
  vehicleType: "",
  vehicleNumber: "",
  licenseNumber: "",
};

function pick(prev, current) {
  const c = String(current ?? "").trim();
  if (c) return c;
  return String(prev ?? "").trim();
}

function DriverProfileSetup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [placeholders, setPlaceholders] = useState(emptyPlaceholders);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then(({ profile }) => {
        if (cancelled || !profile) return;
        setPlaceholders({
          username: profile.username ?? "",
          phone: profile.phone ?? "",
          vehicleType: profile.vehicleType ?? "",
          vehicleNumber: profile.vehicleNumber ?? "",
          licenseNumber: profile.licenseNumber ?? "",
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await tryPasswordUpdateIfFilled({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      await completeDriverProfile({
        username: pick(placeholders.username, username),
        phone: pick(placeholders.phone, phone),
        vehicleType: pick(placeholders.vehicleType, vehicleType),
        vehicleNumber: pick(placeholders.vehicleNumber, vehicleNumber),
        licenseNumber: pick(placeholders.licenseNumber, licenseNumber),
      });
      navigate("/driver/dashboard");
    } catch (err) {
      setError(err.message || "Could not save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DriverLayout>
      <div className="dd-page-header">
        <h1 className="dd-page-title">Profile settings</h1>
        <p className="dd-page-subtitle">Update your driver details or account password.</p>
      </div>

      <div className="dd-form-panel">
        <form onSubmit={handleSubmit}>
          <button type="submit" className={styles.srSubmit} aria-hidden tabIndex={-1}>
            Submit
          </button>
          <div className="dd-form-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={placeholders.username}
            />
          </div>
          <div className="dd-form-field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={placeholders.phone}
            />
          </div>
          <div className="dd-form-field">
            <label htmlFor="vehicleType">Vehicle type</label>
            <input
              id="vehicleType"
              type="text"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              placeholder={placeholders.vehicleType}
            />
          </div>
          <div className="dd-form-field">
            <label htmlFor="vehicleNumber">Vehicle number</label>
            <input
              id="vehicleNumber"
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder={placeholders.vehicleNumber}
            />
          </div>
          <div className="dd-form-field">
            <label htmlFor="licenseNumber">License number</label>
            <input
              id="licenseNumber"
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder={placeholders.licenseNumber}
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
          {error ? <div className="dd-alert-error">{error}</div> : null}
          <div className="dd-form-actions">
            <button
              type="button"
              className="dd-btn-outline"
              onClick={() => navigate("/driver/dashboard")}
            >
              Back to dashboard
            </button>
            <button type="submit" className="dd-btn-primary" style={{ width: "auto" }} disabled={loading}>
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </DriverLayout>
  );
}

export default DriverProfileSetup;
