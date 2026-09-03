import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import {
    createProduct,
    getAllProducts,
    getProductsAdmin,
    getProductCategories,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    getRelatedProducts,
    subscribeStockNotification,
} from "../controllers/productController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.middleware.js";
import Product from "../models/Product.js";

const router = express.Router();

// "Notify me when back in stock" — public, so keep it tightly rate-limited
const notifyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again later." },
});

/* Run the image upload and turn multer failures into clean 400s
   (otherwise they hit the global handler as a generic 500). */
const uploadImages = (req, res, next) => {
    upload.array("images", 5)(req, res, (err) => {
        if (!err) return next();
        if (err instanceof multer.MulterError) {
            const msg = {
                LIMIT_FILE_SIZE: "Each image must be under 5MB",
                LIMIT_UNEXPECTED_FILE: "You can upload at most 5 images",
                LIMIT_FILE_COUNT: "You can upload at most 5 images",
            }[err.code] || "Image upload failed";
            return res.status(400).json({ message: msg });
        }
        // fileFilter rejection ("Only image files are allowed") or Cloudinary error
        return res.status(400).json({ message: err.message || "Image upload failed" });
    });
};

/* ─────────────────────────────────────────────
   DYNAMIC SITEMAP — /api/products/sitemap
   Google is crawl karega aur product URLs index karega
───────────────────────────────────────────── */
router.get("/sitemap", async (req, res) => {
    try {
        const products = await Product.find({ inStock: true, isArchived: { $ne: true } })
            .select("slug updatedAt")
            .lean();

        const productUrls = products
            .filter((p) => p.slug) // sirf slug wale products
            .map((p) => `
  <url>
    <loc>https://www.rvgift.com/products/${p.slug}</loc>
    <lastmod>${new Date(p.updatedAt).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
            .join("");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <url>
    <loc>https://www.rvgift.com/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>https://www.rvgift.com/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>https://www.rvgift.com/privacy-policy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <url>
    <loc>https://www.rvgift.com/terms-conditions</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <url>
    <loc>https://www.rvgift.com/refund-policy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
${productUrls}
</urlset>`;

        res.header("Content-Type", "application/xml");
        res.send(xml);
    } catch (err) {
        console.error("SITEMAP ERROR:", err);
        res.status(500).send("Sitemap generation failed");
    }
});

/* ─────────────────────────────────────────────
   PUBLIC ROUTES
───────────────────────────────────────────── */
router.get("/", getAllProducts);
router.get("/categories", getProductCategories);       // storefront category counts
router.get("/admin", protect, adminOnly, getProductsAdmin); // full list incl. drafts/archived
router.get("/:id/related", getRelatedProducts); // ✅ specific pehle
router.post("/:id/notify", notifyLimiter, subscribeStockNotification); // back-in-stock subscribe
router.get("/:id", getSingleProduct);

/* ─────────────────────────────────────────────
   ADMIN ROUTES
───────────────────────────────────────────── */
router.post("/", protect, adminOnly, uploadImages, createProduct);
router.put("/:id", protect, adminOnly, uploadImages, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;