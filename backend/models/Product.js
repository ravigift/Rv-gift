import mongoose from "mongoose";

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
        // ✅ MRP / Original price — for discount display
        mrp: {
            type: Number,
            default: null,
            min: 0,
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
            validate: v => v.length > 0,
        },
        tags: { type: [String], default: [] },
        sizes: { type: [String], default: [] },
        highlights: { type: Map, of: String, default: {} },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        numReviews: { type: Number, default: 0 },
        isCustomizable: { type: Boolean, default: false },
        stock: { type: Number, default: 0, min: 0 },
        inStock: { type: Boolean, default: true },

        // ── Shipping ──
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
        // ✅ Faster reads — Map converted to plain object in JSON
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ✅ Text search index
productSchema.index({ name: "text", description: "text", tags: "text" });

// ✅ Compound index for category + stock listing (common query pattern)
productSchema.index({ category: 1, inStock: 1, createdAt: -1 });

// ✅ Virtual: discount percentage — auto-calculated, not stored
productSchema.virtual("discountPercent").get(function () {
    if (this.mrp && this.mrp > this.price) {
        return Math.round(((this.mrp - this.price) / this.mrp) * 100);
    }
    return null;
});

export default mongoose.model("Product", productSchema);