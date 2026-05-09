import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import Input from "../components/Input";
import Button from "../components/Button";
import styles from "./pages.module.css";

const REDIRECT_AFTER_LOGIN_KEY = "redirectAfterLogin";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Log in</h1>
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
    </div>
  );
}

export default Login;
