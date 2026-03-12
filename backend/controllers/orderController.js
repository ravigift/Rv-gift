/**
 * orderController.js — Production Grade
 * ✅ Auto Shiprocket on PACKED
 * ✅ Return system (7-day window)  
 * ✅ Refund via Razorpay API
 * ✅ Payment logs on every event
 * ✅ Fraud detection
 */

import Razorpay from "razorpay";
import Order, { generateInvoiceNumber } from "../models/Order.js";
import Product from "../models/Product.js";
import { sendEmail } from "../utils/emailService.js";
import { generateWhatsAppLink, generateUserWhatsAppLink } from "../utils/whatsapp.js";
import { getOrderStatusEmailTemplate } from "../utils/orderStatusEmail.js";
import { adminOrderEmailHTML } from "../utils/adminOrderEmail.js";
import { generateInvoiceBuffer } from "../utils/invoiceEmailHelper.js";
import { createShiprocketOrder } from "../utils/shiprocketService.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getClientIp = (req) =>
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.connection?.remoteAddress || "";

const calcTotalWeight = async (items) => {
    let total = 0;
    for (const item of items) {
        try {
            const p = await Product.findById(item.productId).select("weight").lean();
            total += (p?.weight || 500) * item.qty;
        } catch { total += 500 * item.qty; }
    }
    return Math.max(100, total);
};

/* ────────────────────────────────────────
   FRAUD CHECKER
──────────────────────────────────────── */
const checkFraud = async ({ userId, ip, amount, paymentId }) => {
    const reasons = [];
    const oneHour = new Date(Date.now() - 60 * 60 * 1000);

    if (paymentId) {
        const dup = await Order.findOne({ "payment.razorpayPaymentId": paymentId }).lean();
        if (dup) reasons.push("DUPLICATE_PAYMENT_ID");
    }

    const recentOrders = await Order.countDocuments({ user: userId, createdAt: { $gte: oneHour } });
    if (recentOrders >= 5) reasons.push("HIGH_ORDER_FREQUENCY");

    if (ip) {
        const ipOrders = await Order.countDocuments({ "payment.ip": ip, createdAt: { $gte: oneHour } });
        if (ipOrders >= 8) reasons.push("HIGH_IP_FREQUENCY");
    }

    const totalUserOrders = await Order.countDocuments({ user: userId });
    if (totalUserOrders >= 5) {
        const refundedCount = await Order.countDocuments({
            user: userId,
            "refund.status": { $in: ["APPROVED", "PROCESSED"] },
        });
        if (refundedCount / totalUserOrders > 0.3) reasons.push("HIGH_REFUND_RATE");
    }

    if (amount > 50000) reasons.push("HIGH_VALUE_ORDER");

    return { flagged: reasons.length > 0, reasons };
};

