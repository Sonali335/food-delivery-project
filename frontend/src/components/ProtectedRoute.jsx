import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
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
  return children;
}

export default ProtectedRoute;
