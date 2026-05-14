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
import RestaurantDashboard from "./pages/RestaurantDashboard";
import MenuList from "./pages/MenuList";
import MenuCreate from "./pages/MenuCreate";
import MenuEdit from "./pages/MenuEdit";
import CategoryManager from "./pages/CategoryManager";

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

      <Route
        path="/restaurant/dashboard"
        element={
          <ProtectedRoute allowedRoles={["restaurant"]}>
            <RestaurantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/menu"
        element={
          <ProtectedRoute allowedRoles={["restaurant"]}>
            <MenuList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/menu/create"
        element={
          <ProtectedRoute allowedRoles={["restaurant"]}>
            <MenuCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/menu/edit/:id"
        element={
          <ProtectedRoute allowedRoles={["restaurant"]}>
            <MenuEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/categories"
        element={
          <ProtectedRoute allowedRoles={["restaurant"]}>
            <CategoryManager />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
