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
    requestReturn,
    processReturn,
    processRefund,
    retryRefund,
    getRefundQueue,
    getReturnQueue,
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
router.get("/admin/returns", protect, adminOnly, getReturnQueue);
router.get("/admin/flagged", protect, adminOnly, getFlaggedOrders);

/* ── ADMIN MANAGEMENT ── */
router.get("/", protect, adminOnly, getAllOrders);
router.put("/:id", protect, adminOnly, updateOrderStatus);

/* ── USER ACTIONS ── */
router.patch("/:id/cancel", protect, cancelOrder);
router.post("/:id/return", protect, requestReturn);

/* ── ADMIN ACTIONS on specific order ── */
router.put("/:id/return/process", protect, adminOnly, processReturn);
router.put("/:id/refund/process", protect, adminOnly, processRefund);   // also callable from AdminRefundReturn
router.put("/:id/refund/retry", protect, adminOnly, retryRefund);

/* ── INVOICE (owner or admin) ── */
router.get("/:id/invoice", protect, downloadInvoice);

/* ── GET SINGLE ORDER — MUST be last ── */
router.get("/:id", protect, getOrderById);


// shiprocket webhook (no auth — called by Shiprocket)
router.post("/shipping/webhook", shiprocketWebhook);
export default router;