/* ════════════════════════════════════════
   CREATE ORDER (COD or post-Razorpay verify)
════════════════════════════════════════ */
export const createOrder = async (req, res) => {
    try {
        const {
            items, customerName, phone, address, email,
            totalAmount, platformFee, deliveryCharge,
            paymentMethod, latitude, longitude,
        } = req.body;

        if (!items?.length) return res.status(400).json({ message: "Cart is empty" });
        if (!customerName?.trim() || !phone?.trim() || !address?.trim())
            return res.status(400).json({ message: "Customer details missing" });
        if (!/^[6-9]\d{9}$/.test(phone.trim()))
            return res.status(400).json({ message: "Invalid phone number" });
        if (!totalAmount || Number(totalAmount) <= 0)
            return res.status(400).json({ message: "Invalid total amount" });
        if (items.length > 20) return res.status(400).json({ message: "Too many items" });

        for (const item of items) {
            const qty = Math.min(Math.max(1, Number(item.qty || item.quantity || 1)), 100);
            const product = await Product.findById(item.productId || item._id);
            if (!product) continue;
            if (!product.inStock || product.stock < qty)
                return res.status(400).json({ message: `"${product.name}" is out of stock` });
            product.stock -= qty;
            product.inStock = product.stock > 0;
            await product.save();
        }

        const formattedItems = items.map(item => ({
            productId: item.productId || item._id,
            name: String(item.name || "Product").slice(0, 200),
            price: Math.max(0, Number(item.price || 0)),
            qty: Math.min(Math.max(1, Number(item.qty || item.quantity || 1)), 100),
            image: typeof item.image === "string" ? item.image : item.images?.[0]?.url || "",
            customization: {
                text: String(item.customization?.text || "").trim().slice(0, 500),
                imageUrl: String(item.customization?.imageUrl || "").trim().slice(0, 1000),
                note: String(item.customization?.note || "").trim().slice(0, 1000),
            },
        }));

        const ip = getClientIp(req);
        const fraudCheck = await checkFraud({ userId: req.user._id, ip, amount: Number(totalAmount) });
        const method = paymentMethod === "COD" ? "COD" : "RAZORPAY";
        const invoiceNumber = await generateInvoiceNumber();

        const order = new Order({
            user: req.user._id,
            invoiceNumber,
            items: formattedItems,
            customerName: customerName.trim().slice(0, 100),
            phone: phone.trim(),
            address: address.trim().slice(0, 500),
            email: email?.trim().toLowerCase().slice(0, 200) || "",
            latitude: latitude ? Number(latitude) : undefined,
            longitude: longitude ? Number(longitude) : undefined,
            totalAmount: Number(totalAmount),
            platformFee: Number(platformFee || 9),
            deliveryCharge: Number(deliveryCharge || 0),
            payment: {
                method,
                status: "PENDING",
                ip,
                userAgent: req.headers["user-agent"]?.slice(0, 300) || "",
                flagged: fraudCheck.flagged,
                flagReasons: fraudCheck.reasons,
            },
            paymentLogs: [{
                event: "ORDER_PLACED", amount: Number(totalAmount), method, ip,
                userAgent: req.headers["user-agent"]?.slice(0, 200) || "",
                meta: { fraudCheck }, at: new Date(),
            }],
            orderStatus: "PLACED",
            statusTimeline: { placedAt: new Date() },
        });

        const savedOrder = await order.save();

        res.status(201).json({
            success: true, orderId: savedOrder._id,
            invoiceNumber: savedOrder.invoiceNumber,
            orderStatus: savedOrder.orderStatus,
            flagged: fraudCheck.flagged,
        });

        const userMail = getOrderStatusEmailTemplate({ customerName: customerName.trim(), orderId: savedOrder._id, status: "PLACED" });
        if (email?.trim() && !email.includes("@rvgifts.com"))
            sendEmail({ to: email.trim(), subject: userMail.subject, html: userMail.html, label: "User/NewOrder" });

        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `🛒 New Order #${savedOrder._id.toString().slice(-6).toUpperCase()} — ₹${totalAmount}${fraudCheck.flagged ? " ⚠️ FLAGGED" : ""}`,
            html: adminOrderEmailHTML({ order: savedOrder }),
            label: "Admin/NewOrder",
        });

        if (fraudCheck.flagged)
            console.warn(`[FRAUD] Order ${savedOrder._id} flagged:`, fraudCheck.reasons);

    } catch (err) {
        console.error("CREATE ORDER:", err);
        res.status(500).json({ message: "Order placement failed. Please try again." });
    }
};

/* ════════════════════════════════════════
   CANCEL ORDER (USER)
════════════════════════════════════════ */
export const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "Not authorized" });
        if (order.orderStatus === "CANCELLED")
            return res.status(400).json({ message: "Already cancelled" });
        if (!["PLACED", "CONFIRMED"].includes(order.orderStatus))
            return res.status(400).json({ message: `Cannot cancel — order is ${order.orderStatus.toLowerCase().replace(/_/g, " ")}` });

        order.orderStatus = "CANCELLED";
        order.cancellationReason = String(req.body?.reason || "Cancelled by customer").trim().slice(0, 500);
        const existing = order.statusTimeline?.toObject ? order.statusTimeline.toObject() : { ...order.statusTimeline };
        order.statusTimeline = { ...existing, cancelledAt: new Date() };
        order.markModified("statusTimeline");

        // Auto refund-request if paid online
        if (order.payment.method === "RAZORPAY" && order.payment.status === "PAID") {
            order.refund = {
                requested: true, requestedAt: new Date(),
                reason: req.body?.reason || "Order cancelled by customer",
                status: "REQUESTED", amount: order.totalAmount,
            };
            order.paymentLogs.push({ event: "REFUND_REQUESTED", amount: order.totalAmount, method: "RAZORPAY", ip: getClientIp(req), at: new Date() });
        }

        await order.save();

        for (const item of order.items) {
            try {
                const p = await Product.findById(item.productId);
                if (p) { p.stock += item.qty; p.inStock = p.stock > 0; await p.save(); }
            } catch (e) { console.warn("Stock restore:", e.message); }
        }

        res.json({ success: true, message: "Order cancelled", order: order.toObject(), refundRequested: !!order.refund?.requested });

        const mail = getOrderStatusEmailTemplate({ customerName: order.customerName, orderId: order._id, status: "CANCELLED" });
        if (order.email && !order.email.includes("@rvgifts.com"))
            sendEmail({ to: order.email, subject: mail.subject, html: mail.html, label: "User/Cancel" });
        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `❌ Cancelled #${order._id.toString().slice(-6).toUpperCase()} — ${order.customerName}`,
            html: adminOrderEmailHTML({ order }), label: "Admin/Cancel",
        });

    } catch (err) {
        console.error("CANCEL ORDER:", err);
        res.status(500).json({ message: "Failed to cancel order" });
    }
};

