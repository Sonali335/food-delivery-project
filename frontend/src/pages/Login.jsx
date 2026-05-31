import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { googleLogin, login } from "../api/auth";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import {
  mountGoogleSignInButton,
  setGoogleCredentialHandler,
  unmountGoogleSignInButton,
} from "../utils/googleGsiMount";
import { navigateAfterAuth } from "../utils/navigateAfterAuth";

const REDIRECT_AFTER_LOGIN_KEY = "redirectAfterLogin";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);

  const applyAuthRedirect = useCallback(async () => {
    const next = sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
    if (next) {
      sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
      navigate(next);
      return;
    }
    const role = localStorage.getItem("role");
    await navigateAfterAuth(navigate, role);
  }, [navigate]);

  const handleGoogleCredential = useCallback(
    async (response) => {
      if (!response?.credential) return;
      setError("");
      setGoogleLoading(true);
      try {
        const result = await googleLogin({ idToken: response.credential });
        localStorage.setItem("token", result.token);
        localStorage.setItem("role", result.role);
        applyAuthRedirect();
      } catch (err) {
        setError(err.message || "Google login failed");
      } finally {
        setGoogleLoading(false);
      }
    },
    [applyAuthRedirect]
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
      text: "continue_with",
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

  const finishLogin = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login({ email, password });
      localStorage.setItem("token", result.token);
      localStorage.setItem("role", result.user.role);
      applyAuthRedirect();
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Enter your email and password to continue."
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      footerLinkTo="/"
    >
      {import.meta.env.DEV && !googleClientId ? (
        <p className="auth-env-hint">
          Google sign-in is off until{" "}
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
      {location.state?.passwordReset ? (
        <p className="auth-alert-success">
          Password updated. You can log in with your new password.
        </p>
      ) : null}

      <form className="auth-form" onSubmit={finishLogin}>
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
          autoComplete="current-password"
          showPasswordToggle
          forgotPasswordTo="/forgot-password"
        />

        {error ? <div className="auth-alert-error">{error}</div> : null}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
          <span className="material-symbols-outlined" aria-hidden>
            arrow_forward
          </span>
        </button>
      </form>

      {googleClientId ? (
        <>
          <div className="auth-divider">
            <span className="auth-divider-text">or continue with</span>
          </div>
          <div className="auth-google-block" ref={googleBtnRef} aria-busy={googleLoading} />
        </>
      ) : null}
    </AuthLayout>
  );
}

export default Login;
