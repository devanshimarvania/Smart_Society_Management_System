import api from "./api";

const addVehicle = (data) => api.post("/vehicles", data);
const getMyVehicles = () => api.get("/vehicles/me");
const getVehiclesByResident = (residentId) =>
  api.get(`/vehicles/resident/${residentId}`);
const getAllVehicles = (params) => api.get("/vehicles", { params });
const updateVehicle = (id, data) => api.put(`/vehicles/${id}`, data);
const deleteVehicle = (id) => api.delete(`/vehicles/${id}`);

export default {
  addVehicle,
  getMyVehicles,
  getVehiclesByResident,
  getAllVehicles,
  updateVehicle,
  deleteVehicle,
};
