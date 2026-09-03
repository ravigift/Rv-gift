import mongoose from "mongoose";

/**
 * Atomic named counter. One document per sequence key
 * (e.g. "invoice-2026-09"). Used to generate gap-free,
 * collision-free running numbers under concurrency.
 */
const counterSchema = new mongoose.Schema({
    _id: { type: String },
    seq: { type: Number, default: 0 },
});

export default mongoose.model("Counter", counterSchema);
