import axios from "axios";

// Base axios instance pointing at the backend API.
// Per project convention, the backend runs on http://localhost:9000
const api = axios.create({
  baseURL: "http://localhost:9000/api",
});

// Attach JWT token (if present) to every outgoing request
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Global response handling - if token is invalid/expired, log the user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
