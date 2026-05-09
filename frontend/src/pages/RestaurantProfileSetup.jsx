import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeRestaurantProfile } from "../api/profile";
import Input from "../components/Input";
import Button from "../components/Button";
import styles from "./pages.module.css";

function RestaurantProfileSetup() {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await completeRestaurantProfile({ restaurantName, phone, location });
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
        <Input label="Restaurant name" type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} />
        <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
        {error ? <div className={styles.error}>{error}</div> : null}
        <Button text={loading ? "Saving..." : "Complete profile"} disabled={loading} onClick={handleSubmit} />
      </form>
    </div>
  );
}

export default RestaurantProfileSetup;
