import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeDriverProfile, getProfile, tryPasswordUpdateIfFilled } from "../api/profile";
import Input from "../components/Input";
import Button from "../components/Button";
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
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Could not save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Driver profile</h1>
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
        <Input
          label="Vehicle type"
          type="text"
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          placeholder={placeholders.vehicleType}
        />
        <Input
          label="Vehicle number"
          type="text"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
          placeholder={placeholders.vehicleNumber}
        />
        <Input
          label="License number"
          type="text"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          placeholder={placeholders.licenseNumber}
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
        <div className={styles.actions}>
          <Button
            text="Back to dashboard"
            variant="secondary"
            onClick={() => navigate("/dashboard")}
            disabled={false}
          />
          <Button
            text={loading ? "Saving..." : "Complete profile"}
            disabled={loading}
            onClick={handleSubmit}
          />
        </div>
      </form>
    </div>
  );
}

export default DriverProfileSetup;
