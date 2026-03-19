import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/emailService.js";

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

const generateToken = (id, role) =>
    jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

const generateOtp = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

// ══════════════════════════════════════════════
// REGISTER — sends OTP, no token yet
// ══════════════════════════════════════════════
export const register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name?.trim() || !email?.trim() || !phone?.trim() || !password?.trim())
            return res.status(400).json({ message: "All fields required" });

        if (!/^[6-9]\d{9}$/.test(phone.trim()))
            return res.status(400).json({ message: "Please enter a valid 10-digit Indian mobile number" });

        if (password.length < 8)
            return res.status(400).json({ message: "Password must be at least 8 characters" });

        const exists = await User.findOne({ email: email.toLowerCase().trim() });

        if (exists && !exists.isEmailVerified) {
            const otp = generateOtp();
            exists.emailOtp = otp;
            exists.emailOtpExpires = Date.now() + 10 * 60 * 1000;
            await exists.save({ validateBeforeSave: false });
            await sendOtpEmail(exists.email, exists.name, otp);
            return res.status(200).json({
                success: true,
                message: "OTP resent to your email",
                email: exists.email,
                requiresVerification: true,
            });
        }

        if (exists) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 12);
        const otp = generateOtp();

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            password: hashedPassword,
            role: "user",
            isEmailVerified: false,
            emailOtp: otp,
            emailOtpExpires: Date.now() + 10 * 60 * 1000,
        });

        await sendOtpEmail(user.email, user.name, otp);

        return res.status(201).json({
            success: true,
            message: "OTP sent to your email. Please verify.",
            email: user.email,
            requiresVerification: true,
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════
// VERIFY OTP
// ══════════════════════════════════════════════
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email?.trim() || !otp?.trim())
            return res.status(400).json({ message: "Email and OTP required" });

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isEmailVerified) return res.status(400).json({ message: "Email already verified" });
        if (!user.emailOtp || user.emailOtp !== otp.trim())
            return res.status(400).json({ message: "Invalid OTP" });
        if (user.emailOtpExpires < Date.now())
            return res.status(400).json({ message: "OTP expired. Please register again." });

        user.isEmailVerified = true;
        user.emailOtp = undefined;
        user.emailOtpExpires = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id, user.role),
        });

    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════
