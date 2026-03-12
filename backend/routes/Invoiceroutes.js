import express from "express";
import Order from "../models/Order.js";
// import { generateInvoicePDF } from "../utils/invoiceGenerator.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ── Download Invoice PDF (user apna invoice download kare)
// GET /api/invoice/:invoiceNumber/download
router.get("/:invoiceNumber/download", protect, async (req, res) => {
    try {
        const order = await Order.findOne({
            invoiceNumber: req.params.invoiceNumber,
        });

        if (!order) return res.status(404).json({ message: "Invoice not found" });

        // Only owner or admin
        const isOwner = order.user?.toString() === req.user._id.toString();
        const isAdmin = ["admin", "owner"].includes(req.user.role);
        if (!isOwner && !isAdmin)
            return res.status(403).json({ message: "Access denied" });

        const doc = await generateInvoicePDF(order);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition",
            `attachment; filename="RVGifts_${order.invoiceNumber}.pdf"`);
        doc.pipe(res);
    } catch (err) {
        console.error("INVOICE DOWNLOAD ERROR:", err);
        res.status(500).json({ message: "Invoice generation failed" });
    }
});

// ── Public Verify Route (QR scan → anyone can verify)
// GET /api/invoice/:invoiceNumber/verify
router.get("/:invoiceNumber/verify", async (req, res) => {
    try {
        const order = await Order.findOne({
            invoiceNumber: req.params.invoiceNumber,
        }).select("invoiceNumber customerName orderStatus payment createdAt totalAmount _id");

        if (!order) {
            return res.json({
                valid: false,
                message: "Invoice not found. This may be fake or tampered.",
            });
        }

        res.json({
            valid: true,
            invoiceNumber: order.invoiceNumber,
            orderId: `#${order._id.toString().slice(-8).toUpperCase()}`,
            customerName: order.customerName,
            orderStatus: order.orderStatus,
            paymentStatus: order.payment?.status,
            totalAmount: order.totalAmount,
            date: order.createdAt,
            message: "✅ This is an authentic RV Gifts invoice.",
        });
    } catch (err) {
        console.error("VERIFY ERROR:", err);
        res.status(500).json({ message: "Verification failed" });
    }
});

export default router;