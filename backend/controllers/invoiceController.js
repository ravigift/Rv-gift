import Order from "../models/Order.js";
import { generateInvoiceBuffer } from "../utils/invoiceEmailHelper.js";

export const downloadInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).lean();

        if (!order)
            return res.status(404).json({ message: "Order not found" });

        const isOwner = order.user?.toString() === req.user._id.toString();
        const isAdmin = ["admin", "owner"].includes(req.user.role);

        if (!isOwner && !isAdmin)
            return res.status(403).json({ message: "Access denied" });

        const pdfBuffer = await generateInvoiceBuffer(order);

        const filename = `RVGifts_Invoice_${order.invoiceNumber || order._id.toString().slice(-8).toUpperCase()}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("INVOICE DOWNLOAD ERROR:", error);
        res.status(500).json({ message: "Failed to generate invoice" });
    }
};