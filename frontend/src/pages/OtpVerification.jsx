import { useMemo, useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { login, signup, verifyOtp } from "../api/auth";
import { resolveOtpExpiresAt } from "../constants/otp";
import { navigateAfterAuth } from "../utils/navigateAfterAuth";
import AuthLayout from "../components/auth/AuthLayout";
import OtpDigitInput, { OTP_LENGTH } from "../components/OtpDigitInput";
import OtpResendTimer from "../components/OtpResendTimer";
import "../components/OtpDigitInput.css";
import "../components/OtpResendTimer.css";

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

  const email = useMemo(
    () => initialEmail(location.state, searchParams.get("email")),
    [location.state, searchParams]
  );

  const [otp, setOtp] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState(() =>
    resolveOtpExpiresAt(location.state?.otpExpiresAt)
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const signupMeta = location.state?.signupMeta;

  const finishVerification = async () => {
    const data = await verifyOtp({ email, otp });

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      await navigateAfterAuth(navigate, data.role);
      return;
    }

    if (signupMeta?.password) {
      const loginResult = await login({ email, password: signupMeta.password });
      localStorage.setItem("token", loginResult.token);
      localStorage.setItem("role", loginResult.user.role);
      await navigateAfterAuth(navigate, loginResult.user.role);
      return;
    }

    navigate("/login", { replace: true, state: { verifiedEmail: email } });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("Missing email. Please sign up again.");
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      setError(`Enter the full ${OTP_LENGTH}-digit code.`);
      return;
    }

    const end = Date.parse(otpExpiresAt);
    if (Number.isFinite(end) && Date.now() > end) {
      setError("This code has expired. Resend a code or start again from sign up.");
      return;
    }

    setLoading(true);
    try {
      await finishVerification();
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || !signupMeta?.password || !signupMeta?.role) {
      navigate("/", { replace: true });
      return;
    }
    setError("");
    setResendLoading(true);
    try {
      const data = await signup({
        email,
        password: signupMeta.password,
        role: signupMeta.role,
      });
      setOtp("");
      setOtpExpiresAt(resolveOtpExpiresAt(data.otpExpiresAt));
    } catch (err) {
      setError(err.message || "Could not resend code");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return (
      <AuthLayout
        title="Verify your email"
        subtitle="Start from sign up to receive a verification code."
        heroIcon="verified_user"
        backTo="/"
      >
        <div className="auth-alert-error">
          No email on this page.{" "}
          <Link to="/">Go to sign up</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify your account"
      subtitle={
        <>
          Enter the 6-digit code sent to{" "}
          <strong className="auth-email-highlight">{email}</strong>
        </>
      }
      heroIcon="verified_user"
      backTo="/"
      footerText="Wrong email?"
      footerLinkText="Change email"
      footerLinkTo="/"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <button type="submit" className="auth-sr-submit" aria-hidden tabIndex={-1}>
          Submit
        </button>

        <OtpDigitInput value={otp} onChange={setOtp} disabled={loading} idPrefix="signup-otp" />

        <OtpResendTimer
          expiresAt={otpExpiresAt}
          onResend={signupMeta ? handleResend : undefined}
          resendLoading={resendLoading}
          resendLabel="Resend code"
          requestNewTo="/"
          requestNewLabel="Back to sign up"
        />

        {error ? <div className="auth-alert-error">{error}</div> : null}

        <button
          type="submit"
          className="auth-submit"
          disabled={loading || otp.length !== OTP_LENGTH}
        >
          {loading ? "Verifying…" : "Verify & continue"}
          <span className="material-symbols-outlined" aria-hidden>
            arrow_forward
          </span>
        </button>

        <button type="button" className="auth-text-link" onClick={() => navigate("/")}>
          Change email
        </button>
      </form>

      <p className="auth-legal-hint">
        Next you will complete your profile, then go to your dashboard.
      </p>
    </AuthLayout>
  );
}

export default OtpVerification;
