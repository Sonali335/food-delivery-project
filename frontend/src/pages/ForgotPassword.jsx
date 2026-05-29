import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";
import { resolveOtpExpiresAt } from "../constants/otp";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await requestPasswordReset({ email });
      const trimmed = email.trim();
      navigate("/reset-password", {
        replace: true,
        state: {
          email: trimmed,
          otpExpiresAt: resolveOtpExpiresAt(data.otpExpiresAt ?? null),
        },
      });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your account email and we will send a 6-digit reset code if we find a password-based account."
      heroIcon="lock_reset"
      showBack
      backTo="/login"
      footerText="Remember your password?"
      footerLinkText="Log in"
      footerLinkTo="/login"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <button type="submit" className="auth-sr-submit" aria-hidden tabIndex={-1}>
          Submit
        </button>

        <AuthField
          id="forgot-email"
          label="Email"
          type="email"
          icon="alternate_email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          autoComplete="email"
        />

        {error ? <div className="auth-alert-error">{error}</div> : null}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Sending…" : "Send reset code"}
          <span className="material-symbols-outlined" aria-hidden>
            arrow_forward
          </span>
        </button>
      </form>

      <p className="auth-legal-hint">
        If an account exists, you will go straight to enter the code. Codes expire in 10 minutes.
      </p>
    </AuthLayout>
  );
}

export default ForgotPassword;
