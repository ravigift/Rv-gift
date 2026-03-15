import mongoose from "mongoose";

/*
 * PosSecurity
 * ─────────────────────────────────────────────
 * deletePin    → bcrypt hashed — plain text kabhi store nahi hoga
 * resetOtp     → SHA-256 hashed — brute force se safe
 * resetOtpExpire → 10 min expiry
 *
 * Collection mein sirf EK document hoga (singleton pattern)
 */
const posSecuritySchema = new mongoose.Schema(
    {
        deletePin: { type: String, default: "" },      // bcrypt hash
        resetOtp: { type: String, default: null },    // sha256 hash
        resetOtpExpire: { type: Date, default: null },
    },
    { timestamps: true }
);

export default mongoose.model("PosSecurity", posSecuritySchema);