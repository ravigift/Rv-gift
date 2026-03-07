import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"],
        },
        location: {
            latitude: { type: Number },
            longitude: { type: Number },
            city: { type: String },
            state: { type: String },
            updatedAt: { type: Date },
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            // ✅ Validation controller mein karo — model mein nahi
            // Bcrypt hash yahan validate nahi hoga
        },
        role: {
            type: String,
            enum: ["user", "admin", "owner"],
            default: "user",
        },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);