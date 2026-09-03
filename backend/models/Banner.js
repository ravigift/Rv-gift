import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Banner title is required"],
            trim: true,
        },
        highlightText: {
            type: String,
            trim: true,
            default: "",
        },
        subtitle: {
            type: String,
            trim: true,
            default: "",
        },
        badgeText: {
            type: String,
            trim: true,
            default: "",
        },
        offerTag: {
            type: String,
            trim: true,
            default: "",
        },
        image: {
            url: {
                type: String,
                default: "",
            },
            public_id: {
                type: String,
                default: "",
            },
        },
        ctaText: {
            type: String,
            trim: true,
            default: "Shop Now",
        },
        ctaLink: {
            type: String,
            trim: true,
            default: "#products-section",
        },
        secondaryCtaText: {
            type: String,
            trim: true,
            default: "Customize 🎨",
        },
        secondaryCtaLink: {
            type: String,
            trim: true,
            default: "/?customizable=true",
        },
        theme: {
            type: String,
            enum: ["dark-luxury", "amber-gold", "royal-indigo", "rose-romance", "emerald-festive"],
            default: "dark-luxury",
        },
        bannerType: {
            type: String,
            enum: ["image-only", "with-text"],
            default: "image-only",
        },
        overlayStyle: {
            type: String,
            enum: ["none", "subtle", "dark"],
            default: "none",
        },
        textColor: {
            type: String,
            default: "#ffffff",
            trim: true,
        },
        accentColor: {
            type: String,
            default: "#f59e0b",
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        order: {
            type: Number,
            default: 0,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for fast retrieval of active banners sorted by order
bannerSchema.index({ isActive: 1, order: 1, createdAt: -1 });

export default mongoose.model("Banner", bannerSchema);
