import express from "express";
import {
    createOrder,
    getMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* ================= USER ================= */
router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);

/* ================= ADMIN ================= */
router.get("/", protect, adminOnly, getAllOrders);
router.put("/:id", protect, adminOnly, updateOrderStatus);

// ✅ CANCEL — patch hai, GET /:id se conflict nahi hoga
// Isliye position theek hai, but safer hai pehle rakhna
router.patch("/:id/cancel", protect, cancelOrder);

/* ================= LAST ================= */
router.get("/:id", protect, getOrderById); // ✅ ALWAYS LAST

export default router;