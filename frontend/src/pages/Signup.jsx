import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { signup } from "../api/auth";
import Input from "../components/Input";
import Button from "../components/Button";
import styles from "./pages.module.css";

const PENDING_ROLE_KEY = "pendingSignupRole";

function Signup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!role || !["customer", "driver", "restaurant"].includes(role)) {
      setError("Invalid or missing role. Go back and pick a role.");
      return;
    }
    setLoading(true);
    try {
      await signup({ email, password, role });
      sessionStorage.setItem(PENDING_ROLE_KEY, role);
      navigate(`/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Sign up</h1>
      <p className={styles.hint}>Role: {role || "(none)"}</p>
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
        />
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
