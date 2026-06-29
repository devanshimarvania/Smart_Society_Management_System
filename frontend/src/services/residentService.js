import api from "./api";

const getResidents = (params) => api.get("/residents", { params });
const getMyProfile = () => api.get("/residents/me");
const getResidentById = (id) => api.get(`/residents/${id}`);
const createResident = (data) => api.post("/residents", data);
const updateResident = (id, data) => api.put(`/residents/${id}`, data);
const reallocateFlat = (id, newFlatId) =>
  api.put(`/residents/${id}/reallocate-flat`, { newFlatId });
const deleteResident = (id) => api.delete(`/residents/${id}`);

export default {
  getResidents,
  getMyProfile,
  getResidentById,
  createResident,
  updateResident,
  reallocateFlat,
  deleteResident,
};
