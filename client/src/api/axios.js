import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:9000/api";

const api = axios.create({
  baseURL,
  timeout: 60000, // 60s — Render cold start handle karta hai
});

// ── Request: token attach ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem("auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch {
      localStorage.removeItem("auth");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: error handling ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expire ya invalid — clean logout + redirect
      localStorage.removeItem("auth");
      if (!window.location.pathname.includes("/login")) {
        window.location.replace("/login");
      }
    }

    if (error.code === "ECONNABORTED") {
      error.message = "Request timed out. Please try again.";
    }

    if (!error.response) {
      error.message = "Network error. Please try again.";
    }

    return Promise.reject(error);
  }
);

export default api;