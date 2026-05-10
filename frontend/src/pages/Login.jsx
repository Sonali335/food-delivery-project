import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { googleLogin, login } from "../api/auth";
import Input from "../components/Input";
import Button from "../components/Button";
import { loadGsiScript } from "../utils/loadGsiScript";
import styles from "./pages.module.css";

const REDIRECT_AFTER_LOGIN_KEY = "redirectAfterLogin";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);

  const finishLogin = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login({ email, password });
      localStorage.setItem("token", result.token);
      localStorage.setItem("role", result.user.role);
      const next = sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
      if (next) {
        sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
        navigate(next);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const applyAuthRedirect = useCallback(() => {
    const next = sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
    if (next) {
      sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
      navigate(next);
    } else {
      navigate("/dashboard");
    }
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

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!googleClientId) return undefined;

    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        const host = googleBtnRef.current;
        if (!host) return;
        host.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(host, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          width: 384,
          locale: "en",
        });
      })
      .catch(() => {
        if (!cancelled) setError("Could not load Google Sign-In. Try again later.");
      });

    return () => {
      cancelled = true;
    };
  }, [googleClientId, handleGoogleCredential]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Log in</h1>
      <p className={styles.hint}>
        New user? <Link to="/">Create account</Link>
      </p>
      {import.meta.env.DEV && !googleClientId ? (
        <p className={styles.envHint}>
          Google sign-in is off until{" "}
          <code className={styles.envCode}>GOOGLE_CLIENT_ID</code> or{" "}
          <code className={styles.envCode}>VITE_GOOGLE_CLIENT_ID</code> is set (e.g. in{" "}
          <code className={styles.envCode}>backend/.env</code>), then restart Vite.
        </p>
      ) : null}
      <form onSubmit={finishLogin}>
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
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <div className={styles.error}>{error}</div> : null}
        <Button
          text={loading ? "Signing in..." : "Log in"}
          disabled={loading}
          onClick={finishLogin}
        />
      </form>

      {googleClientId ? (
        <div className={styles.googleBlock}>
          <p className={styles.orDivider}>or</p>
          <div
            className={styles.googleButtonHost}
            ref={googleBtnRef}
            aria-busy={googleLoading}
          />
        </div>
      ) : null}
    </div>
  );
}

export default Login;
