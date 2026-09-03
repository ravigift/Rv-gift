import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import StockNotification from "../models/StockNotification.js";
import cloudinary from "../config/cloudinary.js";
import { normalizeCategory } from "../utils/normalizeCategory.js";
import { isValidCategory } from "../utils/categories.js";
import { sendEmail } from "../utils/emailService.js";

const escapeHtml = (v) =>
    String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ─────────────────────────────────────────────
   PRODUCT PAYLOAD VALIDATION / NORMALISATION
───────────────────────────────────────────── */
const MAX_PRICE = 1_000_000;
const MAX_STOCK = 1_000_000;
const MAX_TAGS = 20;
const MAX_HIGHLIGHTS = 20;
const MAX_SIZE_OPTIONS = 15;
const SIZE_OPT_MAXLEN = 24;

const toInt = (v) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? n : NaN;
};

/**
 * Validate + normalise a product payload (multipart/form-data → strings).
 * @param {object}  body
 * @param {boolean} partial  true for PUT — only provided fields are checked
 * @returns {{ fields?: object, error?: string }}
 */
const buildProductFields = (body, partial = false) => {
    const out = {};
    const has = (k) => body[k] !== undefined && body[k] !== null && String(body[k]) !== "";

    if (has("name")) {
        const name = String(body.name).trim();
        if (name.length < 2 || name.length > 300)
            return { error: "Product name must be 2–300 characters" };
        out.name = name;
    } else if (!partial) return { error: "Product name is required" };

    if (has("description")) {
        const d = String(body.description).trim();
        if (d.length > 5000) return { error: "Description cannot exceed 5000 characters" };
        out.description = d;
    } else if (!partial) out.description = "";

    if (has("price")) {
        const p = Number(body.price);
        if (!Number.isFinite(p) || p <= 0 || p > MAX_PRICE)
            return { error: `Enter a valid price (1 – ${MAX_PRICE.toLocaleString("en-IN")})` };
        out.price = Math.round(p * 100) / 100;
    } else if (!partial) return { error: "Price is required" };

    if (has("category")) {
        const cat = normalizeCategory(body.category);
        if (!isValidCategory(cat)) return { error: "Please choose a valid category from the list" };
        out.category = cat;
    } else if (!partial) return { error: "Category is required" };

    // mrp resolved against the effective price by the caller
    if (body.mrp !== undefined) {
        if (body.mrp === "" || body.mrp === null) {
            out.mrp = null;
        } else {
            const m = Number(body.mrp);
            if (!Number.isFinite(m) || m <= 0 || m > MAX_PRICE)
                return { error: "Enter a valid MRP" };
            out._mrpRaw = m;
        }
    }

    if (body.stock !== undefined && String(body.stock) !== "") {
        const s = toInt(body.stock);
        if (!Number.isFinite(s) || s < 0 || s > MAX_STOCK)
            return { error: "Stock must be a whole number (0 or more)" };
        out.stock = s;
        out.inStock = s > 0;
    } else if (!partial) { out.stock = 0; out.inStock = false; }

    if (body.isCustomizable !== undefined)
        out.isCustomizable = body.isCustomizable === true || body.isCustomizable === "true";

    if (body.tags !== undefined) {
        const uniq = [...new Set(
            String(body.tags || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
        )];
        if (uniq.length > MAX_TAGS) return { error: `Maximum ${MAX_TAGS} tags allowed` };
        if (uniq.some((t) => t.length > 30)) return { error: "Each tag must be under 30 characters" };
        out.tags = uniq;
    }

    // Variant options — fully custom per product (any label + any values)
    if (body.sizeLabel !== undefined) {
        out.sizeLabel = String(body.sizeLabel || "").trim().slice(0, 24) || "Size";
    }
    if (body.sizes !== undefined) {
        let arr = [];
        try { arr = JSON.parse(body.sizes); } catch { arr = []; }
        if (!Array.isArray(arr)) arr = [];
        const seen = new Set();
        const clean = [];
        for (const raw of arr) {
            const v = String(raw).replace(/\s+/g, " ").trim().slice(0, SIZE_OPT_MAXLEN);
            if (!v) continue;
            const k = v.toLowerCase();
            if (seen.has(k)) continue;      // case-insensitive dedupe
            seen.add(k);
            clean.push(v);
            if (clean.length >= MAX_SIZE_OPTIONS) break;
        }
        out.sizes = clean;
    }

    if (body.highlights !== undefined) {
        let obj = {};
        try { obj = JSON.parse(body.highlights); } catch { obj = {}; }
        if (!obj || typeof obj !== "object" || Array.isArray(obj)) obj = {};
        const map = {};
        for (const [k, v] of Object.entries(obj).slice(0, MAX_HIGHLIGHTS)) {
            const key = String(k).replace(/\s+/g, " ").trim().slice(0, 40);
            const val = String(v).replace(/\s+/g, " ").trim().slice(0, 200);
            if (key && val) map[key] = val;
        }
        out.highlights = map;
    }

    if (has("weight")) {
        const w = toInt(body.weight);
        if (!Number.isFinite(w) || w < 1 || w > 30000)
            return { error: "Weight must be between 1 g and 30000 g" };
        out.weight = w;
    }

    const dim = {};
    for (const f of ["length", "breadth", "height"]) {
        if (has(f)) {
            const n = Number(body[f]);
            if (!Number.isFinite(n) || n < 1 || n > 200)
                return { error: `${f[0].toUpperCase() + f.slice(1)} must be between 1 cm and 200 cm` };
            dim[f] = Math.round(n * 10) / 10;
        }
    }
    if (Object.keys(dim).length) out.dimensions = dim;

    if (body.sku !== undefined) {
        const sku = String(body.sku || "").trim().toUpperCase();
        if (sku) {
            if (sku.length > 40 || !/^[A-Z0-9][A-Z0-9._/-]*$/.test(sku))
                return { error: "SKU may use letters, numbers, - . _ / (max 40 chars)" };
            out.sku = sku;
        } else {
            out.sku = undefined; // allow clearing
        }
    }

    if (body.isPublished !== undefined)
        out.isPublished = !(body.isPublished === false || body.isPublished === "false");

    return { fields: out };
};

const cleanupUploaded = async (files = []) => {
    for (const f of files) await safeDestroy(f.filename);
};

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
   PARSE MRP
───────────────────────────────────────────── */
const parseMrp = (mrpRaw, price) => {
    if (mrpRaw === undefined || mrpRaw === null || mrpRaw === "") return null;
    const n = Number(mrpRaw);
    if (isNaN(n) || n <= 0) return null;
    if (price && n < Number(price)) return null;
    return n;
};

/* ─────────────────────────────────────────────
   HELPER — find by slug or id
───────────────────────────────────────────── */
const findProduct = (identifier) => {
    const isId = mongoose.Types.ObjectId.isValid(identifier);
    return Product.findOne(isId ? { _id: identifier } : { slug: identifier });
};

/* ─────────────────────────────────────────────
   CREATE PRODUCT (ADMIN)
───────────────────────────────────────────── */
export const createProduct = async (req, res) => {
    const files = req.files || [];
    try {
        if (files.length === 0)
            return res.status(400).json({ message: "At least one product image is required" });

        const { fields, error } = buildProductFields(req.body, false);
        if (error) {
            await cleanupUploaded(files);
            return res.status(400).json({ message: error });
        }

        // resolve MRP against the final price
        let mrp = null;
        if (fields._mrpRaw !== undefined) {
            if (fields._mrpRaw < fields.price) {
                await cleanupUploaded(files);
                return res.status(400).json({ message: "MRP cannot be less than the selling price" });
            }
            mrp = fields._mrpRaw;
        }
        delete fields._mrpRaw;

        const images = files.map((f) => ({
            url: f.path,          // raw Cloudinary URL — client resizes per context
            public_id: f.filename,
        }));

        const product = await Product.create({
            ...fields,
            mrp,
            images,
            createdBy: req.user?._id,
            updatedBy: req.user?._id,
        });

        return res.status(201).json(product);
    } catch (error) {
        await cleanupUploaded(files); // never leave orphan images in Cloudinary
        console.error("CREATE PRODUCT ERROR:", error);
        if (error.name === "ValidationError")
            return res.status(400).json({ message: Object.values(error.errors)[0]?.message || "Invalid product data" });
        if (error.code === 11000) {
            const dupKey = Object.keys(error.keyPattern || {})[0];
            return res.status(409).json({
                message: dupKey === "sku"
                    ? "That SKU is already used by another product"
                    : "A product with a similar name already exists",
            });
        }
        return res.status(500).json({ message: "Failed to create product" });
    }
};

/* ─────────────────────────────────────────────
   GET ALL PRODUCTS
───────────────────────────────────────────── */
const STOREFRONT_SELECT =
    "name description price mrp slug category images tags rating numReviews isCustomizable stock inStock createdAt";

export const getAllProducts = async (req, res) => {
    try {
        const { search, category } = req.query;
        // storefront: only live (published + not archived) products
        const query = { isArchived: { $ne: true }, isPublished: { $ne: false } };

        if (category) {
            query.category = normalizeCategory(category);
        }

        // Full-text search backed by the `name/description/tags` text index —
        // no more collection-scanning $regex. Ranked by relevance.
        const term = String(search || "").trim();
        const useText = term.length >= 2;
        if (useText) query.$text = { $search: term };

        // Response stays an array (clients depend on it). Hard-capped so the
        // endpoint can never dump an unbounded collection; opt-in pagination.
        const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 500));
        const page = Math.max(1, parseInt(req.query.page) || 1);

        let q = Product.find(query).select(STOREFRONT_SELECT);
        if (useText) {
            q = q.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
        } else {
            q = q.sort({ createdAt: -1 });
        }

        const [products, total] = await Promise.all([
            q.skip((page - 1) * limit).limit(limit).lean(),
            Product.countDocuments(query),
        ]);

        res.set("X-Total-Count", String(total));
        res.json(products);
    } catch (error) {
        console.error("GET PRODUCTS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

/* ─────────────────────────────────────────────
   GET PRODUCTS — ADMIN (drafts + archived included)
   GET /api/products/admin?status=live|draft|archived&page=&limit=&search=
───────────────────────────────────────────── */
export const getProductsAdmin = async (req, res) => {
    try {
        const query = {};
        const status = String(req.query.status || "").toLowerCase();
        if (status === "draft") query.isPublished = false;
        else if (status === "archived") query.isArchived = true;
        else if (status === "live") { query.isPublished = { $ne: false }; query.isArchived = { $ne: true }; }

        const term = String(req.query.search || "").trim();
        if (term.length >= 2) query.$text = { $search: term };

        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 100));
        const page = Math.max(1, parseInt(req.query.page) || 1);

        const [products, total] = await Promise.all([
            Product.find(query)
                .select(STOREFRONT_SELECT + " sku isPublished isArchived updatedAt")
                .sort(term.length >= 2 ? { score: { $meta: "textScore" } } : { createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Product.countDocuments(query),
        ]);

        res.set("X-Total-Count", String(total));
        res.json({ products, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error("GET ADMIN PRODUCTS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

/* ─────────────────────────────────────────────
   GET CATEGORY COUNTS — for the storefront "Shop by Category" section
   GET /api/products/categories  →  [{ value, count }]
───────────────────────────────────────────── */
export const getProductCategories = async (req, res) => {
    try {
        const rows = await Product.aggregate([
            { $match: { isArchived: { $ne: true }, isPublished: { $ne: false }, inStock: true } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        res.json(rows.map((r) => ({ value: r._id, count: r.count })).filter((r) => r.value));
    } catch (error) {
        console.error("GET CATEGORIES ERROR:", error);
        res.status(500).json({ message: "Failed to fetch categories" });
    }
};

/* ─────────────────────────────────────────────
   GET SINGLE PRODUCT — by slug or id
───────────────────────────────────────────── */
export const getSingleProduct = async (req, res) => {
    try {
        const product = await findProduct(req.params.id).lean();
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
    const files = req.files || [];
    try {
        const product = await findProduct(req.params.id);
        if (!product) {
            await cleanupUploaded(files);
            return res.status(404).json({ message: "Product not found" });
        }

        const { fields, error } = buildProductFields(req.body, true);
        if (error) {
            await cleanupUploaded(files);
            return res.status(400).json({ message: error });
        }

        // resolve MRP against the effective (new or existing) price
        if (fields._mrpRaw !== undefined) {
            const effPrice = fields.price ?? product.price;
            if (fields._mrpRaw < effPrice) {
                await cleanupUploaded(files);
                return res.status(400).json({ message: "MRP cannot be less than the selling price" });
            }
            fields.mrp = fields._mrpRaw;
        }
        delete fields._mrpRaw;

        // new images fully replace the old set; delete old ones only AFTER the
        // DB write succeeds so a failed update never destroys the live images
        let oldPublicIds = [];
        if (files.length > 0) {
            oldPublicIds = product.images.map((i) => i.public_id);
            fields.images = files.map((f) => ({ url: f.path, public_id: f.filename }));
        }

        fields.updatedBy = req.user?._id;

        // name change → regenerate slug via the pre-save hook
        if (fields.name && fields.name !== product.name) {
            product.name = fields.name;
            await product.save();
            delete fields.name;
        }

        const wasOutOfStock = !product.inStock || product.stock <= 0;

        // explicit SKU clear (admin sent an empty value) → $unset
        const writeOp = { ...fields };
        if (req.body.sku !== undefined && !writeOp.sku) {
            delete writeOp.sku;
            writeOp.$unset = { ...(writeOp.$unset || {}), sku: 1 };
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            product._id,
            writeOp,
            { new: true, runValidators: true }
        );

        for (const pid of oldPublicIds) await safeDestroy(pid);

        res.json(updatedProduct);

        if (wasOutOfStock && updatedProduct.inStock && updatedProduct.stock > 0) {
            notifyStockSubscribers(updatedProduct).catch((e) =>
                console.warn("[StockNotify] failed:", e.message)
            );
        }
    } catch (error) {
        await cleanupUploaded(files);
        console.error("UPDATE PRODUCT ERROR:", error);
        if (error.name === "ValidationError")
            return res.status(400).json({ message: Object.values(error.errors)[0]?.message || "Invalid product data" });
        if (error.code === 11000) {
            const dupKey = Object.keys(error.keyPattern || {})[0];
            return res.status(409).json({
                message: dupKey === "sku" ? "That SKU is already used by another product" : "Duplicate value",
            });
        }
        res.status(500).json({ message: "Failed to update product" });
    }
};

/* ─────────────────────────────────────────────
   BACK-IN-STOCK: email everyone subscribed to this product
───────────────────────────────────────────── */
const notifyStockSubscribers = async (product) => {
    const subs = await StockNotification.find({ product: product._id, notified: false }).lean();
    if (!subs.length) return;

    const link = `https://www.rvgift.com/products/${product.slug || product._id}`;
    const img = product.images?.[0]?.url || "";

    await Promise.allSettled(
        subs.map((s) =>
            sendEmail({
                to: s.email,
                subject: `🎉 Back in stock: ${product.name}`,
                label: "User/BackInStock",
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:28px;border:1px solid #e5e7eb;border-radius:14px">
                        ${img ? `<img src="${escapeHtml(img)}" alt="" style="width:100%;max-height:260px;object-fit:contain;border-radius:10px;margin-bottom:16px"/>` : ""}
                        <h2 style="margin:0 0 6px;color:#111827">${escapeHtml(product.name)} is back!</h2>
                        <p style="color:#6b7280;font-size:14px;margin:0 0 18px">The item you wanted is available again. Grab it before it sells out.</p>
                        <a href="${link}" style="display:inline-block;padding:12px 26px;background:#f59e0b;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold">View Product</a>
                        <p style="color:#9ca3af;font-size:11px;margin-top:20px">You asked RV Gifts to notify you about this product.</p>
                    </div>`,
            })
        )
    );

    await StockNotification.updateMany(
        { _id: { $in: subs.map((s) => s._id) } },
        { $set: { notified: true, notifiedAt: new Date() } }
    );
};

/* ─────────────────────────────────────────────
   SUBSCRIBE — "notify me when back in stock"  (PUBLIC)
   POST /api/products/:id/notify   { email }
───────────────────────────────────────────── */
export const subscribeStockNotification = async (req, res) => {
    try {
        const email = String(req.body?.email || "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200)
            return res.status(400).json({ message: "Please enter a valid email address" });

        const product = await findProduct(req.params.id).select("_id name inStock stock").lean();
        if (!product) return res.status(404).json({ message: "Product not found" });

        if (product.inStock && product.stock > 0)
            return res.status(400).json({ message: "This product is already in stock", inStock: true });

        await StockNotification.updateOne(
            { product: product._id, email },
            { $setOnInsert: { product: product._id, email }, $set: { notified: false } },
            { upsert: true }
        );

        res.json({ success: true, message: "You'll get an email when this is back in stock" });

        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `🔔 Stock request — ${product.name}`,
            label: "Admin/StockRequest",
            html: `<p><b>${escapeHtml(email)}</b> wants to be notified when <b>${escapeHtml(product.name)}</b> is back in stock.</p>`,
        }).catch(() => {});
    } catch (error) {
        console.error("STOCK NOTIFY SUBSCRIBE ERROR:", error);
        res.status(500).json({ message: "Could not save your request. Please try again." });
    }
};

/* ─────────────────────────────────────────────
   GET RELATED PRODUCTS
───────────────────────────────────────────── */
export const getRelatedProducts = async (req, res) => {
    try {
        const product = await findProduct(req.params.id).select("category").lean();
        if (!product)
            return res.status(404).json({ message: "Product not found" });

        const related = await Product.find({
            _id: { $ne: product._id },
            category: product.category,
            inStock: true,
            isArchived: { $ne: true },
            isPublished: { $ne: false },
        })
            .select("name price mrp slug category images rating numReviews isCustomizable stock inStock")
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
        const product = await findProduct(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Product not found" });

        // If the product is referenced by any order, keep the record (invoices,
        // order history and analytics still need it) — archive instead of delete.
        const usedInOrder = await Order.exists({ "items.productId": product._id });
        if (usedInOrder) {
            product.isArchived = true;
            product.inStock = false;
            product.stock = 0;
            product.updatedBy = req.user?._id;
            await product.save();
            return res.json({
                message: "Product archived — it appears in past orders, so it was hidden from the store instead of being permanently deleted.",
                archived: true,
            });
        }

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