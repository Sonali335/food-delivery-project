import { Navigate } from "react-router-dom";
import ProfileGate from "./ProfileGate";

function ProtectedRoute({ children, allowedRoles, requireCompleteProfile = false }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && allowedRoles.length > 0) {
    const role = localStorage.getItem("role") || "";
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (requireCompleteProfile) {
    return <ProfileGate>{children}</ProfileGate>;
  }

  return children;
}

export default ProtectedRoute;
