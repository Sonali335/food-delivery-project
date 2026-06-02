import { Link, useNavigate } from "react-router-dom";
import "./auth.css";

function AuthLayout({
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkTo,
  backTo,
  showBack = Boolean(backTo),
  heroIcon,
  children,
}) {
  const navigate = useNavigate();

  return (
    <div className="auth-shell">
      {showBack ? (
        <header className="auth-top-bar">
          <button
            type="button"
            className="auth-back-btn"
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            aria-label="Go back"
          >
            <span className="material-symbols-outlined" aria-hidden>
              arrow_back
            </span>
          </button>
          <span className="auth-brand">Food Delivery</span>
        </header>
      ) : null}

      <div className="auth-blob-top" aria-hidden />
      <div className="auth-blob-bottom" aria-hidden />

      <main className={`auth-main${showBack ? " auth-main--with-bar" : ""}`}>
        <div className="auth-card">
          {heroIcon ? (
            <div className="auth-hero-icon" aria-hidden>
              <span className="material-symbols-outlined auth-hero-icon-symbol">{heroIcon}</span>
            </div>
          ) : null}
          <div className={`auth-card-header${heroIcon ? " auth-card-header--center" : ""}`}>
            <h1 className="auth-card-title">{title}</h1>
            {subtitle ? <p className="auth-card-subtitle">{subtitle}</p> : null}
          </div>
          {children}
        </div>

        {footerText && footerLinkTo ? (
          <p className="auth-footer">
            {footerText}
            <Link className="auth-footer-link" to={footerLinkTo}>
              {footerLinkText}
            </Link>
          </p>
        ) : null}
      </main>
    </div>
  );
}

export default AuthLayout;
