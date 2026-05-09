import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/auth";
import Button from "../components/Button";
import styles from "./pages.module.css";

const PENDING_ROLE_KEY = "pendingSignupRole";
const REDIRECT_AFTER_LOGIN_KEY = "redirectAfterLogin";

function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!token) {
        setStatus("waiting");
        return;
      }
      setStatus("pending");
      setError("");
      try {
        await verifyEmail(token);
        if (!cancelled) setStatus("success");
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(err.message || "Verification failed");
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleContinueSetup = () => {
    const role = sessionStorage.getItem(PENDING_ROLE_KEY);
    if (role === "customer") sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, "/setup/customer");
    else if (role === "driver") sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, "/setup/driver");
    else if (role === "restaurant") sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, "/setup/restaurant");
    navigate("/login");
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Email verification</h1>

      {!token && emailParam ? (
        <p className={styles.hint}>Verification email sent to {emailParam}.</p>
      ) : null}
      {!token && !emailParam ? (
        <p className={styles.hint}>Add a token query param to verify (example: ?token=YOUR_TOKEN).</p>
      ) : null}

      {token && status === "pending" ? (
        <p className={styles.hint}>Verifying...</p>
      ) : null}

      {status === "error" ? <div className={styles.error}>{error}</div> : null}

      {status === "success" ? (
        <>
          <p className={styles.success}>Email verified</p>
          <div className={styles.actions}>
            <Button text="Continue" onClick={handleContinueSetup} />
          </div>
        </>
      ) : null}
    </div>
  );
}

export default EmailVerification;
