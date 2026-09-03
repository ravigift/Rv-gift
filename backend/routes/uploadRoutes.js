import express from "express";
import multer from "multer";
import { customUpload } from "../middlewares/upload.middleware.js";

const router = express.Router();

/* Run the upload and convert multer/cloudinary failures into clean 400s
   (otherwise they surface as a generic 500 from the global handler). */
const handleUpload = (req, res, next) => {
    customUpload.single("image")(req, res, (err) => {
        if (!err) return next();
        if (err instanceof multer.MulterError) {
            const msg = {
                LIMIT_FILE_SIZE: "Image is too large — please use a file under 15 MB.",
                LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
            }[err.code] || "Upload failed. Please try again.";
            return res.status(400).json({ message: msg });
        }
        return res.status(400).json({ message: err.message || "Upload failed. Please try again." });
    });
};

/* =============================================
   POST /api/uploads/custom-image
   Customer personalisation photo — no login required
   (this happens before checkout). Rate-limited in server.js.
============================================= */
router.post("/custom-image", handleUpload, (req, res) => {
    if (!req.file?.path) {
        return res.status(400).json({ message: "No image received. Please choose a photo." });
    }
    res.json({
        success: true,
        url: req.file.path,
        public_id: req.file.filename,
    });
});

export default router;
