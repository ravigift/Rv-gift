import Order from "../models/Order.js";
import nodemailer from "nodemailer";
import {
    generateWhatsAppLink,
    generateUserWhatsAppLink,
} from "../utils/whatsapp.js";
import { getOrderStatusEmailTemplate } from "../utils/orderStatusEmail.js";
import { adminOrderEmailHTML } from "../utils/adminOrderEmail.js";

/* =========================
   📧 EMAIL CONFIG
========================= */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/* =========================
   🛒 CREATE ORDER
========================= */
export const createOrder = async (req, res) => {
    try {
        const {
            items,
            customerName,
            phone,
            address,
            email,
            totalAmount,
            latitude,
            longitude,
        } = req.body;

        /* ── Validation ── */
        if (!items || !Array.isArray(items) || items.length === 0)
            return res.status(400).json({ message: "Cart is empty" });

        if (!customerName?.trim() || !phone?.trim() || !address?.trim())
            return res.status(400).json({ message: "Customer details missing" });

        if (!totalAmount || Number(totalAmount) <= 0)
            return res.status(400).json({ message: "Invalid total amount" });

        /* ── Normalize Items ── */
        const formattedItems = items.map((item) => {
            // Image resolve
            let finalImage = "";
            if (typeof item.image === "string" && item.image) {
                finalImage = item.image;
            } else if (Array.isArray(item.images) && item.images.length > 0) {
                finalImage = item.images[0]?.url || item.images[0] || "";
            }

            // ✅ Customization — text, image, note
            const customization = {
                text: item.customization?.text?.trim() || "",
                imageUrl: item.customization?.imageUrl?.trim() || "",
                note: item.customization?.note?.trim() || "",
            };

            return {
                productId: item.productId || item._id,
                name: item.name || "Product",
                price: Number(item.price || 0),
                qty: Number(item.qty || item.quantity || 1),
                image: finalImage,
                customization,
            };
        });

        /* ── Create & Save ── */
        const order = new Order({
            user: req.user._id,
            items: formattedItems,
            customerName: customerName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            email: email?.trim() || "",
            latitude,
            longitude,
            totalAmount: Number(totalAmount),
            orderStatus: "PLACED",
            statusTimeline: { placedAt: new Date() },
        });

        const savedOrder = await order.save();

        /* ── Fast Response ── */
        res.status(201).json({
            success: true,
            orderId: savedOrder._id,
            orderStatus: savedOrder.orderStatus,
            adminWhatsApp: generateWhatsAppLink(savedOrder),
            userWhatsApp: generateUserWhatsAppLink(savedOrder, "PLACED"),
        });

        /* ── Emails (non-blocking) ── */
        try {
            const userMail = getOrderStatusEmailTemplate({
                customerName: customerName.trim(),
                orderId: savedOrder._id,
                status: "PLACED",
            });
            const adminMailHTML = adminOrderEmailHTML({ order: savedOrder });

            if (email?.trim()) {
                transporter.sendMail({
                    from: `"RV Gift Shop" <${process.env.EMAIL_USER}>`,
                    to: email.trim(),
                    subject: userMail.subject,
                    html: userMail.html,
                }).catch(err => console.error("User email failed:", err.message));
            }

            transporter.sendMail({
                from: `"Order Bot" <${process.env.EMAIL_USER}>`,
                to: process.env.ADMIN_EMAIL,
                subject: `🛒 New Order #${savedOrder._id.toString().slice(-6).toUpperCase()} — ₹${totalAmount}`,
                html: adminMailHTML,
            }).catch(err => console.error("Admin email failed:", err.message));

        } catch (mailError) {
            console.error("Email process error:", mailError.message);
        }

    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);
        res.status(500).json({ message: "Order placement failed. Please try again." });
    }
};

/* =========================
   📦 GET MY ORDERS
========================= */
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .lean(); // faster read
        res.json(orders);
    } catch (error) {
        console.error("GET MY ORDERS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

/* =========================
   🔍 GET ORDER BY ID
========================= */
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).lean();

        if (!order)
            return res.status(404).json({ message: "Order not found" });

        // ✅ Only owner or admin can see others' orders
        const isOwner = order.user?.toString() === req.user._id.toString();
        const isAdmin = ["admin", "owner"].includes(req.user.role);

        if (!isOwner && !isAdmin)
            return res.status(403).json({ message: "Access denied" });

        res.json(order);
    } catch (error) {
        console.error("GET ORDER BY ID ERROR:", error);
        res.status(500).json({ message: "Error fetching order" });
    }
};

