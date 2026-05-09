import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeCustomerProfile } from "../api/profile";
import Input from "../components/Input";
import Button from "../components/Button";
import styles from "./pages.module.css";

function CustomerProfileSetup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setStateVal] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const addresses = [
        {
          label: "Home",
          street,
          city,
          state,
          postalCode,
        },
      ];
      await completeCustomerProfile({ username, phone, addresses });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Could not save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Customer profile</h1>
      <form onSubmit={handleSubmit}>
        <button type="submit" className={styles.srSubmit} aria-hidden tabIndex={-1}>
          Submit
        </button>
        <Input label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <p className={styles.hint}>Address</p>
        <Input label="Street" type="text" value={street} onChange={(e) => setStreet(e.target.value)} />
        <Input label="City" type="text" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label="State" type="text" value={state} onChange={(e) => setStateVal(e.target.value)} />
        <Input label="Postal code" type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        {error ? <div className={styles.error}>{error}</div> : null}
        <Button text={loading ? "Saving..." : "Complete profile"} disabled={loading} onClick={handleSubmit} />
      </form>
    </div>
  );
}

export default CustomerProfileSetup;
