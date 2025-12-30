import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: "http://3.29.249.5:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    console.log(`[🚀 Request] ${config.method?.toUpperCase()} ${config.url}`);
    console.log(
      `[🔑 Token in Storage]`,
      token ? "Yes (Exists)" : "NULL (Missing)"
    );

    if (token) {
      // IMPORTANT — backend expects RAW token (NO Bearer)
      config.headers.Authorization = token;
    }

    return config;
  },
  (error) => {
    console.error("[❌ Request Error]", error);
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => {
    console.log(`[✅ Success] ${response.config.url}`, response.status);
    return response;
  },

  (error) => {
    console.error(
      `[🔥 Response Error] ${error.config?.url}`,
      error.response?.status,
      error.message
    );

    // Logout ONLY when API returns 401
    if (error.response?.status === 401) {
      console.warn("⚠️ 401 Unauthorized — Logging Out");

      if (window.location.pathname !== "/login") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
