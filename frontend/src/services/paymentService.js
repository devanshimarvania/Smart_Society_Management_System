import api from "./api";

const recordPayment = (data) => api.post("/payments", data);
const getPayments = (params) => api.get("/payments", { params });
const getMyPayments = () => api.get("/payments/me");

export default { recordPayment, getPayments, getMyPayments };
