import Banner from "../models/Banner.js";
import cloudinary from "../config/cloudinary.js";

/* Helper to safely destroy old image on Cloudinary */
const safeDestroy = async (publicId) => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (e) {
        console.warn("[Cloudinary] Banner Image Delete failed:", publicId, e.message);
    }
};

/* ─────────────────────────────────────────────
   1. GET PUBLIC BANNERS (Active only, sorted)
   GET /api/banners
───────────────────────────────────────────── */
export const getPublicBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true })
            .sort({ order: 1, createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: banners.length,
            banners,
        });
    } catch (error) {
        console.error("GET PUBLIC BANNERS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch banners",
            error: error.message,
        });
    }
};

/* ─────────────────────────────────────────────
   2. GET ALL BANNERS (Admin - active & inactive)
   GET /api/banners/admin
───────────────────────────────────────────── */
export const getAllBannersAdmin = async (req, res) => {
    try {
        const banners = await Banner.find()
            .sort({ order: 1, createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: banners.length,
            banners,
        });
    } catch (error) {
        console.error("GET ADMIN BANNERS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch banners",
            error: error.message,
        });
    }
};

/* ─────────────────────────────────────────────
   3. CREATE BANNER (Admin)
   POST /api/banners
───────────────────────────────────────────── */
export const createBanner = async (req, res) => {
    try {
        const {
            title,
            highlightText,
            subtitle,
            badgeText,
            offerTag,
            ctaText,
            ctaLink,
            secondaryCtaText,
            secondaryCtaLink,
            theme,
            bannerType,
            overlayStyle,
            textColor,
            accentColor,
            isActive,
            order,
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Banner title is required",
            });
        }

        let imageData = { url: "", public_id: "" };
        if (req.file) {
            imageData = {
                url: req.file.path,
                public_id: req.file.filename,
            };
        }

        const newBanner = new Banner({
            title: title.trim(),
            highlightText: highlightText ? highlightText.trim() : "",
            subtitle: subtitle ? subtitle.trim() : "",
            badgeText: badgeText ? badgeText.trim() : "",
            offerTag: offerTag ? offerTag.trim() : "",
            image: imageData,
            ctaText: ctaText ? ctaText.trim() : "Shop Now",
            ctaLink: ctaLink ? ctaLink.trim() : "#products-section",
            secondaryCtaText: secondaryCtaText ? secondaryCtaText.trim() : "Customize 🎨",
            secondaryCtaLink: secondaryCtaLink ? secondaryCtaLink.trim() : "/?customizable=true",
            theme: theme || "dark-luxury",
            bannerType: bannerType || "image-only",
            overlayStyle: overlayStyle || "none",
            textColor: textColor || "#ffffff",
            accentColor: accentColor || "#f59e0b",
            isActive: isActive !== undefined ? String(isActive) === "true" || isActive === true : true,
            order: order !== undefined && !isNaN(Number(order)) ? Number(order) : 0,
        });

        const savedBanner = await newBanner.save();

        return res.status(201).json({
            success: true,
            message: "Hero Banner created successfully",
            banner: savedBanner,
        });
    } catch (error) {
        console.error("CREATE BANNER ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create banner",
            error: error.message,
        });
    }
};

/* ─────────────────────────────────────────────
   4. UPDATE BANNER (Admin)
   PUT /api/banners/:id
───────────────────────────────────────────── */
export const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        }

        const {
            title,
            highlightText,
            subtitle,
            badgeText,
            offerTag,
            ctaText,
            ctaLink,
            secondaryCtaText,
            secondaryCtaLink,
            theme,
            bannerType,
            overlayStyle,
            textColor,
            accentColor,
            isActive,
            order,
            removeImage,
        } = req.body;

        if (title !== undefined) banner.title = title.trim();
        if (highlightText !== undefined) banner.highlightText = highlightText.trim();
        if (subtitle !== undefined) banner.subtitle = subtitle.trim();
        if (badgeText !== undefined) banner.badgeText = badgeText.trim();
        if (offerTag !== undefined) banner.offerTag = offerTag.trim();
        if (ctaText !== undefined) banner.ctaText = ctaText.trim();
        if (ctaLink !== undefined) banner.ctaLink = ctaLink.trim();
        if (secondaryCtaText !== undefined) banner.secondaryCtaText = secondaryCtaText.trim();
        if (secondaryCtaLink !== undefined) banner.secondaryCtaLink = secondaryCtaLink.trim();
        if (theme !== undefined) banner.theme = theme;
        if (bannerType !== undefined) banner.bannerType = bannerType;
        if (overlayStyle !== undefined) banner.overlayStyle = overlayStyle;
        if (textColor !== undefined) banner.textColor = textColor;
        if (accentColor !== undefined) banner.accentColor = accentColor;
        if (isActive !== undefined) banner.isActive = String(isActive) === "true" || isActive === true;
        if (order !== undefined && !isNaN(Number(order))) banner.order = Number(order);

        // If a new image is uploaded, delete old one and assign new
        if (req.file) {
            if (banner.image?.public_id) {
                await safeDestroy(banner.image.public_id);
            }
            banner.image = {
                url: req.file.path,
                public_id: req.file.filename,
            };
        } else if (removeImage === "true" || removeImage === true) {
            if (banner.image?.public_id) {
                await safeDestroy(banner.image.public_id);
            }
            banner.image = { url: "", public_id: "" };
        }

        const updatedBanner = await banner.save();

        return res.status(200).json({
            success: true,
            message: "Banner updated successfully",
            banner: updatedBanner,
        });
    } catch (error) {
        console.error("UPDATE BANNER ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update banner",
            error: error.message,
        });
    }
};

/* ─────────────────────────────────────────────
   5. DELETE BANNER (Admin)
   DELETE /api/banners/:id
───────────────────────────────────────────── */
export const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        }

        // Cleanup Cloudinary image
        if (banner.image?.public_id) {
            await safeDestroy(banner.image.public_id);
        }

        await Banner.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Banner deleted successfully",
        });
    } catch (error) {
        console.error("DELETE BANNER ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete banner",
            error: error.message,
        });
    }
};

/* ─────────────────────────────────────────────
   6. TOGGLE BANNER ACTIVE STATUS (Admin)
   PATCH /api/banners/:id/toggle
───────────────────────────────────────────── */
export const toggleBannerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        }

        banner.isActive = !banner.isActive;
        await banner.save();

        return res.status(200).json({
            success: true,
            message: `Banner ${banner.isActive ? "activated" : "deactivated"} successfully`,
            banner,
        });
    } catch (error) {
        console.error("TOGGLE BANNER STATUS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to toggle banner status",
            error: error.message,
        });
    }
};
