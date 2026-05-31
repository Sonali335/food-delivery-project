import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { completeCustomerProfile, getProfile, tryPasswordUpdateIfFilled } from "../api/profile";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import CustomerLayout from "../components/customer/CustomerLayout";
import "../components/customer/customer-dashboard.css";
import PasswordUpdateFields from "../components/PasswordUpdateFields";
import { getHomePathForRole } from "../utils/roleHome";
import { isCustomerProfileComplete } from "../utils/profileComplete";
import styles from "./pages.module.css";

function CustomerProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const onboarding = location.state?.onboarding === true;

  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setStateVal] = useState("");
  const [postalCode, setPostalCode] = useState("");
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
          const addr = profile.addresses?.[0];
          setUsername(profile.username ?? "");
          setPhone(profile.phone ?? "");
          setStreet(addr?.street ?? "");
          setCity(addr?.city ?? "");
          setStateVal(addr?.state ?? "");
          setPostalCode(addr?.postalCode ?? "");
          if (onboarding && isCustomerProfileComplete(profile)) {
            navigate(getHomePathForRole("customer"), { replace: true });
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
    if (!street.trim()) return "Street address is required.";
    if (!city.trim()) return "City is required.";
    if (!state.trim()) return "State is required.";
    if (!postalCode.trim()) return "Postal code is required.";
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
      await completeCustomerProfile({
        username: username.trim(),
        phone: phone.trim(),
        addresses: [
          {
            label: "Home",
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
          },
        ],
      });
      navigate(getHomePathForRole("customer"), { replace: true });
    } catch (err) {
      setError(err.message || "Could not save profile");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className={styles.page}>
        <p className={styles.hint}>Loading…</p>
      </div>
    );
  }

  const addressFields = (
    <>
      <AuthField
        id="street"
        label="Street"
        type="text"
        icon="home"
        value={street}
        onChange={(e) => setStreet(e.target.value)}
        placeholder="123 Main St"
        required
      />
      <AuthField
        id="city"
        label="City"
        type="text"
        icon="location_city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        required
      />
      <AuthField
        id="state"
        label="State"
        type="text"
        icon="map"
        value={state}
        onChange={(e) => setStateVal(e.target.value)}
        required
      />
      <AuthField
        id="postalCode"
        label="Postal code"
        type="text"
        icon="markunread_mailbox"
        value={postalCode}
        onChange={(e) => setPostalCode(e.target.value)}
        required
      />
    </>
  );

  if (onboarding) {
    return (
      <AuthLayout
        title="Complete your profile"
        subtitle="Tell us a bit about yourself so your dashboard and orders work correctly."
        heroIcon="person"
        showBack={false}
      >
        <form className="auth-form" onSubmit={handleSubmit}>
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
          {addressFields}
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
    <CustomerLayout>
      <div className="cd-page-header">
        <div>
          <h1 className="cd-page-title">Profile settings</h1>
          <p className="cd-page-subtitle">Update your delivery details and password.</p>
        </div>
      </div>
      <div className="cd-form-panel">
        <form onSubmit={handleSubmit}>
          <div className="cd-form-field">
            <label htmlFor="username">Username *</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="cd-form-field">
            <label htmlFor="phone">Phone *</label>
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <p className="cd-order-meta" style={{ marginBottom: "0.75rem", fontWeight: 600 }}>Address</p>
          <div className="cd-form-field">
            <label htmlFor="street">Street *</label>
            <input id="street" type="text" value={street} onChange={(e) => setStreet(e.target.value)} required />
          </div>
          <div className="cd-form-field">
            <label htmlFor="city">City *</label>
            <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div className="cd-form-field">
            <label htmlFor="state">State *</label>
            <input id="state" type="text" value={state} onChange={(e) => setStateVal(e.target.value)} required />
          </div>
          <div className="cd-form-field">
            <label htmlFor="postalCode">Postal code *</label>
            <input id="postalCode" type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
          </div>
          <PasswordUpdateFields
            currentPassword={currentPassword}
            onCurrentPasswordChange={setCurrentPassword}
            newPassword={newPassword}
            onNewPasswordChange={setNewPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
          />
          {error ? <div className="cd-alert-error">{error}</div> : null}
          <div className="cd-form-actions">
            <button type="button" className="cd-btn-outline" onClick={() => navigate("/customer/dashboard")}>
              Back to dashboard
            </button>
            <button type="submit" className="cd-btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}

export default CustomerProfileSetup;
