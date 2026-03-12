import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import walkInRoutes from "./routes/walkInRoutes.js";
import paymentRoutes from "./routes/paymentRoutes .js";
import shiprocketRoutes from "./routes/shiprocketRoutes.js";

dotenv.config();

connectDB();

const app = express();

/* ── CORS ── */
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://rv-gift.vercel.app",
    "https://rv-gift-admin.vercel.app",
];
if (process.env.CORS_ORIGINS) {
    process.env.CORS_ORIGINS.split(",").forEach(o => {
        const t = o.trim();
        if (t && !allowedOrigins.includes(t)) allowedOrigins.push(t);
    });
}
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        console.warn("CORS blocked:", origin);
        cb(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

/* ── SECURITY ── */
app.use(helmet());

/* ── RATE LIMITING ── */
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: "Too many attempts. Try after 15 minutes." } }));
app.use("/api/auth/register", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: "Too many attempts. Try after 15 minutes." } }));
app.use("/api", rateLimit({ windowMs: 60 * 1000, max: 100, message: { message: "Too many requests. Slow down." } }));

/* ── BODY PARSERS ──
   IMPORTANT: Webhook needs raw body — must be BEFORE express.json() */
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ── REQUEST LOGGER ── */
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

/* ── HEALTH CHECK ── */
app.get("/", (_req, res) => res.json({
    success: true,
    message: "RV Gift Shop API running",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
}));

/* ── ROUTES ── */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/walkin", walkInRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/shipping", shiprocketRoutes);

/* ── 404 ── */
app.use((req, res) => res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.originalUrl}` }));

/* ── GLOBAL ERROR HANDLER ── */
app.use((err, _req, res, _next) => {
    console.error("SERVER ERROR:", err.message);
    if (err.message === "CORS not allowed")
        return res.status(403).json({ success: false, message: err.message });
    if (err instanceof SyntaxError)
        return res.status(400).json({ success: false, message: "Invalid JSON" });
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
    });
});

/* ── START ── */
const PORT = process.env.PORT || 9000;
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Mode: ${process.env.NODE_ENV || "development"}`);
    console.log(`Allowed Origins:`, allowedOrigins);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGUSR2", () => server.close(() => process.exit(0)));

export default app;