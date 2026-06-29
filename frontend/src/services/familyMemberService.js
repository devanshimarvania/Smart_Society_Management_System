import api from "./api";

const addFamilyMember = (formData) =>
  api.post("/family-members", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

const getMyFamilyMembers = () => api.get("/family-members/me");
const getFamilyMembersByResident = (residentId) =>
  api.get(`/family-members/resident/${residentId}`);
const updateFamilyMember = (id, formData) =>
  api.put(`/family-members/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
const deleteFamilyMember = (id) => api.delete(`/family-members/${id}`);

export default {
  addFamilyMember,
  getMyFamilyMembers,
  getFamilyMembersByResident,
  updateFamilyMember,
  deleteFamilyMember,
};
