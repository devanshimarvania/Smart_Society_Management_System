import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

// Auth pages
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

// Dashboards
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import ResidentDashboard from "./pages/Dashboard/ResidentDashboard";
import SecurityDashboard from "./pages/Dashboard/SecurityDashboard";
import MaintenanceDashboard from "./pages/Dashboard/MaintenanceDashboard";

// Admin-only modules
import FlatsList from "./pages/Flats/FlatsList";
import ResidentsList from "./pages/Residents/ResidentsList";
import ResidentDetail from "./pages/Residents/ResidentDetail";
import AdminComplaintsList from "./pages/Complaints/AdminComplaintsList";
import AdminBillsList from "./pages/Bills/AdminBillsList";
import FacilitiesList from "./pages/Facilities/FacilitiesList";
import AdminBookingsList from "./pages/Bookings/AdminBookingsList";
import ReportsPage from "./pages/Reports/ReportsPage";

// Shared modules (used by multiple roles, behavior adapts internally)
import VisitorsPage from "./pages/Visitors/VisitorsPage";
import ComplaintsPage from "./pages/Complaints/ComplaintsPage";
import BillsPage from "./pages/Bills/BillsPage";
import BookingsPage from "./pages/Bookings/BookingsPage";
import NoticesPage from "./pages/Notices/NoticesPage";
import PollsPage from "./pages/Polls/PollsPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import ResidentProfile from "./pages/Profile/ResidentProfile";

// Maintenance-only
import MaintenanceComplaintsList from "./pages/Complaints/MaintenanceComplaintsList";

function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:resetToken" element={<ResetPassword />} />

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="flats" element={<FlatsList />} />
          <Route path="residents" element={<ResidentsList />} />
          <Route path="residents/:id" element={<ResidentDetail />} />
          <Route path="visitors" element={<VisitorsPage />} />
          <Route path="complaints" element={<AdminComplaintsList />} />
          <Route path="bills" element={<AdminBillsList />} />
          <Route path="facilities" element={<FacilitiesList />} />
          <Route path="bookings" element={<AdminBookingsList />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="polls" element={<PollsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Resident routes */}
      <Route element={<ProtectedRoute allowedRoles={["resident"]} />}>
        <Route path="/resident" element={<DashboardLayout />}>
          <Route path="dashboard" element={<ResidentDashboard />} />
          <Route path="profile" element={<ResidentProfile />} />
          <Route path="visitors" element={<VisitorsPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="bills" element={<BillsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="polls" element={<PollsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Security routes */}
      <Route element={<ProtectedRoute allowedRoles={["security"]} />}>
        <Route path="/security" element={<DashboardLayout />}>
          <Route path="dashboard" element={<SecurityDashboard />} />
          <Route path="visitors" element={<VisitorsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Maintenance routes */}
      <Route element={<ProtectedRoute allowedRoles={["maintenance"]} />}>
        <Route path="/maintenance" element={<DashboardLayout />}>
          <Route path="dashboard" element={<MaintenanceDashboard />} />
          <Route path="complaints" element={<MaintenanceComplaintsList />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
