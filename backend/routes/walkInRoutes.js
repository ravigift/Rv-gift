import express from "express";
import {
    createWalkInOrder,
    getAllWalkInOrders,
    getWalkInOrderById,
    deleteWalkInOrder,
    downloadWalkInBill,
    emailWalkInBill,
    getWalkInStats,
    sendDeletePinResetOtp,
    resetDeletePin
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


router.post("/delete-pin/send-otp", sendDeletePinResetOtp);
router.post("/delete-pin/reset", resetDeletePin);

export default router;