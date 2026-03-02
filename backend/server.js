


import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();

/* =========================
   🔌 DB CONNECT
========================= */
connectDB();

const app = express();

/* =========================
   🛡️ SECURITY
========================= */
app.use(helmet());

/* =========================
   🌐 CORS CONFIG (PRODUCTION SAFE)
========================= */
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : ["http://localhost:5173"];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);

            console.warn("❌ CORS blocked:", origin);
            callback(new Error("CORS not allowed"));
        },
        credentials: true,
    })
);

/* =========================
   🧩 BODY PARSERS
========================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =========================
   📜 BASIC LOGGER (FREE HOSTING DEBUG)
========================= */
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

/* =========================
   🩺 HEALTH CHECK
========================= */
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "RV Gift Shop API running 🚀",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
    });
});

/* =========================
   🔗 API ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/uploads", uploadRoutes);

/* =========================
   🚫 404 HANDLER
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
    console.error("🔥 SERVER ERROR:", err.message);

    if (err.message === "CORS not allowed") {
        return res.status(403).json({ success: false, message: err.message });
    }

    if (err instanceof SyntaxError) {
        return res.status(400).json({ success: false, message: "Invalid JSON format" });
    }

    res.status(err.status || 500).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Internal Server Error"
                : err.message,
    });
});

/* =========================
   🚀 SERVER START
========================= */
const PORT = process.env.PORT || 9000;

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Mode: ${process.env.NODE_ENV || "development"}`);
});

/* =========================
   🧹 GRACEFUL SHUTDOWN
========================= */
process.on("SIGTERM", () => {
    console.log("🛑 SIGTERM received. Shutting down...");
    server.close(() => process.exit(0));
});