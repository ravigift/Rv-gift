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
            // Standard Email Regex
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
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
            minlength: [8, "Password must be at least 8 characters long"],
            validate: {
                validator: function (v) {
                    // Requires at least one digit, one lowercase, one uppercase, and one special character
                    return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/.test(v);
                },
                message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
            }
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