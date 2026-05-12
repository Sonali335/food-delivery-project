import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";
import Input from "../components/Input";
import Button from "../components/Button";
import styles from "./pages.module.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset({ email });
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.success}>
          If an account exists with that email, we sent a 6-digit reset code. It expires in 10
          minutes.
        </p>
        <p className={styles.hint}>
          <Link to="/reset-password" state={{ email: email.trim() }}>
            Enter reset code
          </Link>{" "}
          · <Link to="/login">Back to log in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Forgot password</h1>
      <p className={styles.hint}>
        Enter your account email and we will send a reset code if we find a password-based account.{" "}
        <Link to="/login">Back to log in</Link>
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
          required
        />
        {error ? <div className={styles.error}>{error}</div> : null}
        <Button
          text={loading ? "Sending..." : "Send reset code"}
          disabled={loading}
          onClick={handleSubmit}
        />
      </form>
    </div>
  );
}

export default ForgotPassword;
