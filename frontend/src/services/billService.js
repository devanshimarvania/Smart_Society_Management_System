import api from "./api";

const generateBill = (data) => api.post("/bills", data);
const bulkGenerateBills = (data) => api.post("/bills/bulk-generate", data);
const runOverdueCheck = () => api.post("/bills/run-overdue-check");
const getBills = (params) => api.get("/bills", { params });
const getMyBills = () => api.get("/bills/me");
const getBillById = (id) => api.get(`/bills/${id}`);
const applyPenalty = (id) => api.put(`/bills/${id}/apply-penalty`);
const deleteBill = (id) => api.delete(`/bills/${id}`);

export default {
  generateBill,
  bulkGenerateBills,
  runOverdueCheck,
  getBills,
  getMyBills,
  getBillById,
  applyPenalty,
  deleteBill,
};
