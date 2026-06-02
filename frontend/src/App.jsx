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
import RestaurantOrderHistory from "./pages/RestaurantOrderHistory";
import DriverDashboard from "./pages/DriverDashboard";
import DriverEarnings from "./pages/DriverEarnings";
import DriverOrderHistory from "./pages/DriverOrderHistory";
import MenuList from "./pages/MenuList";
import MenuCreate from "./pages/MenuCreate";
import MenuEdit from "./pages/MenuEdit";
import CategoryManager from "./pages/CategoryManager";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerRestaurants from "./pages/CustomerRestaurants";
import CustomerRestaurantMenu from "./pages/CustomerRestaurantMenu";
import CustomerOrders from "./pages/CustomerOrders";
import CustomerOrderDetails from "./pages/CustomerOrderDetails";

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
          <ProtectedRoute requireCompleteProfile>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/driver/history"
        element={
          <ProtectedRoute allowedRoles={["driver"]} requireCompleteProfile>
            <DriverOrderHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/earnings"
        element={
          <ProtectedRoute allowedRoles={["driver"]} requireCompleteProfile>
            <DriverEarnings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/dashboard"
        element={
          <ProtectedRoute allowedRoles={["driver"]} requireCompleteProfile>
            <DriverDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/dashboard"
        element={
          <ProtectedRoute allowedRoles={["restaurant"]} requireCompleteProfile>
            <RestaurantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/orders"
        element={
          <ProtectedRoute allowedRoles={["restaurant"]} requireCompleteProfile>
            <RestaurantOrderHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/menu"
        element={
          <ProtectedRoute allowedRoles={["restaurant"]} requireCompleteProfile>
            <MenuList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/menu/create"
        element={
          <ProtectedRoute allowedRoles={["restaurant"]} requireCompleteProfile>
            <MenuCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/menu/edit/:id"
        element={
          <ProtectedRoute allowedRoles={["restaurant"]} requireCompleteProfile>
            <MenuEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/categories"
        element={
          <ProtectedRoute allowedRoles={["restaurant"]} requireCompleteProfile>
            <CategoryManager />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute allowedRoles={["customer"]} requireCompleteProfile>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/restaurants"
        element={
          <ProtectedRoute allowedRoles={["customer"]} requireCompleteProfile>
            <CustomerRestaurants />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/restaurant/:id"
        element={
          <ProtectedRoute allowedRoles={["customer"]} requireCompleteProfile>
            <CustomerRestaurantMenu />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/orders"
        element={
          <ProtectedRoute allowedRoles={["customer"]} requireCompleteProfile>
            <CustomerOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/orders/:id"
        element={
          <ProtectedRoute allowedRoles={["customer"]} requireCompleteProfile>
            <CustomerOrderDetails />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
