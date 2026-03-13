/**
 * orderRoutes.js
 * All order-related routes (user + admin)
 */

import express from "express";
import {
    createOrder,
    getMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    processRefund,
    retryRefund,
    getRefundQueue,
    getFlaggedOrders,
    shiprocketWebhook,
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { downloadInvoice } from "../controllers/invoiceController.js";

const router = express.Router();

/* ═══════════════════════════════════════
   ⚠️ IMPORTANT: Specific named routes MUST
   come before dynamic /:id routes
═══════════════════════════════════════ */

/* ── USER ROUTES ── */
router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);

/* ── ADMIN QUEUE ROUTES (before /:id) ── */
router.get("/admin/refunds", protect, adminOnly, getRefundQueue);
router.get("/admin/flagged", protect, adminOnly, getFlaggedOrders);

/* ── ADMIN MANAGEMENT ── */
router.get("/", protect, adminOnly, getAllOrders);
router.put("/:id", protect, adminOnly, updateOrderStatus);

/* ── USER ACTIONS ── */
router.patch("/:id/cancel", protect, cancelOrder);

/* ── ADMIN REFUND ACTIONS ── */
router.put("/:id/refund/process", protect, adminOnly, processRefund);
router.put("/:id/refund/retry", protect, adminOnly, retryRefund);

/* ── INVOICE (owner or admin) ── */
router.get("/:id/invoice", protect, downloadInvoice);

/* ── GET SINGLE ORDER — MUST be last ── */
router.get("/:id", protect, getOrderById);

/* ── SHIPROCKET WEBHOOK (no auth) ── */
// router.post("/shipping/webhook", shiprocketWebhook);

export default router;