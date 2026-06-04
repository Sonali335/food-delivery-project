import { Navigate } from "react-router-dom";

/** Browse lives on the dashboard (reference home layout). */
function CustomerRestaurants() {
  return <Navigate to="/customer/dashboard" replace />;
}

export default CustomerRestaurants;
