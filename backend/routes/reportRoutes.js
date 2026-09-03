import express from "express";
import { getOverview, exportOrders } from "../controllers/reportController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/overview", protect, adminOnly, getOverview);
router.get("/export", protect, adminOnly, exportOrders);

export default router;
