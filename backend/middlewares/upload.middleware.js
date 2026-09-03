import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"];

const imageFileFilter = (req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
};

/* ─────────────────────────────────────────────
   PRODUCT IMAGES (admin) — keep master quality,
   accept modern phone formats (HEIC/HEIF too).
───────────────────────────────────────────── */
const productStorage = new CloudinaryStorage({
    cloudinary,
    params: async () => ({
        folder: "rv-gift-products",
        allowed_formats: IMAGE_FORMATS,
        resource_type: "image",
        // Cloudinary ingests HEIC/HEIF and serves web formats on delivery.
        transformation: [{ quality: "auto", fetch_format: "auto" }],
    }),
});

const upload = multer({
    storage: productStorage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per product image
    fileFilter: imageFileFilter,
});

/* ─────────────────────────────────────────────
   CUSTOMER PERSONALISATION PHOTOS
   Normalised to JPG, capped to 2000px so a raw
   phone photo (incl. HEIC) never fails or bloats.
───────────────────────────────────────────── */
const customStorage = new CloudinaryStorage({
    cloudinary,
    params: async () => ({
        folder: "rv-gift-custom",
        resource_type: "image",
        format: "jpg", // convert HEIC / any input → jpg on upload
        transformation: [{ width: 2000, height: 2000, crop: "limit", quality: "auto:good" }],
    }),
});

export const customUpload = multer({
    storage: customStorage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB — phone photos can be big
    fileFilter: imageFileFilter,
});

export default upload;
