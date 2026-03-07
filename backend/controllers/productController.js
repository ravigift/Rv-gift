import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";
import { normalizeCategory } from "../utils/normalizeCategory.js";

/* =========================
   ✅ SAFE REGEX HELPER
========================= */
const escapeRegex = (str) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* =========================
   CREATE PRODUCT (ADMIN)
========================= */
export const createProduct = async (req, res) => {
    try {
        const {
            name, description, price, category,
            isCustomizable, tags, sizes, highlights,
        } = req.body;

        if (!name?.trim() || !price || !category)
            return res.status(400).json({ message: "Name, price and category are required" });

        if (Number(price) <= 0)
            return res.status(400).json({ message: "Price must be greater than 0" });

        if (!req.files || req.files.length === 0)
            return res.status(400).json({ message: "At least one image is required" });

        const images = req.files.map((file) => ({
            url: file.path,
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

        const product = await Product.create({
            name: name.trim(),
            description: description?.trim() || "",
            price: Number(price),
            category: normalizeCategory(category),
            images,
            isCustomizable: isCustomizable === true || isCustomizable === "true",
            tags: tags ? tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
            sizes: parsedSizes,
            highlights: parsedHighlights,
        });

        res.status(201).json(product);
    } catch (error) {
        console.error("CREATE PRODUCT ERROR:", error);
        res.status(500).json({ message: error.message || "Failed to create product" });
    }
};

/* =========================
   GET ALL PRODUCTS
========================= */
export const getAllProducts = async (req, res) => {
    try {
        const { search, category } = req.query;
        const query = {};

        if (category) {
            query.category = normalizeCategory(category);
        }

        if (search && search.trim().length >= 2) {
            // ✅ Escape regex — ReDoS attack prevent
            const safeSearch = escapeRegex(search.trim());
            query.$or = [
                { name: { $regex: safeSearch, $options: "i" } },
                { description: { $regex: safeSearch, $options: "i" } },
                { tags: { $regex: safeSearch, $options: "i" } },
            ];
        }

        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .lean(); // ✅ faster read
        res.json(products);
    } catch (error) {
        console.error("GET PRODUCTS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

/* =========================
   GET SINGLE PRODUCT
========================= */
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

/* =========================
   UPDATE PRODUCT (ADMIN)
========================= */
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

        if (req.files && req.files.length > 0) {
            // ✅ Delete old images from Cloudinary
            for (const img of product.images) {
                try {
                    await cloudinary.uploader.destroy(img.public_id);
                } catch (e) {
                    console.warn("Cloudinary delete failed:", e.message);
                }
            }
            updateData.images = req.files.map((file) => ({
                url: file.path,
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

/* =========================
   GET RELATED PRODUCTS
========================= */
export const getRelatedProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).lean();
        if (!product)
            return res.status(404).json({ message: "Product not found" });

        const related = await Product.find({
            _id: { $ne: product._id },
            category: product.category,
        })
            .limit(10)
            .lean();

        res.json(related);
    } catch (err) {
        console.error("GET RELATED ERROR:", err);
        res.status(500).json({ message: "Failed to fetch related products" });
    }
};

/* =========================
   DELETE PRODUCT (ADMIN)
========================= */
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Product not found" });

        // ✅ Delete images from Cloudinary
        for (const img of product.images) {
            try {
                await cloudinary.uploader.destroy(img.public_id);
            } catch (e) {
                console.warn("Cloudinary delete failed:", e.message);
            }
        }

        await product.deleteOne();
        res.json({ message: "Product removed successfully" });
    } catch (error) {
        console.error("DELETE PRODUCT ERROR:", error);
        res.status(500).json({ message: "Failed to delete product" });
    }
};