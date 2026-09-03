import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

/* ── helper: recalculate avg rating on Product ── */
const recalcProductRating = async (productId) => {
    try {
        const stats = await Review.aggregate([
            { $match: { product: productId } },
            {
                $group: {
                    _id: "$product",
                    avgRating: { $avg: "$rating" },
                    count: { $sum: 1 },
                },
            },
        ]);

        if (stats.length > 0) {
            await Product.findByIdAndUpdate(productId, {
                rating: Math.round(stats[0].avgRating * 10) / 10,
                numReviews: stats[0].count,
            });
        } else {
            await Product.findByIdAndUpdate(productId, {
                rating: 0,
                numReviews: 0,
            });
        }
    } catch (err) {
        console.error("RECALC RATING ERROR:", err.message);
    }
};

/* =====================================================
   ➕ ADD / UPDATE REVIEW
   POST /api/reviews/:productId
===================================================== */
export const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const productId = req.params.productId;

        const numRating = Number(rating);
        if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5)
            return res.status(400).json({ message: "Rating must be a whole number between 1 and 5" });

        const product = await Product.findById(productId);
        if (!product)
            return res.status(404).json({ message: "Product not found" });

        // ✅ Verified purchase only — user must have a delivered order with this product
        const purchased = await Order.exists({
            user: req.user._id,
            orderStatus: "DELIVERED",
            "items.productId": product._id,
        });
        if (!purchased)
            return res.status(403).json({ message: "You can only review products you've purchased and received" });

        const review = await Review.findOneAndUpdate(
            { product: productId, user: req.user._id },
            {
                product: productId,
                user: req.user._id,
                name: req.user.name,
                rating: numRating,
                comment: String(comment || "").trim().slice(0, 2000),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await recalcProductRating(product._id);

        res.status(201).json({ success: true, review });
    } catch (error) {
        console.error("ADD REVIEW ERROR:", error);
        res.status(500).json({ message: "Failed to submit review" });
    }
};

/* =====================================================
   ✅ CAN THIS USER REVIEW?  (logged-in)
   GET /api/reviews/:productId/eligibility
===================================================== */
export const getReviewEligibility = async (req, res) => {
    try {
        const productId = req.params.productId;

        const [purchased, mine] = await Promise.all([
            Order.exists({
                user: req.user._id,
                orderStatus: "DELIVERED",
                "items.productId": productId,
            }),
            Review.findOne({ product: productId, user: req.user._id }).lean(),
        ]);

        res.json({
            canReview: Boolean(purchased),
            hasReviewed: Boolean(mine),
            myReview: mine ? { rating: mine.rating, comment: mine.comment || "" } : null,
        });
    } catch (error) {
        console.error("REVIEW ELIGIBILITY ERROR:", error);
        res.status(500).json({ message: "Failed to check review eligibility" });
    }
};

/* =====================================================
   📋 GET REVIEWS FOR A PRODUCT
   GET /api/reviews/:productId
===================================================== */
export const getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean(); // ✅ faster read

        res.json(reviews);
    } catch (error) {
        console.error("GET REVIEWS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch reviews" });
    }
};

/* =====================================================
   🗑️ DELETE REVIEW
   DELETE /api/reviews/:reviewId
===================================================== */
export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review)
            return res.status(404).json({ message: "Review not found" });

        const isOwner = review.user.toString() === req.user._id.toString();
        const isAdmin = ["admin", "owner"].includes(req.user.role);
        if (!isOwner && !isAdmin)
            return res.status(403).json({ message: "Not authorized" });

        const productId = review.product;
        await review.deleteOne();
        await recalcProductRating(productId);

        res.json({ success: true, message: "Review deleted" });
    } catch (error) {
        console.error("DELETE REVIEW ERROR:", error);
        res.status(500).json({ message: "Failed to delete review" });
    }
};