import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { googleLogin, signup } from "../api/auth";
import { getPasswordPolicyMessage } from "../utils/passwordPolicy";
import Input from "../components/Input";
import Button from "../components/Button";
import {
  mountGoogleSignInButton,
  setGoogleCredentialHandler,
  unmountGoogleSignInButton,
} from "../utils/googleGsiMount";
import styles from "./pages.module.css";

const ROLES = [
  { value: "customer", label: "Customer" },
  { value: "driver", label: "Driver" },
  { value: "restaurant", label: "Restaurant" },
];

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
        state: { email, otpExpiresAt: data.otpExpiresAt ?? null },
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
        navigate("/dashboard");
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
      width: 384,
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
    <div className={styles.page}>
      <h1 className={styles.title}>Create account</h1>
      <p className={styles.hint}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>

      {googleClientId ? (
        <div className={styles.googleBlock}>
          <div
            className={styles.googleButtonHost}
            ref={googleBtnRef}
            aria-busy={googleLoading}
          />
          <p className={styles.hint}>No email code needed — Google has already verified your email.</p>
          <p className={styles.orDivider}>or sign up with email</p>
        </div>
      ) : import.meta.env.DEV ? (
        <p className={styles.envHint}>
          Google sign-up is off until{" "}
          <code className={styles.envCode}>GOOGLE_CLIENT_ID</code> or{" "}
          <code className={styles.envCode}>VITE_GOOGLE_CLIENT_ID</code> is set (e.g. in{" "}
          <code className={styles.envCode}>backend/.env</code>), then restart Vite.
        </p>
      ) : null}
      {import.meta.env.DEV && googleClientId && window.location.hostname === "127.0.0.1" ? (
        <p className={styles.envHint}>
          Using <code className={styles.envCode}>127.0.0.1</code>? Add{" "}
          <code className={styles.envCode}>http://127.0.0.1:5173</code> under{" "}
          <strong>Authorized JavaScript origins</strong> in Google Cloud Console.
        </p>
      ) : null}

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
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
        />
        <p className={styles.hint}>
          At least 8 characters, with at least one number and one symbol (!@#$% etc.).
        </p>

        <fieldset className={styles.roleFieldset}>
          <legend className={styles.roleLegend}>I am a</legend>
          {ROLES.map((r) => (
            <label key={r.value} className={styles.radioLabel}>
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
              />
              {r.label}
            </label>
          ))}
        </fieldset>

        {error ? <div className={styles.error}>{error}</div> : null}
        <Button
          text={loading ? "Submitting..." : "Create account"}
          onClick={(e) => {
            handleSubmit(e);
          }}
          disabled={loading}
        />
      </form>
    </div>
  );
}

export default Signup;
