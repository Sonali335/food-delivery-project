import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { resetPasswordWithOtp } from "../api/auth";
import { getPasswordPolicyMessage } from "../utils/passwordPolicy";
import Input from "../components/Input";
import Button from "../components/Button";
import OtpCountdown from "../components/OtpCountdown";
import styles from "./pages.module.css";

function initialEmail(locationState) {
  if (typeof locationState?.email === "string" && locationState.email.trim()) {
    return locationState.email.trim();
  }
  return "";
}

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(() => initialEmail(location.state));
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const rawOtpExpiry = location.state?.otpExpiresAt;
  const showLiveTimer =
    typeof rawOtpExpiry === "string" && Number.isFinite(Date.parse(rawOtpExpiry));

  const handleSubmit = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    setError("");

    if (showLiveTimer) {
      const end = Date.parse(rawOtpExpiry);
      if (Number.isFinite(end) && Date.now() > end) {
        setError("This code has expired. Request a new code from forgot password.");
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const policyMsg = getPasswordPolicyMessage(newPassword);
    if (policyMsg) {
      setError(policyMsg);
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithOtp({ email, otp, newPassword });
      navigate("/login", { replace: true, state: { passwordReset: true } });
    } catch (err) {
      setError(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Reset password</h1>
      <p className={styles.hint}>
        Enter the code from your email and choose a new password (8+ characters, one number, one
        symbol).{" "}
        <Link to="/forgot-password">Request a new code</Link> · <Link to="/login">Log in</Link>
      </p>
      {showLiveTimer ? (
        <OtpCountdown
          expiresAt={rawOtpExpiry}
          requestNewTo="/forgot-password"
          requestNewLabel="Request a new code"
        />
      ) : (
        <p className={styles.hint}>
          If you received a reset email, use the code within 10 minutes of when it was sent.
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <button type="submit" className={styles.srSubmit} aria-hidden tabIndex={-1}>
          Submit
        </button>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Reset code"
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
        />
        <Input
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
        {error ? <div className={styles.error}>{error}</div> : null}
        <Button
          text={loading ? "Updating..." : "Update password"}
          disabled={loading}
          onClick={handleSubmit}
        />
      </form>
    </div>
  );
}

export default ResetPassword;
