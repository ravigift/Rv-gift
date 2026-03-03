// import axios from "axios";

// const api = axios.create({
//     baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
//     timeout: 15000, // 15 sec timeout
// });

// /* ===============================
//    ATTACH USER TOKEN
// ================================ */
// api.interceptors.request.use(
//     (config) => {
//         try {
//             const stored = localStorage.getItem("auth");
//             if (stored) {
//                 const { token } = JSON.parse(stored);
//                 if (token) {
//                     config.headers.Authorization = `Bearer ${token}`;
//                 }
//             }
//         } catch {
//             // corrupted localStorage — ignore
//             localStorage.removeItem("auth");
//         }
//         return config;
//     },
//     (error) => Promise.reject(error)
// );

// /* ===============================
//    HANDLE RESPONSES
// ================================ */
// api.interceptors.response.use(
//     (res) => res,
//     (err) => {
//         if (err.response?.status === 401) {
//             // Clear invalid auth silently
//             localStorage.removeItem("auth");
//             delete api.defaults.headers.common["Authorization"];
//         }

//         if (err.code === "ECONNABORTED") {
//             err.message = "Request timed out. Please try again.";
//         }

//         if (!err.response) {
//             err.message = "Network error. Check your connection.";
//         }

//         return Promise.reject(err);
//     }
// );

// export default api;



// import axios from "axios";

// const api = axios.create({
//     baseURL: `${import.meta.env.VITE_API_URL}/api`,
//     timeout: 15000,
// });

// /* ===============================
//    ATTACH USER TOKEN
// ================================ */
// api.interceptors.request.use(
//     (config) => {
//         try {
//             const stored = localStorage.getItem("auth");
//             if (stored) {
//                 const { token } = JSON.parse(stored);
//                 if (token) {
//                     config.headers.Authorization = `Bearer ${token}`;
//                 }
//             }
//         } catch {
//             localStorage.removeItem("auth");
//         }
//         return config;
//     },
//     (error) => Promise.reject(error)
// );

// /* ===============================
//    HANDLE RESPONSES
// ================================ */
// api.interceptors.response.use(
//     (res) => res,
//     (err) => {
//         if (err.response?.status === 401) {
//             localStorage.removeItem("auth");
//             delete api.defaults.headers.common["Authorization"];
//         }

//         if (err.code === "ECONNABORTED") {
//             err.message = "Request timed out. Please try again.";
//         }

//         if (!err.response) {
//             err.message = "Network error. Check your connection.";
//         }

//         return Promise.reject(err);
//     }
// );

// export default api;


import axios from "axios";

const api = axios.create({
    baseURL: "https://rv-gift-backend.onrender.com/api",
    timeout: 15000,
    withCredentials: true,
});

export default api;