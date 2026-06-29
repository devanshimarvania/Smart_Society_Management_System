import api from "./api";

const createBooking = (data) => api.post("/bookings", data);
const getBookings = (params) => api.get("/bookings", { params });
const getMyBookings = () => api.get("/bookings/me");
const updateApproval = (id, status, rejectionReason) =>
  api.put(`/bookings/${id}/approval`, { status, rejectionReason });
const cancelBooking = (id) => api.put(`/bookings/${id}/cancel`);

export default {
  createBooking,
  getBookings,
  getMyBookings,
  updateApproval,
  cancelBooking,
};