/* ════════════════════════════════════════
   GET MY ORDERS (USER)
════════════════════════════════════════ */
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
        res.json(orders);
    } catch { res.status(500).json({ message: "Failed to fetch orders" }); }
};

/* ════════════════════════════════════════
   GET ORDER BY ID
════════════════════════════════════════ */
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).lean();
        if (!order) return res.status(404).json({ message: "Order not found" });
        const isOwner = order.user?.toString() === req.user._id.toString();
        const isAdmin = ["admin", "owner"].includes(req.user.role);
        if (!isOwner && !isAdmin) return res.status(403).json({ message: "Access denied" });
        res.json(order);
    } catch { res.status(500).json({ message: "Error fetching order" }); }
};

/* ════════════════════════════════════════
   UPDATE ORDER STATUS (ADMIN)
   🚀 AUTO SHIPROCKET WHEN PACKED
════════════════════════════════════════ */
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const valid = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
        if (!valid.includes(status)) return res.status(400).json({ message: "Invalid status" });

        const update = { orderStatus: status };
        const tMap = { CONFIRMED: "confirmedAt", PACKED: "packedAt", SHIPPED: "shippedAt", DELIVERED: "deliveredAt", CANCELLED: "cancelledAt" };
        if (tMap[status]) update[`statusTimeline.${tMap[status]}`] = new Date();

        if (status === "DELIVERED") {
            update["payment.status"] = "PAID";
            update["payment.paidAt"] = new Date();
            update["return.deadlineAt"] = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        if (status === "SHIPPED") update["shipping.status"] = "SHIPPED";

        const order = await Order.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (status === "CANCELLED") {
            for (const item of order.items) {
                try {
                    const p = await Product.findById(item.productId);
                    if (p) { p.stock += item.qty; p.inStock = p.stock > 0; await p.save(); }
                } catch (e) { console.warn("Stock restore:", e.message); }
            }
        }

        res.json(order);

        /* ── AUTO SHIPROCKET ON PACKED ── */
        if (status === "PACKED" && !order.shipping?.shipmentId) {
            ; (async () => {
                try {
                    const wt = await calcTotalWeight(order.items);
                    const srResult = await createShiprocketOrder({ order, totalWeight: wt });

                    if (srResult.success) {
                        await Order.findByIdAndUpdate(order._id, {
                            $set: {
                                "shipping.shipmentId": srResult.shipment_id,
                                "shipping.awbCode": srResult.awb_code,
                                "shipping.courierName": srResult.courier_name,
                                "shipping.trackingUrl": srResult.tracking_url,
                                "shipping.labelUrl": srResult.label_url,
                                "shipping.status": "PICKUP_SCHEDULED",
                                "shipping.mock": srResult.mock || false,
                                "shipping.autoCreated": true,
                                "shipping.createdAt": new Date(),
                            },
                        });
                        console.log(`[Shiprocket AUTO] PACKED → AWB: ${srResult.awb_code} ${srResult.mock ? "(MOCK)" : ""}`);

                        // Email with tracking
                        if (order.email && !order.email.includes("@rvgifts.com")) {
                            const tMail = getOrderStatusEmailTemplate({
                                customerName: order.customerName, orderId: order._id,
                                status: "SHIPPED",
                                trackingUrl: srResult.tracking_url,
                                courier: srResult.courier_name,
                                awb: srResult.awb_code,
                            });
                            sendEmail({ to: order.email, subject: tMail.subject, html: tMail.html, label: "User/Shipped" });
                        }
                    } else {
                        console.error("[Shiprocket AUTO] Failed:", srResult.error);
                    }
                } catch (err) { console.error("[Shiprocket AUTO]", err.message); }
            })();
        }

        /* ── USER EMAIL ── */
        if (order.email && !order.email.includes("@rvgifts.com")) {
            const sMail = getOrderStatusEmailTemplate({ customerName: order.customerName, orderId: order._id, status });
            if (status === "DELIVERED") {
                try {
                    const pdf = await generateInvoiceBuffer(order.toObject ? order.toObject() : order);
                    sendEmail({
                        to: order.email, subject: sMail.subject, html: sMail.html,
                        label: `User/${status}`,
                        attachments: [{ filename: `RVGifts_Invoice_${order.invoiceNumber || order._id.toString().slice(-8).toUpperCase()}.pdf`, content: pdf }],
                    });
                } catch { sendEmail({ to: order.email, subject: sMail.subject, html: sMail.html, label: `User/${status}` }); }
            } else if (status !== "PACKED") {
                sendEmail({ to: order.email, subject: sMail.subject, html: sMail.html, label: `User/${status}` });
            }
        }

    } catch (err) {
        console.error("UPDATE STATUS:", err);
        res.status(500).json({ message: "Failed to update status" });
    }
};

