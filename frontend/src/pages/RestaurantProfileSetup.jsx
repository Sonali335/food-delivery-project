import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  completeRestaurantProfile,
  getProfile,
} from "../api/profile";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import { getHomePathForRole } from "../utils/roleHome";
import { isRestaurantProfileComplete } from "../utils/profileComplete";
function RestaurantProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const onboarding = location.state?.onboarding === true;

  const [restaurantName, setRestaurantName] = useState("");
  const [phone, setPhone] = useState("");
  const [locationText, setLocationText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (!onboarding && !checking) {
      navigate("/restaurant/settings", { replace: true });
    }
  }, [onboarding, checking, navigate]);

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

  if (!onboarding) {
    return (
      <div className="auth-shell" style={{ minHeight: "40vh" }}>
        <p style={{ textAlign: "center" }}>Redirecting…</p>
      </div>
    );
  }

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

export default RestaurantProfileSetup;
