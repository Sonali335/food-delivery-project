import { Navigate } from "react-router-dom";
import { getHomePathForRole } from "../utils/roleHome";

/** Legacy route — redirects to the role-specific dashboard. */
function Dashboard() {
  const role = localStorage.getItem("role") || "";
  return <Navigate to={getHomePathForRole(role)} replace />;
}

export default Dashboard;
