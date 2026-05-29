import { useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { requestPasswordReset, resetPasswordWithOtp } from "../api/auth";
import { resolveOtpExpiresAt } from "../constants/otp";
import { getPasswordPolicyMessage } from "../utils/passwordPolicy";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import OtpDigitInput, { OTP_LENGTH } from "../components/OtpDigitInput";
import OtpResendTimer from "../components/OtpResendTimer";
import "../components/OtpDigitInput.css";
import "../components/OtpResendTimer.css";

function initialEmail(locationState) {
  if (typeof locationState?.email === "string" && locationState.email.trim()) {
    return locationState.email.trim();
  }
  return "";
}

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = useMemo(() => initialEmail(location.state), [location.state]);

  const [otp, setOtp] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState(() =>
    resolveOtpExpiresAt(location.state?.otpExpiresAt)
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("Missing email. Request a new code from forgot password.");
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      setError(`Enter the full ${OTP_LENGTH}-digit code.`);
      return;
    }

    const end = Date.parse(otpExpiresAt);
    if (Number.isFinite(end) && Date.now() > end) {
      setError("This code has expired. Resend a code to continue.");
      return;
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

  const handleResend = async () => {
    if (!email) {
      navigate("/forgot-password", { replace: true });
      return;
    }
    setError("");
    setResendLoading(true);
    try {
      const data = await requestPasswordReset({ email });
      setOtp("");
      setOtpExpiresAt(resolveOtpExpiresAt(data.otpExpiresAt ?? null));
    } catch (err) {
      setError(err.message || "Could not resend code");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return (
      <AuthLayout
        title="Reset password"
        subtitle="Request a reset code to continue."
        heroIcon="lock_reset"
        showBack
        backTo="/forgot-password"
      >
        <div className="auth-alert-error">
          No email on this page.{" "}
          <Link to="/forgot-password">Request a reset code</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify reset code"
      subtitle={
        <>
          Enter the 6-digit code sent to{" "}
          <strong className="auth-email-highlight">{email}</strong>, then choose a new password.
        </>
      }
      heroIcon="verified_user"
      showBack
      backTo="/forgot-password"
      footerText="Remember your password?"
      footerLinkText="Log in"
      footerLinkTo="/login"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <button type="submit" className="auth-sr-submit" aria-hidden tabIndex={-1}>
          Submit
        </button>

        <OtpDigitInput value={otp} onChange={setOtp} disabled={loading} idPrefix="reset-otp" />

        <OtpResendTimer
          expiresAt={otpExpiresAt}
          onResend={handleResend}
          resendLoading={resendLoading}
          resendLabel="Resend code"
          requestNewTo="/forgot-password"
          requestNewLabel="Request a new code"
        />

        <AuthField
          id="new-password"
          label="New password"
          type="password"
          icon="lock"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete="new-password"
          showPasswordToggle
          hint="At least 8 characters, with one number and one symbol."
        />

        <AuthField
          id="confirm-password"
          label="Confirm new password"
          type="password"
          icon="lock"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete="new-password"
          showPasswordToggle
        />

        {error ? <div className="auth-alert-error">{error}</div> : null}

        <button
          type="submit"
          className="auth-submit"
          disabled={loading || otp.length !== OTP_LENGTH}
        >
          {loading ? "Updating…" : "Update password"}
          <span className="material-symbols-outlined" aria-hidden>
            arrow_forward
          </span>
        </button>

        <button
          type="button"
          className="auth-text-link"
          onClick={() => navigate("/forgot-password", { state: { email } })}
        >
          Change email
        </button>
      </form>

      <p className="auth-legal-hint">Standard message rates may apply for SMS or email delivery.</p>
    </AuthLayout>
  );
}

export default ResetPassword;
