import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
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
            default: 500,      // grams — default 500g
            min: [1, "Weight must be at least 1g"],
            max: [30000, "Weight cannot exceed 30kg"],
        },
        dimensions: {
            length: { type: Number, default: 10 }, // cm
            breadth: { type: Number, default: 10 },
            height: { type: Number, default: 10 },
        },
    },
    { timestamps: true }
);

productSchema.index({ name: "text", description: "text", tags: "text" });

export default mongoose.model("Product", productSchema);