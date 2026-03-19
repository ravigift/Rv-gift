/**
 * paymentRoutes.js
 * File: routes/paymentRoutes.js  (lowercase, no space)
 */
import express from "express";
import {
   createRazorpayOrder,
   verifyPaymentAndCreateOrder,
   razorpayWebhook,
   requestRefund,
   processRefund,
   getRefundStatus,
} from "../controllers/Paymentcontroller.js"; // ✅ renamed — space hata diya
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Payment
router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyPaymentAndCreateOrder);
router.post("/webhook", razorpayWebhook);   // No auth — Razorpay calls this

// Refund — AdminOrders.jsx calls: api.put(`/payment/refund/${order._id}/process`, { action: "APPROVE"/"REJECT" })
router.post("/refund/:orderId", protect, requestRefund);
router.put("/refund/:orderId/process", protect, adminOnly, processRefund);
router.get("/refund/:orderId", protect, getRefundStatus);

export default router;