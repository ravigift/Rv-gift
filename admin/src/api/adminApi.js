import axios from "axios";

const adminApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
    timeout: 60000, // 60s — Render cold start handle karta hai
});

// ── Request: admin token attach ──────────────────────────────
adminApi.interceptors.request.use(
    (config) => {
        try {
            const stored = localStorage.getItem("adminAuth");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.token) {
                    config.headers.Authorization = `Bearer ${parsed.token}`;
                }
            }
        } catch {
            localStorage.removeItem("adminAuth");
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response: error handling ─────────────────────────────────
adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isLoginEndpoint = error.config?.url?.includes("/auth/login");

            // Login endpoint ki 401 ignore karo — wrong password ka case hai
            // Baaki sab 401 = token expire/invalid → clean logout
            if (!isLoginEndpoint) {
                localStorage.removeItem("adminAuth");
                if (!window.location.pathname.includes("/admin/login")) {
                    window.location.replace("/admin/login");
                }
            }
        }

        if (error.response?.status === 403) {
            console.warn("Admin access denied:", error.config?.url);
        }

        if (error.code === "ECONNABORTED") {
            error.message = "Request timeout. Please try again.";
        }

        if (!error.response) {
            error.message = "Network error. Check your internet.";
        }

        return Promise.reject(error);
    }
);

export default adminApi;