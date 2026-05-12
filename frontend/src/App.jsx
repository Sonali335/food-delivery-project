import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Signup from "./pages/Signup";
import OtpVerification from "./pages/OtpVerification";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CustomerProfileSetup from "./pages/CustomerProfileSetup";
import DriverProfileSetup from "./pages/DriverProfileSetup";
import RestaurantProfileSetup from "./pages/RestaurantProfileSetup";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Signup />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route path="/verify-otp" element={<OtpVerification />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

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
