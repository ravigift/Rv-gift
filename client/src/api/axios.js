import axios from "axios";

/* ======================================
   BASE URL (Production + Local Safe)
====================================== */
const baseURL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:9000/api";

/* ======================================
   AXIOS INSTANCE
====================================== */
const api = axios.create({
    baseURL,
    timeout: 15000,
    // withCredentials: true,
});

/* ======================================
   REQUEST INTERCEPTOR
   Attach JWT Token
====================================== */
api.interceptors.request.use(
    (config) => {
        try {
            const stored = localStorage.getItem("auth");

            if (stored) {
                const { token } = JSON.parse(stored);

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch {
            localStorage.removeItem("auth");
        }

        return config;
    },
    (error) => Promise.reject(error)
);


api.interceptors.request.use((config) => {
    console.log("TOKEN SENT:", config.headers.Authorization);
    return config;
});

/* ======================================
   RESPONSE INTERCEPTOR
====================================== */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("auth");
        }

        if (!error.response) {
            error.message = "Network error. Please try again.";
        }

        return Promise.reject(error);
    }
);

export default api;