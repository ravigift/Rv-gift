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

        tags: {
            type: [String],
            default: [],
        },

        // ✅ SIZES — e.g. ["S", "M", "L", "XL", "XXL"]
        sizes: {
            type: [String],
            default: [],
        },

        // ✅ PRODUCT HIGHLIGHTS — e.g. { fabric: "Cotton", sleeve: "Full", color: "Purple" }
        highlights: {
            type: Map,
            of: String,
            default: {},
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        numReviews: {
            type: Number,
            default: 0,
        },

        isCustomizable: {
            type: Boolean,
            default: false,
        },

        inStock: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

productSchema.index({
    name: "text",
    description: "text",
    tags: "text",
});

export default mongoose.model("Product", productSchema);