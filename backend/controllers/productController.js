import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";
import { normalizeCategory } from "../utils/normalizeCategory.js";

/* =========================
   CREATE PRODUCT (ADMIN)
   POST /api/products
========================= */
export const createProduct = async (req, res) => {
    try {
        const {
            name, description, price, category,
            isCustomizable, tags, sizes, highlights,
        } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ message: "Name, price and category are required" });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "At least one image is required" });
        }

        const images = req.files.map((file) => ({
            url: file.path,
            public_id: file.filename,
        }));

        // ✅ Parse sizes — sent as JSON string from frontend
        let parsedSizes = [];
        if (sizes) {
            try { parsedSizes = JSON.parse(sizes); } catch { parsedSizes = []; }
        }

        // ✅ Parse highlights — sent as JSON string from frontend
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
            tags: tags ? tags.split(",").map((t) => t.trim().toLowerCase()) : [],
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
   GET /api/products
========================= */
export const getAllProducts = async (req, res) => {
    try {
        const { search, category } = req.query;
        const query = {};

        if (category) {
            query.category = normalizeCategory(category);
        }

        if (search && search.trim().length >= 3) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } },
            ];
        }

        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error("GET PRODUCTS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

/* =========================
   GET SINGLE PRODUCT
   GET /api/products/:id
========================= */
export const getSingleProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (error) {
        console.error("GET PRODUCT ERROR:", error);
        res.status(500).json({ message: "Failed to fetch product" });
    }
};

/* =========================
   UPDATE PRODUCT (ADMIN)
   PUT /api/products/:id
========================= */
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const updateData = { ...req.body };

        if (updateData.category) {
            updateData.category = normalizeCategory(updateData.category);
        }

        if (updateData.tags) {
            updateData.tags = updateData.tags.split(",").map((t) => t.trim().toLowerCase());
        }

        // ✅ Parse sizes
        if (updateData.sizes) {
            try { updateData.sizes = JSON.parse(updateData.sizes); } catch { updateData.sizes = []; }
        }

        // ✅ Parse highlights
        if (updateData.highlights) {
            try { updateData.highlights = JSON.parse(updateData.highlights); } catch { updateData.highlights = {}; }
        }

        if (req.files && req.files.length > 0) {
            for (const img of product.images) {
                await cloudinary.uploader.destroy(img.public_id);
            }
            updateData.images = req.files.map((file) => ({
                url: file.path,
                public_id: file.filename,
            }));
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json(updatedProduct);
    } catch (error) {
        console.error("UPDATE PRODUCT ERROR:", error);
        res.status(500).json({ message: "Failed to update product" });
    }
};

/* =========================
   GET RELATED PRODUCTS
   GET /api/products/:id/related
========================= */
export const getRelatedProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const related = await Product.find({
            _id: { $ne: product._id },
            category: product.category,
        }).limit(10);

        res.json(related);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch related products" });
    }
};

/* =========================
   DELETE PRODUCT (ADMIN)
   DELETE /api/products/:id
========================= */
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        for (const img of product.images) {
            await cloudinary.uploader.destroy(img.public_id);
        }

        await product.deleteOne();
        res.json({ message: "Product removed successfully" });
    } catch (error) {
        console.error("DELETE PRODUCT ERROR:", error);
        res.status(500).json({ message: "Failed to delete product" });
    }
};