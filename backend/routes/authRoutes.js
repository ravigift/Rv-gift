import express from "express";
import {
    register,
    login,
    verifyOtp,
    resendOtp,
    getProfile,
    saveLocation,
    getAllUsers,
    forgotPassword,
    resetPassword,
    adminForgotPassword,
    adminResetPassword,
} from "../controllers/authController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ── User Auth (Public) ──────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/save-location", protect, saveLocation); // ✅ auth required — IDOR fix

// ── User Password Reset  →  rvgift.com ─────────────────────
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ── Admin Password Reset  →  admin.rvgift.com ──────────────
// Alag routes — ADMIN_FRONTEND_URL use karta hai
// Role check: sirf admin/owner reset kar sakta hai
router.post("/admin/forgot-password", adminForgotPassword);
router.post("/admin/reset-password/:token", adminResetPassword);

// ── Protected ──────────────────────────────────────────────
router.get("/profile", protect, getProfile);

// ── Admin Only ─────────────────────────────────────────────
router.get("/users", protect, adminOnly, getAllUsers);

export default router;