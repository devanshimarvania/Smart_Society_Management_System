import api from "./api";

const getMyNotifications = (isRead) => {
  const query = isRead !== undefined ? `?isRead=${isRead}` : "";
  return api.get(`/notifications${query}`);
};

const markAsRead = (id) => api.put(`/notifications/${id}/read`);

const markAllAsRead = () => api.put("/notifications/mark-all-read");

const deleteNotification = (id) => api.delete(`/notifications/${id}`);

export default {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