/* ════════════════════════════════════════
   GET ALL ORDERS (ADMIN)
════════════════════════════════════════ */
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).lean();
        res.json(orders);
    } catch { res.status(500).json({ message: "Failed to fetch orders" }); }
};

/* ════════════════════════════════════════
   REQUEST RETURN (USER)
   Only DELIVERED + within 7 days
════════════════════════════════════════ */
export const requestReturn = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "Not authorized" });
        if (order.orderStatus !== "DELIVERED")
            return res.status(400).json({ message: "Return only allowed for delivered orders" });

        const deliveredAt = order.statusTimeline?.deliveredAt;
        const deadline = order.return?.deadlineAt || (deliveredAt ? new Date(new Date(deliveredAt).getTime() + 7 * 24 * 60 * 60 * 1000) : null);
        if (deadline && new Date() > new Date(deadline)) {
            const days = deliveredAt ? Math.floor((Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24)) : "?";
            return res.status(400).json({ message: `Return window closed. Orders can only be returned within 7 days of delivery (delivered ${days} days ago)` });
        }

        if (order.return?.status && order.return.status !== "NONE")
            return res.status(400).json({ message: `Return already ${order.return.status.toLowerCase()}` });

        const { reason, images = [] } = req.body;
        if (!reason?.trim()) return res.status(400).json({ message: "Return reason is required" });

        order.return = {
            requested: true, requestedAt: new Date(),
            reason: reason.trim().slice(0, 1000),
            images: Array.isArray(images) ? images.slice(0, 5) : [],
            status: "REQUESTED",
            deadlineAt: deadline,
        };
        order.orderStatus = "RETURN_REQUESTED";
        const existing = order.statusTimeline?.toObject ? order.statusTimeline.toObject() : { ...order.statusTimeline };
        order.statusTimeline = { ...existing, returnRequestedAt: new Date() };
        order.markModified("statusTimeline");
        order.markModified("return");
        await order.save();

        res.json({ success: true, message: "Return request submitted. Admin will review within 24-48 hours.", return: order.return });

        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `🔄 Return Request #${order._id.toString().slice(-6).toUpperCase()} — ${order.customerName}`,
            html: `<h2>Return Request</h2><p><b>Order:</b> #${order._id.toString().slice(-8).toUpperCase()}</p><p><b>Customer:</b> ${order.customerName} | ${order.phone}</p><p><b>Reason:</b> ${reason}</p><p><b>Amount:</b> ₹${order.totalAmount.toLocaleString("en-IN")}</p>`,
            label: "Admin/ReturnRequest",
        });

    } catch (err) {
        console.error("REQUEST RETURN:", err);
        res.status(500).json({ message: "Failed to submit return request" });
    }
};

