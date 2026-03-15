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
   AUTO SLUG — generate before save
───────────────────────────────────────────── */
productSchema.pre("save", async function () {
    if (!this.isModified("name") && this.slug) return;
    let base = slugify(this.name, { lower: true, strict: true });
    let slug = base;
    let count = 1;
    while (
        await mongoose.model("Product").exists({ slug, _id: { $ne: this._id } })
    ) {
        slug = `${base}-${count++}`;
    }
    this.slug = slug;
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