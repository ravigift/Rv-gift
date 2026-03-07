import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true, // ✅ Fast query for getMyOrders
        },

        items: [
            {
                productId: mongoose.Schema.Types.ObjectId,
                name: String,
                price: Number,
                qty: Number,
                image: String,
                customization: {
                    text: { type: String, default: "" },
                    imageUrl: { type: String, default: "" },
                    note: { type: String, default: "" },
                },
            },
        ],

        customerName: { type: String, trim: true },
        phone: { type: String, trim: true },
        address: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        totalAmount: { type: Number, min: 0 },

        orderStatus: {
            type: String,
            enum: [
                "PLACED", "CONFIRMED", "PACKED",
                "SHIPPED", "OUT_FOR_DELIVERY",
                "DELIVERED", "CANCELLED",
            ],
            default: "PLACED",
            index: true, // ✅ Fast status queries
        },

        statusTimeline: {
            placedAt: { type: Date, default: Date.now },
            confirmedAt: Date,
            packedAt: Date,
            shippedAt: Date,
            deliveredAt: Date,
            cancelledAt: Date, // ✅ Missing tha
        },

        // ✅ Missing tha
        cancellationReason: {
            type: String,
            default: "",
        },

        // ✅ Location tracking
        latitude: Number,
        longitude: Number,
    },
    { timestamps: true }
);

export default mongoose.model("Order", orderSchema);