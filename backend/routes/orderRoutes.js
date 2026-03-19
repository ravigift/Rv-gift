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
    // TODO (3 months): Re-enable when Shiprocket webhook integration is active
    // shiprocketWebhook,
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

/* ── INVOICE — sirf order owner ya admin/owner ── */
// ✅ controller mein isOwner || isAdmin check hai, route pe protect zaroori hai
// Note: adminOnly nahi kyunki user bhi apna invoice download kar sakta hai
// Controller already handles both cases securely
router.get("/:id/invoice", protect, downloadInvoice);

/* ── GET SINGLE ORDER — MUST be last ── */
router.get("/:id", protect, getOrderById);

/*
 * ─────────────────────────────────────────────────────────────
 * TODO (3 months): Re-enable Shiprocket webhook when integration
 * is active. This route receives real-time shipment status
 * updates (AWB assigned, shipped, delivered, etc.) from
 * Shiprocket and syncs them to the order document.
 * No auth middleware — Shiprocket calls this externally.
 * ─────────────────────────────────────────────────────────────
 * router.post("/shipping/webhook", shiprocketWebhook);
 */

export default router;