/* =========================
   🔄 UPDATE ORDER STATUS
========================= */
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = [
            "PLACED", "CONFIRMED", "PACKED",
            "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"
        ];

        if (!validStatuses.includes(status))
            return res.status(400).json({ message: "Invalid status value" });

        const update = { orderStatus: status };

        // Timeline timestamps
        if (status === "CONFIRMED") update["statusTimeline.confirmedAt"] = new Date();
        if (status === "PACKED") update["statusTimeline.packedAt"] = new Date();
        if (status === "SHIPPED") update["statusTimeline.shippedAt"] = new Date();
        if (status === "DELIVERED") update["statusTimeline.deliveredAt"] = new Date();

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true }
        );

        if (!order)
            return res.status(404).json({ message: "Order not found" });

        /* ── Status Emails ── */
        try {
            const userMail = getOrderStatusEmailTemplate({
                customerName: order.customerName,
                orderId: order._id,
                status,
            });
            const adminMailHTML = adminOrderEmailHTML({ order });

            if (order.email) {
                transporter.sendMail({
                    from: `"RV Gift Shop" <${process.env.EMAIL_USER}>`,
                    to: order.email,
                    subject: userMail.subject,
                    html: userMail.html,
                }).catch(err => console.error("User status email failed:", err.message));
            }

            transporter.sendMail({
                from: `"Order Bot" <${process.env.EMAIL_USER}>`,
                to: process.env.ADMIN_EMAIL,
                subject: `📦 Order ${status} | #${order._id.toString().slice(-6).toUpperCase()}`,
                html: adminMailHTML,
            }).catch(err => console.error("Admin status email failed:", err.message));

        } catch (mailErr) {
            console.error("Status mail error:", mailErr.message);
        }

        res.json(order);

    } catch (error) {
        console.error("UPDATE ORDER STATUS ERROR:", error);
        res.status(500).json({ message: "Failed to update order status" });
    }
};

/* =========================
   🧾 GET ALL ORDERS (ADMIN)
========================= */
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .lean(); // faster read
        res.json(orders);
    } catch (error) {
        console.error("GET ALL ORDERS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch all orders" });
    }
};



/* =========================
   ❌ CANCEL ORDER (USER)
   PATCH /api/orders/:id/cancel
========================= */
export const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order)
            return res.status(404).json({ message: "Order not found" });

        // Only the order owner can cancel
        if (order.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "Not authorized" });

        // ✅ Real-world rule — only PLACED or CONFIRMED cancellable
        const cancellableStatuses = ["PLACED", "CONFIRMED"];
        if (!cancellableStatuses.includes(order.orderStatus)) {
            const msg = order.orderStatus === "CANCELLED"
                ? "Order is already cancelled"
                : `Cannot cancel — order is already ${order.orderStatus.toLowerCase()}`;
            return res.status(400).json({ message: msg });
        }

        order.orderStatus = "CANCELLED";
        order.statusTimeline = order.statusTimeline || {};
        order.statusTimeline.cancelledAt = new Date();
        order.cancellationReason = req.body.reason?.trim() || "Cancelled by customer";
        await order.save();

        // Email (non-blocking)
        try {
            const userMail = getOrderStatusEmailTemplate({
                customerName: order.customerName,
                orderId: order._id,
                status: "CANCELLED",
            });
            if (order.email) {
                transporter.sendMail({
                    from: `"RV Gift Shop" <${process.env.EMAIL_USER}>`,
                    to: order.email,
                    subject: userMail.subject,
                    html: userMail.html,
                }).catch(() => { });
            }
            transporter.sendMail({
                from: `"Order Bot" <${process.env.EMAIL_USER}>`,
                to: process.env.ADMIN_EMAIL,
                subject: `❌ Order Cancelled #${order._id.toString().slice(-6).toUpperCase()}`,
                html: adminOrderEmailHTML({ order }),
            }).catch(() => { });
        } catch { }

        res.json({ success: true, message: "Order cancelled successfully", order });

    } catch (error) {
        console.error("CANCEL ORDER ERROR:", error);
        res.status(500).json({ message: "Failed to cancel order" });
    }
};