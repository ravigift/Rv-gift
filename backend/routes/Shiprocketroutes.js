import express from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import {
    getShippingRate,
    trackOrder,
    getShippingLabel,
} from "../controllers/shiprocketController.js"; // BUG FIX: was "Shiprocketcontroller.js" (wrong case)

const router = express.Router();

router.post("/rate", getShippingRate);               // No auth — used in checkout
router.get("/track/:orderId", protect, trackOrder);
router.get("/label/:orderId", protect, adminOnly, getShippingLabel);

export default router;