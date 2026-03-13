/**
 * shiprocketController.js
 * Handles: rate check, order tracking, label generation
 */

import {
    calculateShippingRate,
    trackShipment,
    generateLabel,
    isMockMode,
} from "../utils/Shiprocketservice.js";
import Order from "../models/Order.js";

/* ════════════════════════════════════════
   POST /api/shipping/rate
   Body: { deliveryPincode, weight?, cod? }
   Used in Checkout — live shipping rate from Shiprocket
════════════════════════════════════════ */
export const getShippingRate = async (req, res) => {
    try {
        const { deliveryPincode, weight = 500, cod = false } = req.body;

        if (!deliveryPincode || !/^\d{6}$/.test(deliveryPincode))
            return res.status(400).json({ message: "Valid 6-digit delivery pincode required" });

        const result = await calculateShippingRate({
            deliveryPincode,
            weight: Number(weight),
            cod: Boolean(cod),
        });

        res.json({
            ...result,
            mock: isMockMode(),
        });
    } catch (err) {
        console.error("Shipping rate error:", err.message);
        // Fallback rate so checkout doesn't break
        res.status(500).json({ message: "Could not calculate shipping rate", rate: 49 });
    }
};

/* ════════════════════════════════════════
   GET /api/shipping/track/:orderId
   Track by DB Order ID (looks up AWB internally)
   Auth: user can track own orders; admin can track any
════════════════════════════════════════ */
export const trackOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).lean();
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Auth check
        const isOwner = order.user?.toString() === req.user._id.toString();
        const isAdmin = ["admin", "owner"].includes(req.user.role);
        if (!isOwner && !isAdmin) return res.status(403).json({ message: "Access denied" });

        const awb = order.shipping?.awbCode;
        if (!awb) {
            return res.json({
                success: false,
                status: "NOT_SHIPPED",
                label: "Not Shipped Yet",
                detail: "Your shipment has not been dispatched yet. Check back soon.",
                tracking_url: null,
                order_status: order.orderStatus,
            });
        }

        const result = await trackShipment({ awbCode: awb });
        res.json({
            ...result,
            order_status: order.orderStatus,
            courier: order.shipping?.courierName || result.courier,
            awb,
            tracking_url: order.shipping?.trackingUrl || result.tracking_url || null,
        });
    } catch (err) {
        console.error("Track order error:", err.message);
        res.status(500).json({ message: "Could not fetch tracking info" });
    }
};

/* ════════════════════════════════════════
   GET /api/shipping/label/:orderId
   Admin only — generate / re-fetch shipping label PDF
════════════════════════════════════════ */
export const getShippingLabel = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).lean();
        if (!order) return res.status(404).json({ message: "Order not found" });

        const shipmentId = order.shipping?.shipmentId;
        if (!shipmentId)
            return res.status(400).json({
                message: "Shipment not created yet for this order",
                orderStatus: order.orderStatus,
            });

        const result = await generateLabel({ shipmentId });
        res.json(result);
    } catch (err) {
        console.error("Label error:", err.message);
        res.status(500).json({ message: "Could not generate shipping label" });
    }
};
