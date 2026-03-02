import express from "express";
import upload from "../middlewares/upload.middleware.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* =============================================
   POST /api/uploads/custom-image
   Customer apna photo upload kare
============================================= */
router.post(
    "/custom-image",
    protect,
    upload.single("image"),
    (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No image uploaded" });
            }
            res.json({
                success: true,
                url: req.file.path,        // Cloudinary URL
                public_id: req.file.filename,
            });
        } catch (error) {
            console.error("UPLOAD ERROR:", error);
            res.status(500).json({ message: "Upload failed" });
        }
    }
);

export default router;