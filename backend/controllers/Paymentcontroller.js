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
import { sendEmail } from "../utils/emailService.js";
import { getOrderStatusEmailTemplate } from "../utils/orderStatusEmail.js";
import { adminOrderEmailHTML } from "../utils/adminOrderEmail.js";
import { buildVerifiedOrder, commitStock, restoreStock } from "../utils/orderPricing.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ════════════════════════════════════════
   1. CREATE RAZORPAY ORDER
════════════════════════════════════════ */
export const createRazorpayOrder = async (req, res) => {
    try {
        const { items, receipt } = req.body;

        // ✅ Amount is derived from the DB cart, NOT from the client.
        const priced = await buildVerifiedOrder(items, "RAZORPAY");
        if (priced.error)
            return res.status(400).json({ message: priced.error });

        const order = await razorpay.orders.create({
            amount: Math.round(priced.totalAmount * 100),
            currency: "INR",
            receipt: (typeof receipt === "string" ? receipt : `rcpt_${Date.now()}`).slice(0, 40),
            notes: { userId: req.user._id.toString() },
        });

        res.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            // echo the authoritative breakdown so the UI can display the real numbers
            breakdown: {
                itemsTotal: priced.itemsTotal,
                deliveryCharge: priced.deliveryCharge,
                platformFee: priced.platformFee,
                totalAmount: priced.totalAmount,
            },
        });
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

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
            return res.status(400).json({ success: false, message: "Missing payment fields" });

        // 1. Signature check — proves this order_id + payment_id pair is genuine
        const expectedSig = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const sigOk =
            expectedSig.length === String(razorpay_signature).length &&
            crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(String(razorpay_signature)));
        if (!sigOk)
            return res.status(400).json({ success: false, message: "Payment verification failed" });

        // 2. Idempotency — this payment already produced an order? return it, don't double-charge/double-ship
        const existing = await Order.findOne({ "payment.razorpayPaymentId": razorpay_payment_id }).lean();
        if (existing) {
            return res.json({
                success: true,
                orderId: existing._id,
                invoiceNumber: existing.invoiceNumber,
                paymentId: razorpay_payment_id,
                duplicate: true,
            });
        }

        const { customerName, phone, email, address } = orderData || {};
        if (!customerName?.trim() || !phone?.trim() || !address?.trim())
            return res.status(400).json({ success: false, message: "Customer details missing" });
        if (!/^[6-9]\d{9}$/.test(phone.trim()))
            return res.status(400).json({ success: false, message: "Invalid phone number" });

        // 3. Recompute the order from the DB — client prices/total are ignored
        const priced = await buildVerifiedOrder(orderData?.items, "RAZORPAY");
        if (priced.error)
            return res.status(400).json({ success: false, message: priced.error });

        const { items: formattedItems, totalAmount, platformFee, deliveryCharge } = priced;

        // 4. Cross-check against Razorpay: the amount actually captured MUST equal
        //    our server-computed total. This is what blocks "create a ₹1 order, pay ₹1".
        let rpOrder, rpPayment;
        try {
            [rpOrder, rpPayment] = await Promise.all([
                razorpay.orders.fetch(razorpay_order_id),
                razorpay.payments.fetch(razorpay_payment_id),
            ]);
        } catch (e) {
            console.error("[Razorpay] fetch failed:", e.message);
            return res.status(502).json({ success: false, message: "Could not confirm payment with Razorpay" });
        }

        const expectedPaise = Math.round(totalAmount * 100);
        if (Number(rpOrder.amount) !== expectedPaise)
            return res.status(400).json({ success: false, message: "Payment amount mismatch — order rejected" });
        if (rpPayment.order_id !== razorpay_order_id)
            return res.status(400).json({ success: false, message: "Payment does not belong to this order" });
        if (!["captured", "authorized"].includes(rpPayment.status))
            return res.status(400).json({ success: false, message: `Payment not completed (${rpPayment.status})` });
        if (Number(rpPayment.amount) !== expectedPaise)
            return res.status(400).json({ success: false, message: "Captured amount mismatch — order rejected" });

        // 5. Atomic stock deduction
        const stock = await commitStock(formattedItems);
        if (stock.error)
            return res.status(409).json({ success: false, message: stock.error });

        let order;
        try {
            const invoiceNumber = await generateInvoiceNumber();
            order = await Order.create({
                user: req.user._id,
                invoiceNumber,
                items: formattedItems,
                customerName: customerName.trim().slice(0, 100),
                phone: phone.trim(),
                email: email?.trim().toLowerCase().slice(0, 200) || "",
                address: address.trim().slice(0, 500),
                totalAmount,
                platformFee,
                deliveryCharge,
                orderStatus: "PLACED",
                statusTimeline: { placedAt: new Date() },
                payment: {
                    method: "RAZORPAY",
                    status: "PAID",
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    paidAt: new Date(),
                    ip: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "",
                },
                paymentLogs: [{
                    event: "PAYMENT_VERIFIED",
                    amount: totalAmount,
                    method: "RAZORPAY",
                    paymentId: razorpay_payment_id,
                    at: new Date(),
                }],
            });
        } catch (e) {
            // unique index on razorpayPaymentId → a concurrent request already created it
            if (e.code === 11000) {
                const dup = await Order.findOne({ "payment.razorpayPaymentId": razorpay_payment_id }).lean();
                if (dup)
                    return res.json({ success: true, orderId: dup._id, invoiceNumber: dup.invoiceNumber, paymentId: razorpay_payment_id, duplicate: true });
            }
            await restoreStock(formattedItems);
            throw e;
        }

        res.json({
            success: true,
            orderId: order._id,
            invoiceNumber: order.invoiceNumber,
            paymentId: razorpay_payment_id,
        });

        if (email && !email.includes("@rvgifts.com")) {
            const mail = getOrderStatusEmailTemplate({ customerName, orderId: order._id, status: "PLACED" });
            sendEmail({ to: email, subject: mail.subject, html: mail.html, label: "User/NewOrder" });
        }

        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `✅ New Paid Order #${order._id.toString().slice(-6).toUpperCase()} — ₹${totalAmount}`,
            html: adminOrderEmailHTML({ order }),
            label: "Admin/NewOrder",
        });

    } catch (err) {
        console.error("VERIFY PAYMENT ERROR:", err);
        res.status(500).json({ success: false, message: "Order creation failed" });
    }
};

/* ════════════════════════════════════════
   3. RAZORPAY WEBHOOK
════════════════════════════════════════ */
export const razorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET not configured");
            return res.status(500).json({ message: "Webhook not configured" });
        }

        const receivedSig = req.headers["x-razorpay-signature"] || "";

        // req.body is a raw Buffer here (express.raw on this route) — HMAC the
        // exact bytes Razorpay signed, not a re-serialised object.
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
        const expectedSig = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

        const sigOk =
            expectedSig.length === receivedSig.length &&
            crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(receivedSig));
        if (!sigOk)
            return res.status(400).json({ message: "Invalid signature" });

        const payload = JSON.parse(rawBody.toString("utf8"));
        const event = payload.event;
        const paymentEntity = payload.payload?.payment?.entity;
        const refundEntity = payload.payload?.refund?.entity;

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