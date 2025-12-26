import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  // UPDATED: Changed to relative path '/api' to work with Vercel Rewrites
  // This prevents the "Mixed Content" error by proxying through Vercel.
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// REQUEST INTERCEPTOR: Attach Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Send token exactly as backend expects
      config.headers["Authorization"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Handle Errors & Auto Logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Session Expired)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      toast.error("Session expired. Please login again.");

      // Use window.location to force full refresh and clear state
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
