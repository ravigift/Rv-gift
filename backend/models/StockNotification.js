import mongoose from "mongoose";

/**
 * "Notify me when back in stock" subscription.
 * One row per (product, email). Cleared/marked once the alert email is sent.
 */
const stockNotificationSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        notified: { type: Boolean, default: false },
        notifiedAt: { type: Date },
    },
    { timestamps: true }
);

// A given email subscribes to a given product at most once
stockNotificationSchema.index({ product: 1, email: 1 }, { unique: true });

export default mongoose.model("StockNotification", stockNotificationSchema);
