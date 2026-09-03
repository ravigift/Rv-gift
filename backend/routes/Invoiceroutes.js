import express from "express";
import Order from "../models/Order.js";
import { generateInvoiceBuffer } from "../utils/invoiceEmailHelper.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ── Download Invoice PDF (user apna invoice download kare)
// GET /api/invoice/:invoiceNumber/download
router.get("/:invoiceNumber/download", protect, async (req, res) => {
    try {
        const order = await Order.findOne({
            invoiceNumber: req.params.invoiceNumber,
        });

        if (!order)
            return res.status(404).json({ message: "Invoice not found" });

        const isOwner = order.user?.toString() === req.user._id.toString();
        const isAdmin = ["admin", "owner"].includes(req.user.role);

        if (!isOwner && !isAdmin)
            return res.status(403).json({ message: "Access denied" });

        const pdfBuffer = await generateInvoiceBuffer(order);
        const filename = `RVGifts_${order.invoiceNumber}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (err) {
        console.error("INVOICE DOWNLOAD ERROR:", err);
        res.status(500).json({ message: "Invoice generation failed" });
    }
});

// ── Public Verify Route (QR scan → anyone can verify authenticity)
// GET /api/invoice/:invoiceNumber/verify
// SECURITY: invoice numbers are sequential, so this endpoint must NOT expose
// customer names, amounts or payment status — that would let anyone enumerate
// the entire customer/order list. It only confirms the number is genuine.
router.get("/:invoiceNumber/verify", async (req, res) => {
    try {
        const invoiceNumber = String(req.params.invoiceNumber || "").trim();
        if (!/^INV-\d{4}-\d{2}-\d{4,6}$/.test(invoiceNumber)) {
            return res.json({ valid: false, message: "Invalid invoice number format." });
        }

        const order = await Order.findOne({ invoiceNumber })
            .select("invoiceNumber createdAt orderStatus")
            .lean();

        if (!order) {
            return res.json({
                valid: false,
                message: "Invoice not found. This may be fake or tampered.",
            });
        }

        res.json({
            valid: true,
            invoiceNumber: order.invoiceNumber,
            issuedOn: order.createdAt,
            orderStatus: order.orderStatus,
            message: "This is an authentic RV Gifts invoice.",
        });

    } catch (err) {
        console.error("VERIFY ERROR:", err);
        res.status(500).json({ message: "Verification failed" });
    }
});

export default router;