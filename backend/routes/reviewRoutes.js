import express from "express";
import {
    addReview,
    getProductReviews,
    deleteReview,
    getReviewEligibility,
} from "../controllers/Reviewcontroller.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Can the logged-in user review this product? (specific route BEFORE /:productId)
router.get("/:productId/eligibility", protect, getReviewEligibility);

// GET all reviews for a product (public)
router.get("/:productId", getProductReviews);

// ADD / UPDATE review (logged in user only)
router.post("/:productId", protect, addReview);

// DELETE own review
router.delete("/:reviewId", protect, deleteReview);

export default router;
