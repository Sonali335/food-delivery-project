import { Link } from "react-router-dom";
import "./auth.css";

function AuthLayout({
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkTo,
  children,
}) {
  return (
    <div className="auth-shell">
      <div className="auth-blob-top" aria-hidden />
      <div className="auth-blob-bottom" aria-hidden />

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-card-header">
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
