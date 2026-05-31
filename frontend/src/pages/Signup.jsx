import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { googleLogin, signup } from "../api/auth";
import { getPasswordPolicyMessage } from "../utils/passwordPolicy";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import RoleSelector from "../components/auth/RoleSelector";
import {
  mountGoogleSignInButton,
  setGoogleCredentialHandler,
  unmountGoogleSignInButton,
} from "../utils/googleGsiMount";
import { navigateAfterAuth } from "../utils/navigateAfterAuth";

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const policyMsg = getPasswordPolicyMessage(password);
    if (policyMsg) {
      setError(policyMsg);
      return;
    }
    setLoading(true);
    try {
      const data = await signup({ email, password, role });
      navigate("/verify-otp", {
        state: {
          email,
          otpExpiresAt: data.otpExpiresAt ?? null,
          signupMeta: { password, role },
        },
      });
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (response) => {
      if (!response?.credential) return;
      setError("");
      setGoogleLoading(true);
      try {
        const result = await googleLogin({ idToken: response.credential, role });
        localStorage.setItem("token", result.token);
        localStorage.setItem("role", result.role);
        await navigateAfterAuth(navigate, result.role);
      } catch (err) {
        setError(err.message || "Google sign-up failed");
      } finally {
        setGoogleLoading(false);
      }
    },
    [navigate, role]
  );

  const googleCredentialRef = useRef(handleGoogleCredential);
  googleCredentialRef.current = handleGoogleCredential;

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useLayoutEffect(() => {
    if (!googleClientId) return undefined;

    setGoogleCredentialHandler((response) => googleCredentialRef.current(response));

    let cancelled = false;
    const host = googleBtnRef.current;

    mountGoogleSignInButton(host, googleClientId, {
      theme: "outline",
      size: "large",
      text: "signup_with",
      width: 400,
      locale: "en",
    })
      .then(() => {
        if (cancelled) unmountGoogleSignInButton(host);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load Google Sign-In. Try again later.");
      });

    return () => {
      cancelled = true;
      unmountGoogleSignInButton(host);
    };
  }, [googleClientId]);

  return (
    <AuthLayout
      title="Create account"
      subtitle="Sign up as a customer, driver, or restaurant."
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLinkTo="/login"
    >
      {googleClientId ? (
        <>
          <div
            className="auth-google-block"
            ref={googleBtnRef}
            aria-busy={googleLoading}
          />
          <p className="auth-env-hint auth-env-hint-center">
            No email code needed — Google verifies your email.
          </p>
          <div className="auth-divider">
            <span className="auth-divider-text">or sign up with email</span>
          </div>
        </>
      ) : import.meta.env.DEV ? (
        <p className="auth-env-hint">
          Google sign-up is off until{" "}
          <code className="auth-env-code">VITE_GOOGLE_CLIENT_ID</code> is set, then restart Vite.
        </p>
      ) : null}
      {import.meta.env.DEV && googleClientId && window.location.hostname === "127.0.0.1" ? (
        <p className="auth-env-hint">
          Using <code className="auth-env-code">127.0.0.1</code>? Add{" "}
          <code className="auth-env-code">http://127.0.0.1:5173</code> to Google Cloud authorized
          origins.
        </p>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <button type="submit" className="auth-sr-submit" aria-hidden tabIndex={-1}>
          Submit
        </button>

        <AuthField
          id="email"
          label="Email"
          type="email"
          icon="alternate_email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          autoComplete="email"
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          icon="lock"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete="new-password"
          showPasswordToggle
          hint="At least 8 characters, with one number and one symbol (!@#$% etc.)."
        />

        <RoleSelector value={role} onChange={setRole} />

        {error ? <div className="auth-alert-error">{error}</div> : null}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
          <span className="material-symbols-outlined" aria-hidden>
            arrow_forward
          </span>
        </button>
      </form>
    </AuthLayout>
  );
}

export default Signup;
