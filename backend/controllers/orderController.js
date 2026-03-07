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
    host: "74.125.133.108", // ✅ smtp.gmail.com ka IPv4 address directly
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

transporter.verify((err) => {
    if (err) {
        console.error("❌ Email transporter error:", err.message);
        console.error("   → Check EMAIL_USER and EMAIL_PASS in .env");
        console.error("   → Gmail needs App Password, not normal password");
        console.error("   → Generate at: myaccount.google.com/apppasswords");
    } else {
        console.log("✅ Email transporter ready — Gmail connected");
    }
});

/* =========================
   📤 SEND EMAIL HELPER
========================= */
const sendEmail = async ({ to, subject, html, label = "" }) => {
    if (!to) {
        console.log(`📧 [${label}] Skipped — no email address`);
        return;
    }
    try {
        await transporter.sendMail({
            from: `"RV Gift Shop" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`✅ [${label}] Email sent to: ${to}`);
    } catch (err) {
        console.error(`❌ [${label}] Email failed: ${err.message}`);
        // ✅ Never throw — email failure should never crash the app
    }
};

/* =========================
   🛒 CREATE ORDER
========================= */
export const createOrder = async (req, res) => {
    try {
        const {
            items, customerName, phone, address,
            email, totalAmount, latitude, longitude,
        } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0)
            return res.status(400).json({ message: "Cart is empty" });

        if (!customerName?.trim() || !phone?.trim() || !address?.trim())
            return res.status(400).json({ message: "Customer details missing" });

        if (!totalAmount || Number(totalAmount) <= 0)
            return res.status(400).json({ message: "Invalid total amount" });

        const formattedItems = items.map((item) => {
            let finalImage = "";
            if (typeof item.image === "string" && item.image) {
                finalImage = item.image;
            } else if (Array.isArray(item.images) && item.images.length > 0) {
                finalImage = item.images[0]?.url || item.images[0] || "";
            }

            return {
                productId: item.productId || item._id,
                name: item.name || "Product",
                price: Number(item.price || 0),
                qty: Number(item.qty || item.quantity || 1),
                image: finalImage,
                customization: {
                    text: item.customization?.text?.trim() || "",
                    imageUrl: item.customization?.imageUrl?.trim() || "",
                    note: item.customization?.note?.trim() || "",
                },
            };
        });

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

        // ✅ Response pehle bhejo — email baad mein
        res.status(201).json({
            success: true,
            orderId: savedOrder._id,
            orderStatus: savedOrder.orderStatus,
            adminWhatsApp: generateWhatsAppLink(savedOrder),
            userWhatsApp: generateUserWhatsAppLink(savedOrder, "PLACED"),
        });

        const userMail = getOrderStatusEmailTemplate({
            customerName: customerName.trim(),
            orderId: savedOrder._id,
            status: "PLACED",
        });

        sendEmail({
            to: email?.trim(),
            subject: userMail.subject,
            html: userMail.html,
            label: "User/NewOrder",
        });

        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `🛒 New Order #${savedOrder._id.toString().slice(-6).toUpperCase()} — ₹${totalAmount}`,
            html: adminOrderEmailHTML({ order: savedOrder }),
            label: "Admin/NewOrder",
        });

    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);
        res.status(500).json({ message: "Order placement failed. Please try again." });
    }
};

/* =========================
   ❌ CANCEL ORDER (USER)
========================= */
export const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order)
            return res.status(404).json({ message: "Order not found" });

        if (order.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "Not authorized" });

        const cancellableStatuses = ["PLACED", "CONFIRMED"];
        if (!cancellableStatuses.includes(order.orderStatus)) {
            const msg = order.orderStatus === "CANCELLED"
                ? "Order is already cancelled"
                : `Cannot cancel — order is already ${order.orderStatus.toLowerCase()}`;
            return res.status(400).json({ message: msg });
        }

        order.orderStatus = "CANCELLED";
        // ✅ FIX — optional chaining, req.body undefined safe
        order.cancellationReason = req.body?.reason?.trim() || "Cancelled by customer";

        // ✅ FIX — statusTimeline nested object Mongoose update
        const existingTimeline = order.statusTimeline?.toObject
            ? order.statusTimeline.toObject()
            : { ...order.statusTimeline };

        order.statusTimeline = {
            ...existingTimeline,
            cancelledAt: new Date(),
        };
        order.markModified("statusTimeline");

        await order.save();

        // ✅ Response pehle bhejo
        res.json({ success: true, message: "Order cancelled successfully", order });

        // Email baad mein — non-blocking
        const cancelMail = getOrderStatusEmailTemplate({
            customerName: order.customerName,
            orderId: order._id,
            status: "CANCELLED",
        });

        sendEmail({
            to: order.email,
            subject: cancelMail.subject,
            html: cancelMail.html,
            label: "User/Cancel",
        });

        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `❌ Order Cancelled #${order._id.toString().slice(-6).toUpperCase()}`,
            html: adminOrderEmailHTML({ order }),
            label: "Admin/Cancel",
        });

    } catch (error) {
        console.error("CANCEL ORDER ERROR:", error);
        res.status(500).json({ message: "Failed to cancel order" });
    }
};

/* =========================
   📦 GET MY ORDERS
========================= */
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .lean();
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
   🔄 UPDATE ORDER STATUS (ADMIN)
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
        if (status === "CONFIRMED") update["statusTimeline.confirmedAt"] = new Date();
        if (status === "PACKED") update["statusTimeline.packedAt"] = new Date();
        if (status === "SHIPPED") update["statusTimeline.shippedAt"] = new Date();
        if (status === "DELIVERED") update["statusTimeline.deliveredAt"] = new Date();
        if (status === "CANCELLED") update["statusTimeline.cancelledAt"] = new Date();

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true }
        );

        if (!order)
            return res.status(404).json({ message: "Order not found" });

        res.json(order);

        // Email baad mein — non-blocking
        const statusMail = getOrderStatusEmailTemplate({
            customerName: order.customerName,
            orderId: order._id,
            status,
        });

        sendEmail({
            to: order.email,
            subject: statusMail.subject,
            html: statusMail.html,
            label: `User/Status-${status}`,
        });

        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `📦 Order ${status} | #${order._id.toString().slice(-6).toUpperCase()}`,
            html: adminOrderEmailHTML({ order }),
            label: "Admin/StatusUpdate",
        });

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
            .lean();
        res.json(orders);
    } catch (error) {
        console.error("GET ALL ORDERS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch all orders" });
    }
};


// wlco tkuz tplw cdnd