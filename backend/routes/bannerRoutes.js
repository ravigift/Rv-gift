import express from "express";
import {
    getPublicBanners,
    getAllBannersAdmin,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
} from "../controllers/bannerController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

/* ── PUBLIC ── */
router.get("/", getPublicBanners);

/* ── ADMIN (Protected) ── */
router.get("/admin", protect, adminOnly, getAllBannersAdmin);
router.post("/", protect, adminOnly, upload.single("image"), createBanner);
router.put("/:id", protect, adminOnly, upload.single("image"), updateBanner);
router.patch("/:id/toggle", protect, adminOnly, toggleBannerStatus);
router.delete("/:id", protect, adminOnly, deleteBanner);

export default router;
