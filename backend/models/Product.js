import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 5000,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        mrp: {
            type: Number,
            default: null,
            min: 0,
        },
        slug: {
            type: String,
            unique: true,
            index: true,
            sparse: true,
        },
        category: {
            type: String,
            required: true,
            index: true,
        },
        images: {
            type: [
                {
                    url: { type: String, required: true },
                    public_id: { type: String, required: true },
                },
            ],
            validate: (v) => v.length > 0,
        },
        tags: { type: [String], default: [] },
        sizes: { type: [String], default: [] },
        highlights: { type: Map, of: String, default: {} },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        numReviews: { type: Number, default: 0 },
        isCustomizable: { type: Boolean, default: false },
        stock: { type: Number, default: 0, min: 0 },
        inStock: { type: Boolean, default: true },

        weight: {
            type: Number,
            default: 500,
            min: [1, "Weight must be at least 1g"],
            max: [30000, "Weight cannot exceed 30kg"],
        },
        dimensions: {
            length: { type: Number, default: 10 },
            breadth: { type: Number, default: 10 },
            height: { type: Number, default: 10 },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

/* ─────────────────────────────────────────────
   AUTO SLUG — max 8 words, single DB query
   Uses _id as suffix to guarantee uniqueness
   without looping — much faster on create
───────────────────────────────────────────── */
productSchema.pre("save", function () {
    if (!this.isModified("name") && this.slug) return;

    // Max 8 words for SEO friendly URL
    const base = slugify(this.name, { lower: true, strict: true })
        .split("-").slice(0, 8).join("-");

    // ✅ Use _id as guaranteed unique suffix — no DB loop needed
    // Result: "ram-mandir-ayodhya-model" or "ram-mandir-ayodhya-model-abc123"
    if (!this.slug || this.isModified("name")) {
        // Try base first; if conflict Mongoose unique index will catch it
        // For new docs, append short _id to guarantee uniqueness instantly
        this.slug = this.isNew
            ? `${base}-${this._id.toString().slice(-5)}`
            : base;
    }
});

/* ─────────────────────────────────────────────
   INDEXES
───────────────────────────────────────────── */
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, inStock: 1, createdAt: -1 });

/* ─────────────────────────────────────────────
   VIRTUAL — discount percent
───────────────────────────────────────────── */
productSchema.virtual("discountPercent").get(function () {
    if (this.mrp && this.mrp > this.price) {
        return Math.round(((this.mrp - this.price) / this.mrp) * 100);
    }
    return null;
});

export default mongoose.model("Product", productSchema);