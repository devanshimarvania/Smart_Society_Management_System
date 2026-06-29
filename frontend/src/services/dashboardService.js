import api from "./api";

const getAdminDashboard = () => api.get("/dashboard/admin");
const getResidentDashboard = () => api.get("/dashboard/resident");
const getSecurityDashboard = () => api.get("/dashboard/security");
const getMaintenanceDashboard = () => api.get("/dashboard/maintenance");

export default {
  getAdminDashboard,
  getResidentDashboard,
  getSecurityDashboard,
  getMaintenanceDashboard,
};
