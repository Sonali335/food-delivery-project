import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { completeDriverProfile, getProfile, tryPasswordUpdateIfFilled } from "../api/profile";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import DriverLayout from "../components/driver/DriverLayout";
import PasswordUpdateFields from "../components/PasswordUpdateFields";
import { getHomePathForRole } from "../utils/roleHome";
import { isDriverProfileComplete } from "../utils/profileComplete";
import styles from "./pages.module.css";

function DriverProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const onboarding = location.state?.onboarding === true;

  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then(({ profile }) => {
        if (cancelled) return;
        if (profile) {
          setUsername(profile.username ?? "");
          setPhone(profile.phone ?? "");
          setVehicleType(profile.vehicleType ?? "");
          setVehicleNumber(profile.vehicleNumber ?? "");
          setLicenseNumber(profile.licenseNumber ?? "");
          if (!onboarding && isDriverProfileComplete(profile)) {
            navigate(getHomePathForRole("driver"), { replace: true });
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
    if (!username.trim()) return "Username is required.";
    if (!phone.trim()) return "Phone is required.";
    if (!vehicleType.trim()) return "Vehicle type is required.";
    if (!vehicleNumber.trim()) return "Vehicle number is required.";
    if (!licenseNumber.trim()) return "License number is required.";
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
      await completeDriverProfile({
        username: username.trim(),
        phone: phone.trim(),
        vehicleType: vehicleType.trim(),
        vehicleNumber: vehicleNumber.trim(),
        licenseNumber: licenseNumber.trim(),
      });
      navigate(getHomePathForRole("driver"), { replace: true });
    } catch (err) {
      setError(err.message || "Could not save profile");
    } finally {
      setLoading(false);
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
        id="username"
        label="Username"
        type="text"
        icon="badge"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
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
        id="vehicleType"
        label="Vehicle type"
        type="text"
        icon="two_wheeler"
        value={vehicleType}
        onChange={(e) => setVehicleType(e.target.value)}
        placeholder="e.g. Motorcycle, Car"
        required
      />
      <AuthField
        id="vehicleNumber"
        label="Vehicle number"
        type="text"
        icon="pin"
        value={vehicleNumber}
        onChange={(e) => setVehicleNumber(e.target.value)}
        required
      />
      <AuthField
        id="licenseNumber"
        label="License number"
        type="text"
        icon="id_card"
        value={licenseNumber}
        onChange={(e) => setLicenseNumber(e.target.value)}
        required
      />
    </>
  );

  if (onboarding) {
    return (
      <AuthLayout
        title="Complete your driver profile"
        subtitle="Required details so deliveries and your dashboard show the right information."
        heroIcon="local_shipping"
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
    <DriverLayout>
      <div className="dd-page-header">
        <h1 className="dd-page-title">Profile settings</h1>
        <p className="dd-page-subtitle">Update your driver details or account password.</p>
      </div>
      <div className="dd-form-panel">
        <form onSubmit={handleSubmit}>
          <div className="dd-form-field">
            <label htmlFor="username">Username *</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="dd-form-field">
            <label htmlFor="phone">Phone *</label>
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="dd-form-field">
            <label htmlFor="vehicleType">Vehicle type *</label>
            <input id="vehicleType" type="text" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required />
          </div>
          <div className="dd-form-field">
            <label htmlFor="vehicleNumber">Vehicle number *</label>
            <input id="vehicleNumber" type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} required />
          </div>
          <div className="dd-form-field">
            <label htmlFor="licenseNumber">License number *</label>
            <input id="licenseNumber" type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
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
            <button type="button" className="dd-btn-outline" onClick={() => navigate("/driver/dashboard")}>
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