// RESEND OTP
// ══════════════════════════════════════════════
export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email?.trim()) return res.status(400).json({ message: "Email required" });

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isEmailVerified) return res.status(400).json({ message: "Email already verified" });

        const otp = generateOtp();
        user.emailOtp = otp;
        user.emailOtpExpires = Date.now() + 10 * 60 * 1000;
        await user.save({ validateBeforeSave: false });

        await sendOtpEmail(user.email, user.name, otp);
        return res.json({ success: true, message: "OTP resent successfully" });

    } catch (error) {
        console.error("RESEND OTP ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email?.trim() || !password?.trim())
            return res.status(400).json({ message: "Email & password required" });

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        if (!user.isEmailVerified) {
            const otp = generateOtp();
            user.emailOtp = otp;
            user.emailOtpExpires = Date.now() + 10 * 60 * 1000;
            await user.save({ validateBeforeSave: false });
            await sendOtpEmail(user.email, user.name, otp);
            return res.status(403).json({
                message: "Email not verified. OTP sent to your email.",
                requiresVerification: true,
                email: user.email,
            });
        }

        if (!["user", "admin", "owner"].includes(user.role))
            return res.status(403).json({ message: "Access denied" });

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id, user.role),
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════
// GET PROFILE
// ══════════════════════════════════════════════
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("PROFILE ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════
// SAVE LOCATION
// ══════════════════════════════════════════════
export const saveLocation = async (req, res) => {
    try {
        // ✅ IDOR fix: userId body se nahi, verified token se lo
        const userId = req.user._id;
        const { latitude, longitude, city, state } = req.body;
        if (latitude && (latitude < -90 || latitude > 90))
            return res.status(400).json({ message: "Invalid latitude" });
        if (longitude && (longitude < -180 || longitude > 180))
            return res.status(400).json({ message: "Invalid longitude" });

        await User.findByIdAndUpdate(userId, {
            $set: {
                "location.latitude": latitude,
                "location.longitude": longitude,
                "location.city": city?.trim(),
                "location.state": state?.trim(),
                "location.updatedAt": new Date(),
            },
        });
        res.json({ success: true });
    } catch (error) {
        console.error("SAVE LOCATION ERROR:", error);
        res.status(500).json({ message: "Failed to save location" });
    }
};

// ══════════════════════════════════════════════
// GET ALL USERS (ADMIN)
// ══════════════════════════════════════════════
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
        res.json(users);
    } catch (error) {
        console.error("GET ALL USERS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

// ══════════════════════════════════════════════
// USER — FORGOT PASSWORD  →  rvgift.com
// ══════════════════════════════════════════════
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email?.trim()) return res.status(400).json({ message: "Email is required" });

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        // Security: never reveal if email exists
        if (!user) return res.json({ success: true, message: "If this email exists, a reset link has been sent" });

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
        await user.save({ validateBeforeSave: false });

        // ✅ User site URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const html = `
            <div style="font-family:Arial,sans-serif;background:#f5f7fa;padding:30px">
                <div style="max-width:520px;margin:auto;background:#fff;padding:30px;border-radius:12px;border:1px solid #e5e7eb">
                    <div style="text-align:center;margin-bottom:24px">
                        <div style="width:56px;height:56px;background:#f59e0b;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:28px">🎁</div>
                    </div>
                    <h2 style="color:#111827;text-align:center;margin-bottom:8px">Reset Your Password</h2>
                    <p style="color:#6b7280;text-align:center;font-size:14px;margin-bottom:24px">
                        We received a request to reset your RV Gift Shop password.
                    </p>
                    <div style="text-align:center;margin-bottom:24px">
                        <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;background:#f59e0b;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px">
                            🔑 Reset Password
                        </a>
                    </div>
                    <p style="color:#9ca3af;font-size:12px;text-align:center;margin-bottom:8px">
                        This link expires in <strong>15 minutes</strong>.
                    </p>
                    <p style="color:#9ca3af;font-size:12px;text-align:center">
                        If you didn't request this, ignore this email.
                    </p>
                    <hr style="margin:24px 0;border:none;border-top:1px solid #f3f4f6"/>
                    <p style="color:#d1d5db;font-size:11px;text-align:center">RV Gift Shop • Security Notification</p>
                </div>
            </div>
        `;

        await sendEmail({ to: user.email, subject: "Reset Your Password - RV Gift Shop", html, label: "Auth/ForgotPassword" });
        res.json({ success: true, message: "If this email exists, a reset link has been sent" });

    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};

// ══════════════════════════════════════════════
// USER — RESET PASSWORD
// ══════════════════════════════════════════════
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password?.trim())
            return res.status(400).json({ message: "Token and new password required" });

        if (password.length < 8)
            return res.status(400).json({ message: "Password must be at least 8 characters" });

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) return res.status(400).json({ message: "Invalid or expired reset link" });

        user.password = await bcrypt.hash(password, 12);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({ success: true, message: "Password reset successfully. You can now login." });

    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};

// ══════════════════════════════════════════════
// ADMIN — FORGOT PASSWORD  →  admin.rvgift.com
// ══════════════════════════════════════════════
export const adminForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email?.trim()) return res.status(400).json({ message: "Email is required" });

        // ✅ Sirf admin/owner role — regular users is route se reset na kar sakein
        const admin = await User.findOne({
            email: email.toLowerCase().trim(),
            role: { $in: ["admin", "owner"] },
        });

        if (!admin) return res.json({ success: true, message: "If this email exists, a reset link has been sent" });

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        admin.passwordResetToken = hashedToken;
        admin.passwordResetExpires = Date.now() + 15 * 60 * 1000;
        await admin.save({ validateBeforeSave: false });

        // ✅ ADMIN URL — admin.rvgift.com
        const resetUrl = `${process.env.ADMIN_FRONTEND_URL}/admin/reset-password/${resetToken}`;

        const html = `
            <div style="font-family:'DM Sans',Arial,sans-serif;background:#0f0c29;padding:40px 20px">
                <div style="max-width:480px;margin:auto;background:rgba(255,255,255,0.05);
                            border:1.5px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden">
                    <div style="height:4px;background:linear-gradient(90deg,#f59e0b,#f97316,#ef4444,#8b5cf6)"></div>
                    <div style="padding:36px 32px;text-align:center">
                        <div style="width:60px;height:60px;background:linear-gradient(135deg,#f59e0b,#f97316);
                                    border-radius:50%;display:inline-flex;align-items:center;
                                    justify-content:center;font-size:26px;margin-bottom:20px">🛡️</div>
                        <h2 style="color:#fff;margin:0 0 8px;font-size:22px;font-weight:800">
                            Admin Password Reset
                        </h2>
                        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin-bottom:28px">
                            RVGifts Admin Panel — Authorized Access Only
                        </p>
                        <a href="${resetUrl}"
                            style="display:inline-block;padding:14px 32px;
                                   background:linear-gradient(135deg,#f59e0b,#f97316);
                                   color:#fff;text-decoration:none;border-radius:10px;
                                   font-weight:700;font-size:15px">
                            Reset Admin Password →
                        </a>
                        <p style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:24px">
                            Yeh link <strong style="color:rgba(255,255,255,0.5)">15 minutes</strong>
                            mein expire ho jayega.<br/>
                            Agar aapne request nahi ki toh ignore karo.
                        </p>
                        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0"/>
                        <code style="color:rgba(255,255,255,0.2);font-size:10px;word-break:break-all">
                            ${resetUrl}
                        </code>
                    </div>
                </div>
            </div>
        `;

        await sendEmail({
            to: admin.email,
            subject: "RVGifts Admin — Password Reset Request",
            html,
            label: "AdminAuth/ForgotPassword",
        });

        res.json({ success: true, message: "If this email exists, a reset link has been sent" });

    } catch (error) {
        console.error("ADMIN FORGOT PASSWORD ERROR:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};

// ══════════════════════════════════════════════
// ADMIN — RESET PASSWORD
// ══════════════════════════════════════════════
export const adminResetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password?.trim())
            return res.status(400).json({ message: "Token and password required" });

        if (password.length < 8)
            return res.status(400).json({ message: "Password must be at least 8 characters" });

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // ✅ role check — ensures only admin/owner tokens are valid here
        const admin = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
            role: { $in: ["admin", "owner"] },
        });

        if (!admin) return res.status(400).json({ message: "Invalid or expired reset link" });

        admin.password = await bcrypt.hash(password, 12);
        admin.passwordResetToken = undefined;
        admin.passwordResetExpires = undefined;
        await admin.save();

        res.json({ success: true, message: "Password reset successfully. You can now login." });

    } catch (error) {
        console.error("ADMIN RESET PASSWORD ERROR:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};

// ══════════════════════════════════════════════
// OTP EMAIL HELPER
// ══════════════════════════════════════════════
async function sendOtpEmail(email, name, otp) {
    const html = `
        <div style="font-family:Arial,sans-serif;background:#f5f7fa;padding:30px">
            <div style="max-width:520px;margin:auto;background:#fff;padding:30px;border-radius:12px;border:1px solid #e5e7eb">
                <div style="text-align:center;margin-bottom:24px">
                    <div style="width:56px;height:56px;background:#f59e0b;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:28px">🎁</div>
                </div>
                <h2 style="color:#111827;text-align:center;margin-bottom:8px">Verify Your Email</h2>
                <p style="color:#6b7280;text-align:center;font-size:14px;margin-bottom:24px">
                    Hi ${name}! Use this OTP to verify your RV Gift Shop account.
                </p>
                <div style="text-align:center;margin-bottom:24px">
                    <div style="display:inline-block;background:#fef3c7;border:2px dashed #f59e0b;border-radius:12px;padding:16px 40px">
                        <span style="font-size:36px;font-weight:900;color:#d97706;letter-spacing:8px">${otp}</span>
                    </div>
                </div>
                <p style="color:#9ca3af;font-size:12px;text-align:center;margin-bottom:8px">
                    This OTP will expire in <strong>10 minutes</strong>.
                </p>
                <p style="color:#9ca3af;font-size:12px;text-align:center">
                    If you didn't create an account, please ignore this email.
                </p>
                <hr style="margin:24px 0;border:none;border-top:1px solid #f3f4f6"/>
                <p style="color:#d1d5db;font-size:11px;text-align:center">RV Gift Shop • Email Verification</p>
            </div>
        </div>
    `;
    await sendEmail({ to: email, subject: "Verify Your Email - RV Gift Shop", html, label: "Auth/OTP" });
}