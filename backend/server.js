import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js"; // ✅ NEW

dotenv.config();
connectDB();

const app = express();

/* =========================
   🌐 CORS CONFIG
========================= */
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    // ✅ Deploy ke baad uncomment karo:
    // "https://rvgifts.com",
    // "https://www.rvgifts.com",
    // "https://admin.rvgifts.com",
];

if (process.env.NODE_ENV !== "production") {
    allowedOrigins.push(
        "http://10.137.66.92:5173",
        "http://10.137.66.92:5174"
    );
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.warn(`⚠️  CORS blocked: ${origin}`);
        callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
}));

/* =========================
   🧩 MIDDLEWARES
========================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =========================
   🩺 HEALTH CHECK
========================= */
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "RV Gift Shop API running 🚀",
        env: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
    });
});

/* =========================
   🔗 ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/uploads", uploadRoutes); // ✅ NEW

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

/* =========================
   🌐 GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ success: false, message: "Invalid JSON format" });
    }
    if (err.message?.startsWith("CORS blocked")) {
        return res.status(403).json({ success: false, message: err.message });
    }
    console.error("SERVER ERROR:", err.message);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === "production"
            ? "Internal Server Error"
            : err.message,
    });
});

/* =========================
   🚀 START
========================= */
const PORT = process.env.PORT || 9000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Mode: ${process.env.NODE_ENV || "development"}`);
});