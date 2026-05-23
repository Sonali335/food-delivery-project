import { useState } from "react";
import { Link } from "react-router-dom";

function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
  required,
  minLength,
  autoComplete,
  hint,
  forgotPasswordTo,
  showPasswordToggle = false,
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPasswordToggle && visible ? "text" : type;

  return (
    <div className="auth-field">
      <div className="auth-field-label-row">
        <label className="auth-field-label" htmlFor={id}>
          {label}
        </label>
        {forgotPasswordTo ? (
          <Link className="auth-field-label-action" to={forgotPasswordTo}>
            Forgot Password?
          </Link>
        ) : null}
      </div>
      <div className="auth-field-input-wrap">
        {icon ? (
          <span className="material-symbols-outlined auth-field-icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        <input
          className={`auth-field-input ${showPasswordToggle ? "auth-field-input-toggle" : ""}`}
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
        />
        {isPassword && showPasswordToggle ? (
          <button
            type="button"
            className="auth-field-toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            <span className="material-symbols-outlined">
              {visible ? "visibility_off" : "visibility"}
            </span>
          </button>
        ) : null}
      </div>
      {hint ? <p className="auth-field-hint">{hint}</p> : null}
    </div>
  );
}

export default AuthField;
