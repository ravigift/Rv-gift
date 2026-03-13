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
} from "../controllers/authController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public
router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/save-location", saveLocation);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected
router.get("/profile", protect, getProfile);

// Admin only
router.get("/users", protect, adminOnly, getAllUsers);

export default router;