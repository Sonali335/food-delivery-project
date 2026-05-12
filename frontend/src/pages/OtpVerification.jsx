import { useMemo, useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { verifyOtp } from "../api/auth";
import { resolveOtpExpiresAt } from "../constants/otp";
import Input from "../components/Input";
import Button from "../components/Button";
import OtpCountdown from "../components/OtpCountdown";
import styles from "./pages.module.css";

function initialEmail(locationState, queryEmail) {
  if (typeof locationState?.email === "string" && locationState.email.trim()) {
    return locationState.email.trim();
  }
  if (typeof queryEmail === "string" && queryEmail.trim()) return queryEmail.trim();
  return "";
}

function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(() =>
    initialEmail(location.state, searchParams.get("email"))
  );
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const otpExpiresAt = useMemo(
    () => resolveOtpExpiresAt(location.state?.otpExpiresAt),
    [location.state?.otpExpiresAt]
  );

  const handleSubmit = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    setError("");
    const end = Date.parse(otpExpiresAt);
    if (Number.isFinite(end) && Date.now() > end) {
      setError("This code has expired. Start again from sign up to receive a new code.");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp({ email, otp });
      setVerified(true);
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Email verified</h1>
        <p className={styles.success}>Email verified successfully. You can now log in.</p>
        <div className={styles.actions}>
          <Button
            text="Go to Login"
            onClick={() => navigate("/login")}
            disabled={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Verify your email</h1>
      <p className={styles.hint}>
        Enter the 6-digit code we sent you.{" "}
        <Link to="/">Back to signup</Link>
      </p>
      <OtpCountdown
        expiresAt={otpExpiresAt}
        requestNewTo="/"
        requestNewLabel="Back to sign up"
      />
      <form onSubmit={handleSubmit}>
        <button type="submit" className={styles.srSubmit} aria-hidden tabIndex={-1}>
          Submit
        </button>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="OTP"
          type="text"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
        />
        {error ? <div className={styles.error}>{error}</div> : null}
        <Button
          text={loading ? "Verifying..." : "Verify"}
          disabled={loading}
          onClick={handleSubmit}
        />
      </form>
    </div>
  );
}

export default OtpVerification;
