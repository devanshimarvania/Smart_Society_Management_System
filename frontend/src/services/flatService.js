import api from "./api";

const getFlats = (params) => api.get("/flats", { params });
const getFlatById = (id) => api.get(`/flats/${id}`);
const createFlat = (data) => api.post("/flats", data);
const updateFlat = (id, data) => api.put(`/flats/${id}`, data);
const deleteFlat = (id) => api.delete(`/flats/${id}`);

export default { getFlats, getFlatById, createFlat, updateFlat, deleteFlat };
