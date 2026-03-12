import Razorpay from "razorpay";
import crypto from "crypto";
import Order, { generateInvoiceNumber } from "../models/Order.js";
import Product from "../models/Product.js";
import { sendEmail } from "../utils/emailService.js";
import { getOrderStatusEmailTemplate } from "../utils/orderStatusEmail.js";
import { adminOrderEmailHTML } from "../utils/adminOrderEmail.js";
import { createShiprocketOrder } from "../utils/Shiprocketservice.js";

/* ════════════════════════════════════════
   RAZORPAY INSTANCE
════════════════════════════════════════ */
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ════════════════════════════════════════
   HELPER — Calculate total weight
════════════════════════════════════════ */
const calcTotalWeight = async (items) => {
    let total = 0;

    for (const item of items) {
        try {
            const p = await Product.findById(item.productId)
                .select("weight")
                .lean();
            total += (p?.weight || 500) * item.qty;
        } catch {
            total += 500 * item.qty;
        }
    }

    return Math.max(100, total);
};

/* ════════════════════════════════════════
   HELPER — Send refund email
════════════════════════════════════════ */
const sendRefundEmail = (order, refundId) => {
    if (!order.email || order.email.includes("@rvgifts.com")) return;

    sendEmail({
        to: order.email,
        subject: `Refund Initiated — Order #${order._id
            .toString()
            .slice(-8)
            .toUpperCase()}`,
        html: `
      <h2>RV Gift and Printing</h2>
      <p>Hi ${order.customerName},</p>
      <p>Your refund has been initiated.</p>

      <p><b>Amount:</b> ₹${Number(
            order.refund?.amount || order.totalAmount
        ).toLocaleString("en-IN")}</p>

      <p><b>Refund ID:</b> ${refundId}</p>

      <p>It will reflect within 5-7 business days.</p>
    `,
        label: "User/Refund",
    });
};

/* ════════════════════════════════════════
   1️⃣ CREATE RAZORPAY ORDER
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

        res.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (err) {
        console.error("RAZORPAY CREATE ORDER:", err);
        res.status(500).json({ message: "Failed to create Razorpay order" });
    }
};

/* ════════════════════════════════════════
   2️⃣ VERIFY PAYMENT + CREATE ORDER
════════════════════════════════════════ */
export const verifyPaymentAndCreateOrder = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderData,
        } = req.body;

        /* Signature verify */
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;

        const expectedSig = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSig !== razorpay_signature)
            return res.status(400).json({
                message: "Payment verification failed",
                success: false,
            });

        const {
            items,
            customerName,
            phone,
            email,
            address,
            totalAmount,
            platformFee,
            deliveryCharge,
            latitude,
            longitude,
        } = orderData;

        /* Stock deduction */
        for (const item of items) {
            const productId = item.productId || item._id;
            const qty = Number(item.qty || item.quantity || 1);

            const product = await Product.findById(productId);

            if (!product) continue;

            if (!product.inStock || product.stock < qty)
                return res.status(400).json({
                    message: `"${product.name}" is out of stock`,
                    success: false,
                });

            product.stock -= qty;
            product.inStock = product.stock > 0;
            await product.save();
        }

        const formattedItems = items.map((i) => ({
            productId: i.productId || i._id,
            name: i.name,
            price: Number(i.price),
            qty: Number(i.qty || 1),
            image: i.image || "",
            customization: {
                text: i.customization?.text || "",
                imageUrl: i.customization?.imageUrl || "",
                note: i.customization?.note || "",
            },
        }));

        const invoiceNumber = await generateInvoiceNumber();

        const order = await Order.create({
            user: req.user._id,
            invoiceNumber,
            items: formattedItems,
            customerName,
            phone,
            email,
            address,
            totalAmount,
            platformFee,
            deliveryCharge,
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

        /* Background Shiprocket */
        (async () => {
            try {
                const totalWeight = await calcTotalWeight(formattedItems);

                const sr = await createShiprocketOrder({
                    order,
                    totalWeight,
                });

                if (sr.success) {
                    await Order.findByIdAndUpdate(order._id, {
                        $set: {
                            "shipping.shipmentId": sr.shipment_id,
                            "shipping.awbCode": sr.awb_code,
                            "shipping.courierName": sr.courier_name,
                            "shipping.trackingUrl": sr.tracking_url,
                            "shipping.labelUrl": sr.label_url,
                            "shipping.status": "PICKUP_SCHEDULED",
                        },
                    });
                }
            } catch (e) {
                console.error("Shiprocket error:", e.message);
            }
        })();

        /* Emails */
        if (email) {
            const mail = getOrderStatusEmailTemplate({
                customerName,
                orderId: order._id,
                status: "PLACED",
            });

            sendEmail({
                to: email,
                subject: mail.subject,
                html: mail.html,
            });
        }

        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `New Order ₹${totalAmount}`,
            html: adminOrderEmailHTML({ order }),
        });
    } catch (err) {
        console.error("VERIFY PAYMENT ERROR:", err);
        res.status(500).json({ message: "Order creation failed" });
    }
};

/* ════════════════════════════════════════
   3️⃣ RAZORPAY WEBHOOK
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

            /* 🔥 REFUND SYNC */
            case "refund.processed":
                console.log("Refund processed:", refundEntity?.id);

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
   4️⃣ REQUEST REFUND (USER)
════════════════════════════════════════ */
export const requestRefund = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);

        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "Not authorized" });

        if (order.payment.method !== "RAZORPAY")
            return res.status(400).json({ message: "Refund only for online payment" });

        order.refund = {
            status: "REQUESTED",
            amount: order.totalAmount,
            reason: req.body.reason || "Customer request",
            requestedAt: new Date(),
        };

        await order.save();

        res.json({
            success: true,
            message: "Refund request submitted",
            refund: order.refund,
        });
    } catch (err) {
        console.error("REQUEST REFUND:", err);
        res.status(500).json({ message: "Refund request failed" });
    }
};

/* ════════════════════════════════════════
   5️⃣ PROCESS REFUND (ADMIN)
════════════════════════════════════════ */
export const processRefund = async (req, res) => {
    try {
        const { action } = req.body;

        const order = await Order.findById(req.params.orderId);

        if (!order) return res.status(404).json({ message: "Order not found" });

        if (action === "REJECT") {
            order.refund.status = "REJECTED";
            order.refund.rejectedAt = new Date();
            await order.save();

            return res.json({ success: true, message: "Refund rejected" });
        }

        const refundAmountPaise = Math.round(
            (order.refund.amount || order.totalAmount) * 100
        );

        const refund = await razorpay.payments.refund(
            order.payment.razorpayPaymentId,
            { amount: refundAmountPaise }
        );

        order.refund.status = "PROCESSED";
        order.refund.razorpayRefundId = refund.id;
        order.refund.processedAt = new Date();

        await order.save();

        sendRefundEmail(order, refund.id);

        res.json({
            success: true,
            message: "Refund processed",
            refundId: refund.id,
        });
    } catch (err) {
        console.error("PROCESS REFUND:", err);
        res.status(500).json({ message: err.message });
    }
};

/* ════════════════════════════════════════
   6️⃣ GET REFUND STATUS
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