import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./OtpResendTimer.css";

function formatRemaining(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * @param {object} props
 * @param {string} [props.expiresAt] ISO 8601
 * @param {() => void | Promise<void>} [props.onResend]
 * @param {boolean} [props.resendLoading]
 * @param {string} [props.resendLabel]
 * @param {string} [props.requestNewTo] fallback link when no onResend
 * @param {string} [props.requestNewLabel]
 */
function OtpResendTimer({
  expiresAt,
  onResend,
  resendLoading = false,
  resendLabel = "Resend code",
  requestNewTo,
  requestNewLabel = "Get a new code",
}) {
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
    return (
      <div className="otp-resend-wrap">
        <p className="otp-resend-hint">
          Codes are valid for 10 minutes.{" "}
          {requestNewTo ? (
            <Link to={requestNewTo}>{requestNewLabel}</Link>
          ) : null}
        </p>
      </div>
    );
  }

  const remaining = Math.max(0, endMs - now);
  const expired = remaining <= 0;
  const urgent = remaining > 0 && remaining <= 60 * 1000;

  if (expired) {
    return (
      <div className="otp-resend-wrap otp-resend-wrap--expired" role="status">
        <p className="otp-resend-expired">This code has expired.</p>
        {onResend ? (
          <button
            type="button"
            className="otp-resend-btn"
            onClick={onResend}
            disabled={resendLoading}
          >
            {resendLoading ? "Sending…" : resendLabel}
          </button>
        ) : requestNewTo ? (
          <Link className="otp-resend-btn otp-resend-btn--link" to={requestNewTo}>
            {requestNewLabel}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`otp-resend-wrap ${urgent ? "otp-resend-wrap--urgent" : ""}`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="otp-resend-countdown">
        <span className="material-symbols-outlined otp-resend-icon" aria-hidden>
          schedule
        </span>
        Resend code in{" "}
        <span className="otp-resend-time">{formatRemaining(remaining)}</span>
      </p>
      <button type="button" className="otp-resend-btn otp-resend-btn--disabled" disabled>
        {resendLabel}
      </button>
    </div>
  );
}

export default OtpResendTimer;
