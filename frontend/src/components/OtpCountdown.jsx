import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./OtpCountdown.module.css";

function formatRemaining(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * @param {object} props
 * @param {string} [props.expiresAt] ISO 8601 end time for the OTP
 * @param {string} [props.requestNewTo] react-router path for a new code
 * @param {string} [props.requestNewLabel]
 */
function OtpCountdown({ expiresAt, requestNewTo, requestNewLabel }) {
  const endMs = useMemo(() => {
    if (!expiresAt || typeof expiresAt !== "string") return null;
    const t = Date.parse(expiresAt);
    return Number.isFinite(t) ? t : null;
  }, [expiresAt]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endMs == null) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endMs]);

  if (endMs == null) {
    return null;
  }

  const remaining = Math.max(0, endMs - now);
  const urgent = remaining > 0 && remaining <= 60 * 1000;
  const expired = remaining <= 0;

  if (expired) {
    return (
      <div className={`${styles.wrap} ${styles.expired}`} role="status">
        <p className={styles.expiredText}>This code has expired.</p>
        {requestNewTo ? (
          <p className={styles.expiredHint}>
            <Link to={requestNewTo}>{requestNewLabel || "Get a new code"}</Link>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`${styles.wrap} ${urgent ? styles.urgent : ""}`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={styles.label}>Time remaining</span>
      <span className={styles.value}>{formatRemaining(remaining)}</span>
    </div>
  );
}

export default OtpCountdown;
