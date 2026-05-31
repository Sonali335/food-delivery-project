import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProfile } from "../api/profile";
import { getSetupPathForRole, isProfileComplete } from "../utils/profileComplete";
import "../components/auth/auth.css";

function ProfileGate({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role") || "";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const setupPath = getSetupPathForRole(role);
      if (!setupPath) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const { profile } = await getProfile();
        if (!cancelled && !isProfileComplete(profile, role) && location.pathname !== setupPath) {
          navigate(setupPath, { replace: true, state: { onboarding: true } });
          return;
        }
      } catch {
        if (!cancelled && location.pathname !== setupPath) {
          navigate(setupPath, { replace: true, state: { onboarding: true } });
          return;
        }
      }

      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [role, location.pathname, navigate]);

  if (!ready) {
    return (
      <div className="auth-shell" style={{ minHeight: "40vh" }}>
        <p style={{ textAlign: "center", color: "var(--auth-on-surface-variant)" }}>Loading…</p>
      </div>
    );
  }

  return children;
}

export default ProfileGate;
