import api from "./api";

const addVisitor = (formData) =>
  api.post("/visitors", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

const getVisitors = (params) => api.get("/visitors", { params });
const getPendingForMe = () => api.get("/visitors/pending-for-me");
const getMyHistory = () => api.get("/visitors/my-history");
const getVisitorById = (id) => api.get(`/visitors/${id}`);
const updateApproval = (id, approvalStatus) =>
  api.put(`/visitors/${id}/approval`, { approvalStatus });
const markExit = (id) => api.put(`/visitors/${id}/exit`);

export default {
  addVisitor,
  getVisitors,
  getPendingForMe,
  getMyHistory,
  getVisitorById,
  updateApproval,
  markExit,
};
