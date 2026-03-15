import mongoose from "mongoose";

/* ═══════════════════════════
   ADDRESS SUB-SCHEMA
═══════════════════════════ */
const addressSchema = new mongoose.Schema(
    {
        label: { type: String, trim: true, maxlength: 30, default: "Home" },
        name: { type: String, required: true, trim: true, maxlength: 100 },
        phone: { type: String, required: true, trim: true, match: [/^[6-9]\d{9}$/, "Invalid phone number"] },
        house: { type: String, required: true, trim: true, maxlength: 200 },
        area: { type: String, required: true, trim: true, maxlength: 200 },
        landmark: { type: String, trim: true, maxlength: 100, default: "" },
        city: { type: String, required: true, trim: true, maxlength: 100 },
        state: { type: String, required: true, trim: true, maxlength: 100 },
        pincode: { type: String, required: true, trim: true, match: [/^\d{6}$/, "Invalid pincode"] },
        isDefault: { type: Boolean, default: false },
        lat: { type: Number, default: null }, // ✅ COD 15km check ke liye
        lng: { type: Number, default: null },
    },
    { timestamps: true }
);

/* ═══════════════════════════
   USER SCHEMA
═══════════════════════════ */
const userSchema = new mongoose.Schema(
    {
        /* ── Basic Info ── */
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
        },

        /* ── Mobile Number — optional (purane users ke liye) ── */
        phone: {
            type: String,
            required: false,
            trim: true,
            match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"],
        },

        role: {
            type: String,
            enum: ["user", "admin", "owner"],
            default: "user",
        },

        /* ── Email Verification ── */
        isEmailVerified: { type: Boolean, default: false },
        emailOtp: { type: String, default: undefined },
        emailOtpExpires: { type: Date, default: undefined },

        /* ── GPS Location ── */
        location: {
            latitude: { type: Number, default: null },
            longitude: { type: Number, default: null },
            city: { type: String, trim: true, default: null },
            state: { type: String, trim: true, default: null },
            updatedAt: { type: Date, default: null },
        },

        /* ── Saved Delivery Addresses (max 5) ── */
        addresses: {
            type: [addressSchema],
            validate: {
                validator: (arr) => arr.length <= 5,
                message: "Maximum 5 addresses allowed",
            },
            default: [],
        },

        /* ── Password Reset ── */
        passwordResetToken: { type: String, default: undefined },
        passwordResetExpires: { type: Date, default: undefined },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);