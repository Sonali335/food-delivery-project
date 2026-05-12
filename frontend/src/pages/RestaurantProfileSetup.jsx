import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeRestaurantProfile, getProfile, tryPasswordUpdateIfFilled } from "../api/profile";
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
    if (event && event.preventDefault) event.preventDefault();
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
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Could not save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Restaurant profile</h1>
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
        <Button text={loading ? "Saving..." : "Complete profile"} disabled={loading} onClick={handleSubmit} />
      </form>
    </div>
  );
}

export default RestaurantProfileSetup;
