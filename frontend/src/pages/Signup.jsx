import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api/auth";
import Input from "../components/Input";
import Button from "../components/Button";
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signup({ email, password, role });
      localStorage.setItem("token", result.token);
      localStorage.setItem("role", result.user.role);

      if (result.user.role === "customer") navigate("/setup/customer");
      else if (result.user.role === "driver") navigate("/setup/driver");
      else navigate("/setup/restaurant");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Create account</h1>
      <p className={styles.hint}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
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
          text={loading ? "Submitting..." : "Continue to profile setup"}
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
