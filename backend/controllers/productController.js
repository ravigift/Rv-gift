import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";
import { normalizeCategory } from "../utils/normalizeCategory.js";

/* ─────────────────────────────────────────────
   SAFE REGEX HELPER
───────────────────────────────────────────── */
const escapeRegex = (str) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ─────────────────────────────────────────────
   CLOUDINARY HELPERS
───────────────────────────────────────────── */
const optimizeUrl = (url, width = 800) => {
    if (!url || !url.includes("cloudinary.com")) return url ?? "";
    return url.replace("/upload/", `/upload/q_auto,f_auto,w_${width}/`);
};

const safeDestroy = async (publicId) => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (e) {
        console.warn("[Cloudinary] Delete failed:", publicId, e.message);
    }
};

/* ─────────────────────────────────────────────
   PARSE MRP — safely extract numeric MRP
   Returns null if invalid / less than price
───────────────────────────────────────────── */
const parseMrp = (mrpRaw, price) => {
    if (mrpRaw === undefined || mrpRaw === null || mrpRaw === "") return null;
    const n = Number(mrpRaw);
    if (isNaN(n) || n <= 0) return null;
    // MRP must be >= selling price to make sense
    if (price && n < Number(price)) return null;
    return n;
};

/* ─────────────────────────────────────────────
   CREATE PRODUCT (ADMIN)
───────────────────────────────────────────── */
export const createProduct = async (req, res) => {
    try {
        const {
            name, description, price, mrp, category,
            isCustomizable, tags, sizes, highlights, stock,
        } = req.body;

        if (!name?.trim() || !price || !category)
            return res.status(400).json({ message: "Name, price and category are required" });

        if (Number(price) <= 0)
            return res.status(400).json({ message: "Price must be greater than 0" });

        if (!req.files || req.files.length === 0)
            return res.status(400).json({ message: "At least one image is required" });

        const images = req.files.map((file) => ({
            url: optimizeUrl(file.path, 800),
            public_id: file.filename,
        }));

        let parsedSizes = [];
        if (sizes) {
            try { parsedSizes = JSON.parse(sizes); } catch { parsedSizes = []; }
        }

        let parsedHighlights = {};
        if (highlights) {
            try { parsedHighlights = JSON.parse(highlights); } catch { parsedHighlights = {}; }
        }

        const stockQty = Math.max(0, Number(stock) || 0);
        // ✅ Parse MRP
        const mrpValue = parseMrp(mrp, price);

        const product = await Product.create({
            name: name.trim(),
            description: description?.trim() || "",
            price: Number(price),
            mrp: mrpValue,                          // ✅ stored
            category: normalizeCategory(category),
            images,
            isCustomizable: isCustomizable === true || isCustomizable === "true",
            tags: tags ? tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
            sizes: parsedSizes,
            highlights: parsedHighlights,
            stock: stockQty,
            inStock: stockQty > 0,
        });

        res.status(201).json(product);
    } catch (error) {
        console.error("CREATE PRODUCT ERROR:", error);
        res.status(500).json({ message: error.message || "Failed to create product" });
    }
};

/* ─────────────────────────────────────────────
   GET ALL PRODUCTS
───────────────────────────────────────────── */
export const getAllProducts = async (req, res) => {
    try {
        const { search, category } = req.query;
        const query = {};

        if (category) {
            query.category = normalizeCategory(category);
        }

        if (search && search.trim().length >= 2) {
            const safeSearch = escapeRegex(search.trim());
            query.$or = [
                { name: { $regex: safeSearch, $options: "i" } },
                { description: { $regex: safeSearch, $options: "i" } },
                { tags: { $regex: safeSearch, $options: "i" } },
            ];
        }

        // ✅ Select only fields needed for listing — faster response
        const products = await Product.find(query)
            .select("name description price mrp category images tags rating numReviews isCustomizable stock inStock createdAt")
            .sort({ createdAt: -1 })
            .lean();

        res.json(products);
    } catch (error) {
        console.error("GET PRODUCTS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

/* ─────────────────────────────────────────────
   GET SINGLE PRODUCT
───────────────────────────────────────────── */
export const getSingleProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).lean();
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        console.error("GET PRODUCT ERROR:", error);
        res.status(500).json({ message: "Failed to fetch product" });
    }
};

/* ─────────────────────────────────────────────
   UPDATE PRODUCT (ADMIN)
───────────────────────────────────────────── */
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Product not found" });

        const updateData = { ...req.body };

        if (updateData.category)
            updateData.category = normalizeCategory(updateData.category);

        if (updateData.price)
            updateData.price = Number(updateData.price);

        // ✅ Parse MRP on update
        if (updateData.mrp !== undefined) {
            updateData.mrp = parseMrp(updateData.mrp, updateData.price ?? product.price);
        }

        if (updateData.tags)
            updateData.tags = updateData.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

        if (updateData.sizes) {
            try { updateData.sizes = JSON.parse(updateData.sizes); } catch { updateData.sizes = []; }
        }

        if (updateData.highlights) {
            try { updateData.highlights = JSON.parse(updateData.highlights); } catch { updateData.highlights = {}; }
        }

        if (updateData.isCustomizable !== undefined)
            updateData.isCustomizable = updateData.isCustomizable === true || updateData.isCustomizable === "true";

        if (updateData.stock !== undefined) {
            updateData.stock = Math.max(0, Number(updateData.stock) || 0);
            updateData.inStock = updateData.stock > 0;
        }

        if (req.files && req.files.length > 0) {
            for (const img of product.images) {
                await safeDestroy(img.public_id);
            }
            updateData.images = req.files.map((file) => ({
                url: optimizeUrl(file.path, 800),
                public_id: file.filename,
            }));
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json(updatedProduct);
    } catch (error) {
        console.error("UPDATE PRODUCT ERROR:", error);
        res.status(500).json({ message: "Failed to update product" });
    }
};

/* ─────────────────────────────────────────────
   GET RELATED PRODUCTS
───────────────────────────────────────────── */
export const getRelatedProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .select("category")
            .lean();
        if (!product)
            return res.status(404).json({ message: "Product not found" });

        const related = await Product.find({
            _id: { $ne: product._id },
            category: product.category,
            inStock: true,                  // ✅ only show in-stock related products
        })
            .select("name price mrp category images rating numReviews isCustomizable stock inStock")
            .limit(10)
            .lean();

        res.json(related);
    } catch (err) {
        console.error("GET RELATED ERROR:", err);
        res.status(500).json({ message: "Failed to fetch related products" });
    }
};

/* ─────────────────────────────────────────────
   DELETE PRODUCT (ADMIN)
───────────────────────────────────────────── */
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Product not found" });

        for (const img of product.images) {
            await safeDestroy(img.public_id);
        }

        await product.deleteOne();
        res.json({ message: "Product removed successfully" });
    } catch (error) {
        console.error("DELETE PRODUCT ERROR:", error);
        res.status(500).json({ message: "Failed to delete product" });
    }
};