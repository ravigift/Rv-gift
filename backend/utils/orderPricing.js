/**
 * orderPricing.js
 * ─────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for order money + stock.
 *
 * The client is NEVER trusted for item prices, delivery charge,
 * platform fee or total amount. Everything below is recomputed
 * from the Product collection in the database.
 */

import mongoose from "mongoose";
import Product from "../models/Product.js";

/* Business rules — keep in sync with the storefront display only.
   The value that actually charges the customer is computed here. */
export const PRICING = {
    PLATFORM_FEE: 9,
    FREE_DELIVERY_ABOVE: 1000,
    COD_DELIVERY_CHARGE: 70,
    ONLINE_DELIVERY_CHARGE: 70,
    MAX_QTY_PER_ITEM: 100,
    MAX_ITEMS: 20,
    MAX_ORDER_VALUE: 200000, // hard ceiling — sanity guard
};

/**
 * Recompute an entire order from the DB.
 * @param {Array}  rawItems       cart items from the client (only productId + qty + customization trusted)
 * @param {string} paymentMethod  "COD" | "RAZORPAY" (case-insensitive)
 * @returns {{ items, itemsTotal, deliveryCharge, platformFee, totalAmount } | { error }}
 */
export const buildVerifiedOrder = async (rawItems, paymentMethod) => {
    if (!Array.isArray(rawItems) || rawItems.length === 0)
        return { error: "Cart is empty" };
    if (rawItems.length > PRICING.MAX_ITEMS)
        return { error: "Too many items in cart" };

    const ids = rawItems.map((i) => i.productId || i._id).filter(Boolean);
    if (ids.length !== rawItems.length)
        return { error: "Invalid cart item" };
    if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id)))
        return { error: "Invalid product reference" };

    const products = await Product.find({ _id: { $in: ids } })
        .select("name price mrp stock inStock images")
        .lean();
    const map = new Map(products.map((p) => [p._id.toString(), p]));

    const items = [];
    let itemsTotal = 0;

    for (const raw of rawItems) {
        const pid = (raw.productId || raw._id).toString();
        const product = map.get(pid);
        if (!product)
            return { error: "One or more products are no longer available" };

        const qty = Math.min(
            Math.max(1, Math.floor(Number(raw.qty ?? raw.quantity ?? 1))),
            PRICING.MAX_QTY_PER_ITEM
        );
        if (!Number.isFinite(qty) || qty < 1)
            return { error: `Invalid quantity for "${product.name}"` };

        if (!product.inStock || product.stock < qty)
            return { error: `"${product.name}" is out of stock` };

        const price = Number(product.price);
        if (!Number.isFinite(price) || price < 0)
            return { error: `"${product.name}" has an invalid price` };

        itemsTotal += price * qty;

        items.push({
            productId: product._id,
            name: String(product.name).slice(0, 200),
            price, // ← authoritative DB price
            mrp: product.mrp ?? null,
            qty,
            image:
                product.images?.[0]?.url ||
                (typeof raw.image === "string" ? raw.image : "") ||
                "",
            selectedSize: String(raw.selectedSize || "").slice(0, 20),
            customization: {
                text: String(raw.customization?.text || "").trim().slice(0, 500),
                imageUrl: String(raw.customization?.imageUrl || "").trim().slice(0, 1000),
                note: String(raw.customization?.note || "").trim().slice(0, 1000),
            },
        });
    }

    const isCOD = String(paymentMethod).toUpperCase() === "COD";
    const deliveryCharge = isCOD
        ? PRICING.COD_DELIVERY_CHARGE
        : itemsTotal >= PRICING.FREE_DELIVERY_ABOVE
            ? 0
            : PRICING.ONLINE_DELIVERY_CHARGE;

    const platformFee = PRICING.PLATFORM_FEE;
    const totalAmount = itemsTotal + platformFee + deliveryCharge;

    if (totalAmount <= 0 || totalAmount > PRICING.MAX_ORDER_VALUE)
        return { error: "Order total is out of the allowed range" };

    return { items, itemsTotal, deliveryCharge, platformFee, totalAmount };
};

/**
 * Atomically decrement stock for every item. All-or-nothing:
 * if any item can't be satisfied, every prior decrement is rolled back.
 * @returns {{ ok: true } | { error: string }}
 */
export const commitStock = async (items) => {
    const done = [];
    for (const item of items) {
        const r = await Product.updateOne(
            { _id: item.productId, stock: { $gte: item.qty } },
            { $inc: { stock: -item.qty } }
        );
        if (r.modifiedCount !== 1) {
            for (const d of done) {
                await Product.updateOne(
                    { _id: d.productId },
                    { $inc: { stock: d.qty } }
                ).catch(() => {});
            }
            return { error: `"${item.name}" just went out of stock` };
        }
        done.push(item);
    }
    // Stock only went DOWN here — flip inStock off for anything that hit zero.
    for (const d of done) {
        await Product.updateOne(
            { _id: d.productId, stock: { $lte: 0 } },
            { $set: { inStock: false } }
        ).catch(() => {});
    }
    return { ok: true };
};

/**
 * Restore stock (used on cancellation / failed order).
 */
export const restoreStock = async (items) => {
    for (const item of items) {
        await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.qty } }
        ).catch(() => {});
        // stock just went UP — anything back above zero is in stock again
        await Product.updateOne(
            { _id: item.productId, stock: { $gt: 0 } },
            { $set: { inStock: true } }
        ).catch(() => {});
    }
};
