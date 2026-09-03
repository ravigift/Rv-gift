/**
 * Order.js — Complete Production Schema
 * ✅ Payment logs (every event tracked)
 * ✅ Fraud detection fields (ip, flagged, flagReasons)
 * ✅ Full refund lifecycle (NONE→REQUESTED→PROCESSING→PROCESSED/FAILED/REJECTED)
 * ✅ Return system (7-day window, images, admin notes)
 * ✅ Shipping (Shiprocket AWB, courier, tracking)
 * ✅ Status timeline
 * ✅ selectedSize per item
 */

import mongoose from "mongoose";
import Counter from "./Counter.js";

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        invoiceNumber: {
            type: String,
            unique: true,
            sparse: true,
        },

        /* ── ORDER ITEMS ── */
        items: [
            {
                productId: mongoose.Schema.Types.ObjectId,
                name: String,
                price: Number,
                mrp: { type: Number, default: null },
                qty: Number,
                image: String,
                selectedSize: { type: String, default: "" },
                hsnCode: { type: String, default: "91059990" },
                gstPercent: { type: Number, default: 0 },
                customization: {
                    text: { type: String, default: "" },
                    imageUrl: { type: String, default: "" },
                    note: { type: String, default: "" },
                },
            },
        ],

        /* ── CUSTOMER ── */
        customerName: String,
        phone: String,
        address: String,
        email: String,
        totalAmount: Number,
        platformFee: { type: Number, default: 0 },
        deliveryCharge: { type: Number, default: 0 },
        latitude: Number,
        longitude: Number,
        cancellationReason: { type: String, default: "" },

        /* ── PAYMENT ── */
        payment: {
            method: {
                type: String,
                enum: ["RAZORPAY", "COD"],
                default: "COD",
            },
            status: {
                type: String,
                // PAID → COD on delivery or Razorpay captured
                // REFUNDED → after successful Razorpay refund
                enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
                default: "PENDING",
            },
            razorpayOrderId: { type: String },
            razorpayPaymentId: { type: String },
            paidAt: { type: Date },

            // Fraud detection fields
            ip: { type: String, default: "" },
            userAgent: { type: String, default: "" },
            flagged: { type: Boolean, default: false },
            flagReasons: [{ type: String }],
        },

        /* ── PAYMENT EVENT LOG ── */
        // Append-only log: ORDER_PLACED, PAYMENT_VERIFIED, REFUND_REQUESTED,
        // REFUND_PROCESSING, REFUND_PROCESSED, REFUND_FAILED, REFUND_REJECTED
        paymentLogs: [
            {
                event: { type: String },
                amount: { type: Number },
                method: { type: String },
                paymentId: { type: String },
                ip: { type: String },
                userAgent: { type: String },
                meta: { type: mongoose.Schema.Types.Mixed },
                at: { type: Date, default: Date.now },
            },
        ],

        /* ── REFUND ── */
        refund: {
            status: {
                type: String,
                // Flow:
                //   NONE → REQUESTED (user requests)
                //   REQUESTED → PROCESSING (admin approves, Razorpay call in progress)
                //   PROCESSING → PROCESSED (Razorpay success)
                //   PROCESSING → FAILED    (Razorpay error — admin can retry)
                //   REQUESTED → REJECTED   (admin rejects)
                enum: ["NONE", "REQUESTED", "PROCESSING", "PROCESSED", "FAILED", "REJECTED"],
                default: "NONE",
            },
            requested: { type: Boolean, default: false },   // convenience flag for older queries
            reason: { type: String, default: "" },
            amount: { type: Number, default: 0 },
            requestedAt: { type: Date },
            processedAt: { type: Date },
            rejectedAt: { type: Date },
            rejectionReason: { type: String, default: "" },
            adminNote: { type: String, default: "" },
            razorpayRefundId: { type: String, default: "" },
            processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },

        /* ── RETURN (7-day window) ── */
        return: {
            status: {
                type: String,
                enum: ["NONE", "REQUESTED", "APPROVED", "REJECTED", "PICKED_UP", "REFUNDED"],
                default: "NONE",
            },
            requested: { type: Boolean, default: false },
            reason: { type: String, default: "" },
            images: [{ type: String }],
            requestedAt: { type: Date },
            deadlineAt: { type: Date },
            processedAt: { type: Date },
            processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            refundAmount: { type: Number, default: 0 },
            adminNote: { type: String, default: "" },
        },

        /* ── ORDER STATUS ── */
        orderStatus: {
            type: String,
            enum: [
                "PLACED",
                "CONFIRMED",
                "PACKED",
                "SHIPPED",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED",
                "RETURN_REQUESTED",
                "RETURN_APPROVED",
            ],
            default: "PLACED",
        },

        /* ── SHIPPING (Shiprocket) ── */
        shipping: {
            shipmentId: { type: String, default: "" },
            awbCode: { type: String, default: "" },
            courierName: { type: String, default: "" },
            trackingUrl: { type: String, default: "" },
            labelUrl: { type: String, default: "" },
            status: { type: String, default: "" },
            mock: { type: Boolean, default: false },
            autoCreated: { type: Boolean, default: false },
            createdAt: { type: Date },
        },

        /* ── TIMELINE ── */
        statusTimeline: {
            placedAt: { type: Date, default: Date.now },
            confirmedAt: Date,
            packedAt: Date,
            shippedAt: Date,
            outForDeliveryAt: Date,
            deliveredAt: Date,
            cancelledAt: Date,
            returnRequestedAt: Date,
        },
    },
    { timestamps: true }
);

/* ─────────────────────────────────────────────
   INDEXES for fast admin queries
───────────────────────────────────────────── */
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ "refund.status": 1 });
orderSchema.index({ "return.status": 1 });
orderSchema.index({ "payment.flagged": 1 });
// unique + sparse → a Razorpay payment id can back at most ONE order (idempotency guard)
orderSchema.index({ "payment.razorpayPaymentId": 1 }, { unique: true, sparse: true });

/* ─────────────────────────────────────────────
   INVOICE NUMBER GENERATOR
   Format: INV-2026-03-00001
   Auto-increments per month via an atomic counter —
   safe under concurrent order creation (no countDocuments race).
───────────────────────────────────────────── */
export const generateInvoiceNumber = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const key = `invoice-${year}-${month}`;

    const counter = await Counter.findByIdAndUpdate(
        key,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    return `INV-${year}-${month}-${String(counter.seq).padStart(5, "0")}`;
};

export default mongoose.model("Order", orderSchema);