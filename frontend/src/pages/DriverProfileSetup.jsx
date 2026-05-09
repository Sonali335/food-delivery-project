import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeDriverProfile } from "../api/profile";
import Input from "../components/Input";
import Button from "../components/Button";
import styles from "./pages.module.css";

function DriverProfileSetup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await completeDriverProfile({
        username,
        phone,
        vehicleType,
        vehicleNumber,
        licenseNumber,
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
        <Input label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Vehicle type" type="text" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
        <Input label="Vehicle number" type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
        <Input label="License number" type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
        {error ? <div className={styles.error}>{error}</div> : null}
        <Button text={loading ? "Saving..." : "Complete profile"} disabled={loading} onClick={handleSubmit} />
      </form>
    </div>
  );
}

export default DriverProfileSetup;
