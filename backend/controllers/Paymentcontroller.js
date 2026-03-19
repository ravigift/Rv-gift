/**
 * PaymentController.js
 * File: controllers/PaymentController.js
 *
 * FIX: Removed Shiprocket from verifyPaymentAndCreateOrder
 *      Shiprocket runs on PACKED in orderController.js — single source of truth
 */

import Razorpay from "razorpay";
import crypto from "crypto";
import Order, { generateInvoiceNumber } from "../models/Order.js";
import Product from "../models/Product.js";
import { sendEmail } from "../utils/emailService.js";
import { getOrderStatusEmailTemplate } from "../utils/orderStatusEmail.js";
import { adminOrderEmailHTML } from "../utils/adminOrderEmail.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ════════════════════════════════════════
   1. CREATE RAZORPAY ORDER
════════════════════════════════════════ */
export const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, currency = "INR", receipt } = req.body;
        if (!amount || Number(amount) <= 0)
            return res.status(400).json({ message: "Invalid amount" });

        const order = await razorpay.orders.create({
            amount: Math.round(Number(amount) * 100),
            currency,
            receipt: receipt || `rcpt_${Date.now()}`,
        });

        res.json({ id: order.id, amount: order.amount, currency: order.currency });
    } catch (err) {
        console.error("RAZORPAY CREATE ORDER:", err);
        res.status(500).json({ message: "Failed to create Razorpay order" });
    }
};

/* ════════════════════════════════════════
   2. VERIFY PAYMENT + CREATE ORDER
════════════════════════════════════════ */
export const verifyPaymentAndCreateOrder = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderData,
        } = req.body;

        // Signature verify
        const expectedSig = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSig !== razorpay_signature)
            return res.status(400).json({ message: "Payment verification failed", success: false });

        const {
            items, customerName, phone, email, address,
            totalAmount, platformFee, deliveryCharge,
            latitude, longitude,
        } = orderData;

        // ✅ Input validation — orderController jaise
        if (!items?.length || items.length > 20)
            return res.status(400).json({ message: "Invalid cart", success: false });
        if (!customerName?.trim() || !phone?.trim() || !address?.trim())
            return res.status(400).json({ message: "Customer details missing", success: false });
        if (!/^[6-9]\d{9}$/.test(phone?.trim()))
            return res.status(400).json({ message: "Invalid phone number", success: false });
        if (!totalAmount || Number(totalAmount) <= 0)
            return res.status(400).json({ message: "Invalid total amount", success: false });

        // Stock deduction
        for (const item of items) {
            const product = await Product.findById(item.productId || item._id);
            if (!product) continue;
            const qty = Math.min(Math.max(1, Number(item.qty || item.quantity || 1)), 100);
            if (!product.inStock || product.stock < qty)
                return res.status(400).json({ message: `"${product.name}" is out of stock`, success: false });
            product.stock -= qty;
            product.inStock = product.stock > 0;
            await product.save();
        }

        const formattedItems = items.map(i => ({
            productId: i.productId || i._id,
            name: String(i.name || "Product").slice(0, 200),
            price: Math.max(0, Number(i.price || 0)),
            mrp: i.mrp ? Number(i.mrp) : null,
            qty: Math.min(Math.max(1, Number(i.qty || i.quantity || 1)), 100),
            image: typeof i.image === "string" ? i.image : i.images?.[0]?.url || "",
            customization: {
                text: String(i.customization?.text || "").trim().slice(0, 500),
                imageUrl: String(i.customization?.imageUrl || "").trim().slice(0, 1000),
                note: String(i.customization?.note || "").trim().slice(0, 1000),
            },
        }));

        const invoiceNumber = await generateInvoiceNumber();

        const order = await Order.create({
            user: req.user._id,
            invoiceNumber,
            items: formattedItems,
            customerName,
            phone,
            email: email?.trim().toLowerCase() || "",
            address,
            totalAmount,
            platformFee: platformFee || 9,
            deliveryCharge: deliveryCharge || 0,
            latitude,
            longitude,
            orderStatus: "PLACED",
            statusTimeline: { placedAt: new Date() },
            payment: {
                method: "RAZORPAY",
                status: "PAID",
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                paidAt: new Date(),
            },
        });

        res.json({
            success: true,
            orderId: order._id,
            invoiceNumber,
            paymentId: razorpay_payment_id,
        });

        // User email — PLACED confirmation
        if (email && !email.includes("@rvgifts.com")) {
            const mail = getOrderStatusEmailTemplate({ customerName, orderId: order._id, status: "PLACED" });
            sendEmail({ to: email, subject: mail.subject, html: mail.html, label: "User/NewOrder" });
        }

        // Admin email
        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `✅ New Paid Order #${order._id.toString().slice(-6).toUpperCase()} — ₹${totalAmount}`,
            html: adminOrderEmailHTML({ order }),
            label: "Admin/NewOrder",
        });

    } catch (err) {
        console.error("VERIFY PAYMENT ERROR:", err);
        res.status(500).json({ message: "Order creation failed" });
    }
};

