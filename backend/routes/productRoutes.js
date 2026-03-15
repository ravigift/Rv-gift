import express from "express";
import {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    getRelatedProducts,
} from "../controllers/productController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.middleware.js";
import Product from "../models/Product.js";

const router = express.Router();

/* ─────────────────────────────────────────────
   DYNAMIC SITEMAP — /api/products/sitemap
   Google is crawl karega aur product URLs index karega
───────────────────────────────────────────── */
router.get("/sitemap", async (req, res) => {
    try {
        const products = await Product.find({ inStock: true })
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
router.get("/:id/related", getRelatedProducts); // ✅ specific pehle
router.get("/:id", getSingleProduct);

/* ─────────────────────────────────────────────
   ADMIN ROUTES
───────────────────────────────────────────── */
router.post("/", protect, adminOnly, upload.array("images", 5), createProduct);
router.put("/:id", protect, adminOnly, upload.array("images", 5), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;