import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleSelect from "./pages/RoleSelect";
import Signup from "./pages/Signup";
import EmailVerification from "./pages/EmailVerification";
import Login from "./pages/Login";
import CustomerProfileSetup from "./pages/CustomerProfileSetup";
import DriverProfileSetup from "./pages/DriverProfileSetup";
import RestaurantProfileSetup from "./pages/RestaurantProfileSetup";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelect />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<EmailVerification />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/setup/customer"
        element={
          <ProtectedRoute>
            <CustomerProfileSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/setup/driver"
        element={
          <ProtectedRoute>
            <DriverProfileSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/setup/restaurant"
        element={
          <ProtectedRoute>
            <RestaurantProfileSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;
