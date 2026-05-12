import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeCustomerProfile, getProfile, tryPasswordUpdateIfFilled } from "../api/profile";
import Input from "../components/Input";
import Button from "../components/Button";
import PasswordUpdateFields from "../components/PasswordUpdateFields";
import styles from "./pages.module.css";

const emptyPlaceholders = {
  username: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
};

function pick(prev, current) {
  const c = String(current ?? "").trim();
  if (c) return c;
  return String(prev ?? "").trim();
}

function CustomerProfileSetup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setStateVal] = useState("");
  const [postalCode, setPostalCode] = useState("");
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
        const addr = profile.addresses?.[0];
        setPlaceholders({
          username: profile.username ?? "",
          phone: profile.phone ?? "",
          street: addr?.street ?? "",
          city: addr?.city ?? "",
          state: addr?.state ?? "",
          postalCode: addr?.postalCode ?? "",
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
      const addresses = [
        {
          label: "Home",
          street: pick(placeholders.street, street),
          city: pick(placeholders.city, city),
          state: pick(placeholders.state, state),
          postalCode: pick(placeholders.postalCode, postalCode),
        },
      ];
      await completeCustomerProfile({
        username: pick(placeholders.username, username),
        phone: pick(placeholders.phone, phone),
        addresses,
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
      <h1 className={styles.title}>Customer profile</h1>
      <form onSubmit={handleSubmit}>
        <button type="submit" className={styles.srSubmit} aria-hidden tabIndex={-1}>
          Submit
        </button>
        <Input
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={placeholders.username}
        />
        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={placeholders.phone}
        />
        <p className={styles.hint}>Address</p>
        <Input
          label="Street"
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder={placeholders.street}
        />
        <Input
          label="City"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={placeholders.city}
        />
        <Input
          label="State"
          type="text"
          value={state}
          onChange={(e) => setStateVal(e.target.value)}
          placeholder={placeholders.state}
        />
        <Input
          label="Postal code"
          type="text"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder={placeholders.postalCode}
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

export default CustomerProfileSetup;