/* ════════════════════════════════════════
   PROCESS RETURN (ADMIN) — approve/reject
════════════════════════════════════════ */
export const processReturn = async (req, res) => {
    try {
        const { action, adminNote, refundAmount } = req.body;
        if (!["approve", "reject"].includes(action))
            return res.status(400).json({ message: "Action must be approve or reject" });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.return?.status !== "REQUESTED")
            return res.status(400).json({ message: "No pending return request" });

        if (action === "reject") {
            order.return.status = "REJECTED";
            order.return.adminNote = adminNote?.trim() || "";
            order.return.processedAt = new Date();
            order.return.processedBy = req.user._id;
            order.orderStatus = "DELIVERED";
            order.markModified("return");
            await order.save();
            if (order.email && !order.email.includes("@rvgifts.com"))
                sendEmail({ to: order.email, subject: `Return Request Rejected — Order #${order._id.toString().slice(-6).toUpperCase()}`, html: `<p>Hi ${order.customerName}, your return request has been rejected. ${adminNote || "Please contact support."}</p>`, label: "User/ReturnRejected" });
            return res.json({ success: true, message: "Return rejected" });
        }

        // APPROVE
        order.return.status = "APPROVED";
        order.return.adminNote = adminNote?.trim() || "";
        order.return.refundAmount = Number(refundAmount) || order.totalAmount;
        order.return.processedAt = new Date();
        order.return.processedBy = req.user._id;
        order.orderStatus = "RETURN_APPROVED";
        order.markModified("return");
        await order.save();

        res.json({ success: true, message: "Return approved", order });

        if (order.email && !order.email.includes("@rvgifts.com"))
            sendEmail({ to: order.email, subject: `Return Approved — Order #${order._id.toString().slice(-6).toUpperCase()}`, html: `<p>Hi ${order.customerName}, your return is approved! Refund of ₹${order.return.refundAmount.toLocaleString("en-IN")} will be processed soon.</p>`, label: "User/ReturnApproved" });

    } catch (err) {
        console.error("PROCESS RETURN:", err);
        res.status(500).json({ message: "Failed to process return" });
    }
};

/* ════════════════════════════════════════
   REQUEST REFUND (USER)
════════════════════════════════════════ */
export const requestRefund = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "Not authorized" });
        if (order.payment.method !== "RAZORPAY")
            return res.status(400).json({ message: "Refund only for online payments" });
        if (order.payment.status !== "PAID")
            return res.status(400).json({ message: "Payment not completed" });
        if (order.refund?.status && order.refund.status !== "NONE")
            return res.status(400).json({ message: `Refund already ${order.refund.status.toLowerCase()}` });

        order.refund = {
            requested: true, requestedAt: new Date(),
            reason: (req.body.reason || "Requested by customer").trim().slice(0, 500),
            status: "REQUESTED", amount: order.totalAmount,
        };
        order.paymentLogs.push({ event: "REFUND_REQUESTED", amount: order.totalAmount, method: "RAZORPAY", ip: getClientIp(req), at: new Date() });
        order.markModified("refund");
        await order.save();

        res.json({ success: true, message: "Refund request submitted", refund: order.refund });

        sendEmail({ to: process.env.ADMIN_EMAIL, subject: `💰 Refund Request #${order._id.toString().slice(-6).toUpperCase()} — ₹${order.totalAmount}`, html: `<p>Refund requested by ${order.customerName} for order #${order._id.toString().slice(-8).toUpperCase()}. Amount: ₹${order.totalAmount}</p>`, label: "Admin/RefundRequest" });

    } catch (err) {
        console.error("REQUEST REFUND:", err);
        res.status(500).json({ message: "Failed to submit refund request" });
    }
};

