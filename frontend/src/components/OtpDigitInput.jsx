import { useCallback, useEffect, useRef } from "react";
import "./OtpDigitInput.css";

const OTP_LENGTH = 6;

/**
 * @param {object} props
 * @param {string} props.value - digits only, up to 6 chars
 * @param {(value: string) => void} props.onChange
 * @param {boolean} [props.disabled]
 * @param {string} [props.idPrefix]
 */
function OtpDigitInput({ value, onChange, disabled = false, idPrefix = "otp" }) {
  const inputsRef = useRef([]);
  const digits = value.padEnd(OTP_LENGTH, " ").split("").slice(0, OTP_LENGTH);

  const focusAt = useCallback((index) => {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const emitDigits = useCallback(
    (nextDigits) => {
      const joined = nextDigits.join("").replace(/\D/g, "").slice(0, OTP_LENGTH);
      onChange(joined);
      return joined;
    },
    [onChange]
  );

  const handleChange = (index, raw) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits.map((d) => (d === " " ? "" : d))];
    next[index] = digit;
    const joined = emitDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      focusAt(index + 1);
    }
    if (joined.length === OTP_LENGTH) {
      inputsRef.current[OTP_LENGTH - 1]?.blur();
    }
  };

  const handleKeyDown = (index, event) => {
    const current = digits[index] === " " ? "" : digits[index];
    if (event.key === "Backspace") {
      if (!current && index > 0) {
        event.preventDefault();
        const next = [...digits.map((d) => (d === " " ? "" : d))];
        next[index - 1] = "";
        emitDigits(next);
        focusAt(index - 1);
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    onChange(pasted);
    focusAt(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  useEffect(() => {
    if (!disabled && value.length === 0) {
      focusAt(0);
    }
  }, [disabled, value.length, focusAt]);

  return (
    <div className="otp-digit-row" role="group" aria-label="6-digit verification code">
      {digits.map((digit, index) => {
        const display = digit === " " ? "" : digit;
        return (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            id={`${idPrefix}-${index}`}
            className="otp-digit-input"
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            pattern="[0-9]*"
            value={display}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
          />
        );
      })}
    </div>
  );
}

export { OTP_LENGTH };
export default OtpDigitInput;
