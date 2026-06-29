import api from "./api";

const getNotices = (params) => api.get("/notices", { params });
const getNoticeById = (id) => api.get(`/notices/${id}`);
const createNotice = (formData) =>
  api.post("/notices", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
const updateNotice = (id, formData) =>
  api.put(`/notices/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
const deleteNotice = (id) => api.delete(`/notices/${id}`);

export default { getNotices, getNoticeById, createNotice, updateNotice, deleteNotice };
