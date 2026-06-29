import api from "./api";

const raiseComplaint = (formData) =>
  api.post("/complaints", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

const getComplaints = (params) => api.get("/complaints", { params });
const getMyComplaints = () => api.get("/complaints/me");
const getAssignedToMe = () => api.get("/complaints/assigned-to-me");
const getComplaintById = (id) => api.get(`/complaints/${id}`);
const assignComplaint = (id, staffId) =>
  api.put(`/complaints/${id}/assign`, { staffId });
const updateStatus = (id, formData) =>
  api.put(`/complaints/${id}/status`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
const closeComplaint = (id) => api.put(`/complaints/${id}/close`);
const reopenComplaint = (id, note) =>
  api.put(`/complaints/${id}/reopen`, { note });
const deleteComplaint = (id) => api.delete(`/complaints/${id}`);

export default {
  raiseComplaint,
  getComplaints,
  getMyComplaints,
  getAssignedToMe,
  getComplaintById,
  assignComplaint,
  updateStatus,
  closeComplaint,
  reopenComplaint,
  deleteComplaint,
};
