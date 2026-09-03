import express from "express";
import { getSection, upsertSection } from "../controllers/siteSectionController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:key", getSection);                       // public
router.put("/:key", protect, adminOnly, upsertSection); // admin

export default router;