/* ════════════════════════════════════════
   3. RAZORPAY WEBHOOK
════════════════════════════════════════ */
export const razorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const receivedSig = req.headers["x-razorpay-signature"];
        const expectedSig = crypto
            .createHmac("sha256", secret)
            .update(JSON.stringify(req.body))
            .digest("hex");

        if (expectedSig !== receivedSig)
            return res.status(400).json({ message: "Invalid signature" });

        const event = req.body.event;
        const paymentEntity = req.body.payload?.payment?.entity;
        const refundEntity = req.body.payload?.refund?.entity;

        switch (event) {
            case "payment.failed":
                await Order.findOneAndUpdate(
                    { "payment.razorpayOrderId": paymentEntity?.order_id },
                    { $set: { "payment.status": "FAILED" } }
                );
                break;

            case "refund.processed":
                await Order.findOneAndUpdate(
                    { "payment.razorpayPaymentId": refundEntity?.payment_id },
                    {
                        $set: {
                            "refund.status": "PROCESSED",
                            "refund.processedAt": new Date(),
                            "refund.razorpayRefundId": refundEntity?.id,
                        },
                    }
                );
                break;

            default:
                console.log("Unhandled webhook:", event);
        }

        res.json({ received: true });
    } catch (err) {
        console.error("WEBHOOK ERROR:", err);
        res.status(500).json({ message: "Webhook failed" });
    }
};

/* ════════════════════════════════════════
   4. REQUEST REFUND (USER)
════════════════════════════════════════ */
export const requestRefund = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });
        if (order.payment.method !== "RAZORPAY") return res.status(400).json({ message: "Refund only for online payment" });
        if (order.payment.status !== "PAID") return res.status(400).json({ message: "Payment not completed" });
        if (order.refund?.status && order.refund.status !== "NONE")
            return res.status(400).json({ message: `Refund already ${order.refund.status.toLowerCase()}` });

        order.refund = {
            status: "REQUESTED",
            amount: order.totalAmount,
            reason: (req.body.reason || "Customer request").trim().slice(0, 500),
            requested: true,
            requestedAt: new Date(),
        };
        await order.save();

        res.json({ success: true, message: "Refund request submitted", refund: order.refund });

        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `💰 Refund Request #${order._id.toString().slice(-6).toUpperCase()} — ₹${order.totalAmount}`,
            html: `<p>Refund requested by <b>${order.customerName}</b> for order #${order._id.toString().slice(-8).toUpperCase()}.<br>Amount: ₹${order.totalAmount}<br>Reason: ${order.refund.reason}</p>`,
            label: "Admin/RefundRequest",
        });

    } catch (err) {
        console.error("REQUEST REFUND:", err);
        res.status(500).json({ message: "Refund request failed" });
    }
};

/* ════════════════════════════════════════
   5. PROCESS REFUND (ADMIN)
   action: "APPROVE" | "REJECT"
════════════════════════════════════════ */
export const processRefund = async (req, res) => {
    try {
        const { action, rejectionReason = "" } = req.body;
        if (!["APPROVE", "REJECT"].includes(action))
            return res.status(400).json({ message: "Invalid action" });

        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (!order.refund?.requested)
            return res.status(400).json({ message: "No refund request found" });
        if (order.refund.status !== "REQUESTED")
            return res.status(400).json({ message: `Refund already ${order.refund.status}` });

        if (action === "REJECT") {
            order.refund.status = "REJECTED";
            order.refund.adminNote = rejectionReason;
            order.refund.processedAt = new Date();
            order.refund.processedBy = req.user._id;
            await order.save();
            if (order.email && !order.email.includes("@rvgifts.com"))
                sendEmail({
                    to: order.email,
                    subject: `Refund Rejected — Order #${order._id.toString().slice(-6).toUpperCase()}`,
                    html: `<p>Hi ${order.customerName}, your refund request has been rejected. ${rejectionReason || "Please contact support."}</p>`,
                    label: "User/RefundRejected",
                });
            return res.json({ success: true, message: "Refund rejected" });
        }

        // APPROVE → Razorpay API
        if (!order.payment.razorpayPaymentId)
            return res.status(400).json({ message: "No Razorpay payment ID found on order" });

        const refundAmount = Math.round(Number(order.refund.amount || order.totalAmount) * 100);

        let rpRefund;
        try {
            rpRefund = await razorpay.payments.refund(order.payment.razorpayPaymentId, {
                amount: refundAmount,
                notes: { orderId: order._id.toString(), reason: order.refund.reason },
            });
        } catch (rpErr) {
            console.error("[Razorpay] Refund failed:", rpErr.message);
            return res.status(502).json({ message: "Razorpay refund failed: " + (rpErr.error?.description || rpErr.message) });
        }

        order.refund.status = "PROCESSED";
        order.refund.razorpayRefundId = rpRefund.id;
        order.refund.processedAt = new Date();
        order.refund.processedBy = req.user._id;
        order.payment.status = "REFUNDED";
        await order.save();

        res.json({ success: true, message: "Refund processed successfully", refundId: rpRefund.id });

        if (order.email && !order.email.includes("@rvgifts.com"))
            sendEmail({
                to: order.email,
                subject: `✅ Refund Processed — Order #${order._id.toString().slice(-6).toUpperCase()}`,
                html: `<p>Hi ${order.customerName},</p><p>Your refund of <b>₹${Number(order.refund.amount || order.totalAmount).toLocaleString("en-IN")}</b> has been processed. It will reflect in 5-7 business days.</p><p>Refund ID: ${rpRefund.id}</p>`,
                label: "User/RefundProcessed",
            });

    } catch (err) {
        console.error("PROCESS REFUND:", err);
        res.status(500).json({ message: "Failed to process refund" });
    }
};

/* ════════════════════════════════════════
   6. GET REFUND STATUS
════════════════════════════════════════ */
export const getRefundStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .select("refund user payment orderStatus")
            .lean();
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "Not authorized" });

        res.json({
            refund: order.refund || { status: "NONE" },
            orderStatus: order.orderStatus,
            paymentStatus: order.payment?.status,
            paymentMethod: order.payment?.method,
        });
    } catch (err) {
        console.error("GET REFUND STATUS:", err);
        res.status(500).json({ message: "Failed to fetch refund status" });
    }
};