/* ════════════════════════════════════════
   PROCESS REFUND (ADMIN)
   Calls Razorpay API
════════════════════════════════════════ */
export const processRefund = async (req, res) => {
    try {
        const { action, adminNote } = req.body;
        if (!["approve", "reject"].includes(action))
            return res.status(400).json({ message: "Action must be approve or reject" });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (!order.refund?.requested || order.refund?.status !== "REQUESTED")
            return res.status(400).json({ message: "No pending refund request" });

        if (action === "reject") {
            order.refund.status = "REJECTED";
            order.refund.adminNote = adminNote?.trim() || "";
            order.paymentLogs.push({ event: "REFUND_REJECTED", amount: order.refund.amount, method: "RAZORPAY", ip: getClientIp(req), at: new Date() });
            order.markModified("refund");
            await order.save();
            if (order.email && !order.email.includes("@rvgifts.com"))
                sendEmail({ to: order.email, subject: `Refund Rejected — Order #${order._id.toString().slice(-6).toUpperCase()}`, html: `<p>Hi ${order.customerName}, your refund request has been rejected. ${adminNote || "Please contact support."}</p>`, label: "User/RefundRejected" });
            return res.json({ success: true, message: "Refund rejected" });
        }

        // APPROVE → Razorpay API call
        const refundAmount = order.refund.amount || order.totalAmount;
        const paymentId = order.payment.razorpayPaymentId;
        if (!paymentId) return res.status(400).json({ message: "No Razorpay payment ID" });

        order.refund.status = "PROCESSING";
        order.paymentLogs.push({ event: "REFUND_PROCESSING", amount: refundAmount, method: "RAZORPAY", paymentId, ip: getClientIp(req), at: new Date() });
        order.markModified("refund");
        await order.save();

        try {
            const rzRef = await razorpay.payments.refund(paymentId, {
                amount: refundAmount * 100,
                notes: { orderId: order._id.toString(), reason: order.refund.reason || "Admin refund" },
            });

            order.refund.status = "PROCESSED";
            order.refund.razorpayRefundId = rzRef.id;
            order.refund.processedAt = new Date();
            order.refund.processedBy = req.user._id;
            order.refund.adminNote = adminNote?.trim() || "";
            order.payment.status = "REFUNDED";
            order.paymentLogs.push({ event: "REFUND_PROCESSED", amount: refundAmount, method: "RAZORPAY", paymentId, meta: { refundId: rzRef.id }, at: new Date() });
            order.markModified("refund"); order.markModified("payment");
            await order.save();

            res.json({ success: true, message: `₹${refundAmount} refunded`, refundId: rzRef.id });

            if (order.email && !order.email.includes("@rvgifts.com"))
                sendEmail({ to: order.email, subject: `✅ Refund Processed — Order #${order._id.toString().slice(-6).toUpperCase()}`, html: `<p>Hi ${order.customerName}, refund of ₹${refundAmount.toLocaleString("en-IN")} processed. Reflects in 5-7 business days. Refund ID: ${rzRef.id}</p>`, label: "User/RefundProcessed" });

        } catch (rzErr) {
            order.refund.status = "FAILED";
            order.paymentLogs.push({ event: "REFUND_FAILED", amount: refundAmount, method: "RAZORPAY", paymentId, meta: { error: rzErr.message }, at: new Date() });
            order.markModified("refund");
            await order.save();
            return res.status(500).json({ message: "Razorpay refund failed: " + (rzErr.error?.description || rzErr.message) });
        }

    } catch (err) {
        console.error("PROCESS REFUND:", err);
        res.status(500).json({ message: "Refund processing failed" });
    }
};

/* ════════════════════════════════════════
   RETRY REFUND (ADMIN)
════════════════════════════════════════ */
export const retryRefund = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.refund?.status !== "FAILED")
            return res.status(400).json({ message: "Only failed refunds can be retried" });

        order.refund.status = "REQUESTED";
        order.markModified("refund");
        await order.save();

        req.body.action = "approve";
        return processRefund(req, res);
    } catch { res.status(500).json({ message: "Retry failed" }); }
};

/* ════════════════════════════════════════
   ADMIN QUEUES
════════════════════════════════════════ */
export const getFlaggedOrders = async (req, res) => {
    try {
        const orders = await Order.find({ "payment.flagged": true }).sort({ createdAt: -1 }).lean();
        res.json(orders);
    } catch { res.status(500).json({ message: "Failed" }); }
};

export const getReturnQueue = async (req, res) => {
    try {
        const orders = await Order.find({ "return.status": "REQUESTED" }).sort({ "return.requestedAt": -1 }).lean();
        res.json(orders);
    } catch { res.status(500).json({ message: "Failed" }); }
};

export const getRefundQueue = async (req, res) => {
    try {
        const orders = await Order.find({ "refund.status": "REQUESTED" }).sort({ "refund.requestedAt": -1 }).lean();
        res.json(orders);
    } catch { res.status(500).json({ message: "Failed" }); }
};


/* ════════════════════════════════════════
   SHIPROCKET WEBHOOK (AUTO TRACKING)
════════════════════════════════════════ */

export const shiprocketWebhook = async (req, res) => {
    try {
        const data = req.body;

        const awb = data.awb;
        const status = data.current_status;

        const order = await Order.findOne({
            "shipping.awbCode": awb
        });

        if (!order) return res.sendStatus(200);

        order.shipping.status = status;

        if (status === "DELIVERED") {
            order.orderStatus = "DELIVERED";
            order.statusTimeline.deliveredAt = new Date();
        }

        await order.save();

        res.sendStatus(200);
    } catch (err) {
        console.error("Shiprocket webhook error", err);
        res.sendStatus(500);
    }
};