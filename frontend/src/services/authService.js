import api from "./api";

const register = (data) => api.post("/auth/register", data);

const login = (data) => api.post("/auth/login", data);

const getMe = () => api.get("/auth/me");

const createUser = (data) => api.post("/auth/create-user", data);

const listUsers = (params) => api.get("/auth/users", { params });

const forgotPassword = (data) => api.post("/auth/forgot-password", data);

const resetPassword = (resetToken, data) =>
  api.put(`/auth/reset-password/${resetToken}`, data);

export default {
  register,
  login,
  getMe,
  createUser,
  listUsers,
  forgotPassword,
  resetPassword,
};
