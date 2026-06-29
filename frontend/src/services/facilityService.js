import api from "./api";

const getFacilities = () => api.get("/facilities");
const getFacilityById = (id) => api.get(`/facilities/${id}`);
const createFacility = (formData) =>
  api.post("/facilities", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
const updateFacility = (id, formData) =>
  api.put(`/facilities/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
const deleteFacility = (id) => api.delete(`/facilities/${id}`);

export default {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
};
