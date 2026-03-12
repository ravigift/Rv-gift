import express from "express";
import {
    createWalkInOrder,
    getAllWalkInOrders,
    getWalkInOrderById,
    deleteWalkInOrder,
    downloadWalkInBill,
    emailWalkInBill,
    getWalkInStats,
} from "../controllers/walkInController.js";

import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/stats", getWalkInStats);
router.get("/", getAllWalkInOrders);
router.post("/", createWalkInOrder);
router.get("/:id", getWalkInOrderById);
router.delete("/:id", deleteWalkInOrder);
router.get("/:id/bill", downloadWalkInBill);
router.post("/:id/email", emailWalkInBill);

export default router;