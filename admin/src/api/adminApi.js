import axios from "axios";

const adminApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
    timeout: 15000,
});

/* ===============================
   ATTACH ADMIN TOKEN
================================ */
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
        } catch (err) {
            console.warn("Invalid adminAuth storage");
            localStorage.removeItem("adminAuth");
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/* ===============================
   HANDLE RESPONSES
================================ */
adminApi.interceptors.response.use(
    (response) => response,
    (error) => {

        // only logout if token truly invalid
        if (error.response?.status === 401) {
            console.warn("Admin token expired");

            localStorage.removeItem("adminAuth");

            setTimeout(() => {
                window.location.href = "/admin/login";
            }, 300);
        }

        if (error.response?.status === 403) {
            console.warn("Admin access denied");
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