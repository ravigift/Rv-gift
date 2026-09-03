import mongoose from "mongoose";

/**
 * SiteSection — editable content blocks for the storefront home page.
 * One document per `key` (e.g. "how-it-works"). `data` is a free-form
 * object whose shape is validated per-key in the controller.
 */
const siteSectionSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true, minimize: false }
);

export default mongoose.model("SiteSection", siteSectionSchema);
