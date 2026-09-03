import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";          // ← npm install compression
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import walkInRoutes from "./routes/walkInRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js"; // ✅ renamed — space hata diya
import contactRoute from "./routes/contact.js";
// TODO (3 months): Re-enable when Shiprocket integration is active
// import shiprocketRoutes from "./routes/shiprocketRoutes.js";
import invoiceRoutes from "./routes/Invoiceroutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import siteSectionRoutes from "./routes/siteSectionRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.set("trust proxy", 1);

/* ─────────────────────────────
   CORS
───────────────────────────── */
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",

    // Vercel preview
    "https://rv-gift.vercel.app",
    "https://rv-gift-admin.vercel.app",
    "https://rv-gift-gules.vercel.app",

    // Production
    "https://rvgift.com",
    "https://www.rvgift.com",
    "https://admin.rvgift.com",
];

if (process.env.CORS_ORIGINS) {
    process.env.CORS_ORIGINS.split(",").forEach((o) => {
        const origin = o.trim();
        if (origin && !allowedOrigins.includes(origin)) allowedOrigins.push(origin);
    });
}

app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            if (allowedOrigins.includes(origin)) return cb(null, true);
            console.warn("CORS BLOCKED:", origin);
            cb(new Error("CORS not allowed"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

/* ─────────────────────────────
   SECURITY
───────────────────────────── */
// This service only returns JSON and PDF — it never renders HTML — so a
// maximally strict CSP is safe and blocks any injected markup from executing.
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                "default-src": ["'none'"],
                "frame-ancestors": ["'none'"],
                "base-uri": ["'none'"],
                "form-action": ["'none'"],
            },
        },
        crossOriginResourcePolicy: { policy: "cross-origin" }, // PDFs fetched by the SPA
        referrerPolicy: { policy: "no-referrer" },
    })
);


/* ─────────────────────────────
   GZIP COMPRESSION
   Compresses all JSON/HTML responses — typically 60-80% smaller,
   which means faster API responses and page loads.
───────────────────────────── */
app.use(compression());

/* ─────────────────────────────
   RATE LIMIT
───────────────────────────── */
const limiter = (windowMs, max, message, opts = {}) =>
    rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { message }, ...opts });

// Endpoints that send an email / OTP — strict, to stop inbox bombing & OTP abuse
const emailAbuseLimiter = limiter(15 * 60 * 1000, 5, "Too many requests. Please wait 15 minutes and try again.");
app.use("/api/auth/register", emailAbuseLimiter);
app.use("/api/auth/resend-otp", emailAbuseLimiter);
app.use("/api/auth/forgot-password", emailAbuseLimiter);
app.use("/api/auth/admin/forgot-password", emailAbuseLimiter);
app.use("/api/walkin/delete-pin/send-otp", emailAbuseLimiter);
// Only throttle the PUBLIC form submission (POST). Admin GET/PATCH on /api/contact
// share this path and must not be rate-limited here.
app.use("/api/contact", limiter(60 * 60 * 1000, 5, "Too many messages. Please try again later.", {
    skip: (req) => req.method !== "POST",
}));

// Public personalisation-photo upload — guard against Cloudinary abuse
app.use("/api/uploads", limiter(60 * 60 * 1000, 40, "Too many uploads. Please try again in a bit."));

// Credential / OTP verification — brute-force guard (per-account lock is enforced in the controller too)
app.use("/api/auth/login", limiter(15 * 60 * 1000, 10, "Too many login attempts. Try again later."));
app.use("/api/auth/verify-otp", limiter(15 * 60 * 1000, 20, "Too many attempts. Try again later."));
app.use("/api/auth/reset-password", limiter(15 * 60 * 1000, 20, "Too many attempts. Try again later."));
app.use("/api/auth/admin/reset-password", limiter(15 * 60 * 1000, 20, "Too many attempts. Try again later."));

// Global catch-all
app.use("/api", limiter(60 * 1000, 100, "Too many requests. Slow down."));

/* ─────────────────────────────
   BODY PARSER
   webhook needs the raw body for signature verification
───────────────────────────── */
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/* Strip MongoDB query operators ($ / .) from parsed request bodies —
   defence-in-depth against NoSQL operator injection. */
const stripMongoOperators = (obj, depth = 0) => {
    if (!obj || typeof obj !== "object" || depth > 6) return;
    for (const key of Object.keys(obj)) {
        if (key.startsWith("$") || key.includes(".")) {
            delete obj[key];
            continue;
        }
        stripMongoOperators(obj[key], depth + 1);
    }
};
app.use((req, _res, next) => {
    if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body))
        stripMongoOperators(req.body);
    next();
});

/* ─────────────────────────────
   REQUEST LOGGER
───────────────────────────── */
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */
app.get("/", (_req, res) =>
    res.json({
        success: true,
        message: "RV Gift Shop API running",
        env: process.env.NODE_ENV || "development",
        time: new Date().toISOString(),
    })
);

/* ─────────────────────────────
   ROUTES
───────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/walkin", walkInRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/contact", contactRoute);
// TODO (3 months): Re-enable when Shiprocket integration is active
// app.use("/api/shipping", shiprocketRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/site", siteSectionRoutes);
app.use("/api/reports", reportRoutes);

/* ─────────────────────────────
   404 HANDLER
───────────────────────────── */
app.use((req, res) =>
    res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.originalUrl}` })
);

/* ─────────────────────────────
   GLOBAL ERROR HANDLER
───────────────────────────── */
app.use((err, _req, res, _next) => {
    console.error("SERVER ERROR:", err.message);
    if (err.message === "CORS not allowed")
        return res.status(403).json({ success: false, message: err.message });
    if (err instanceof SyntaxError)
        return res.status(400).json({ success: false, message: "Invalid JSON payload" });
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
    });
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */
const PORT = process.env.PORT || 9000;
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Mode: ${process.env.NODE_ENV || "development"}`);
    console.log("Allowed Origins:", allowedOrigins);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGUSR2", () => server.close(() => process.exit(0)));

export default app;