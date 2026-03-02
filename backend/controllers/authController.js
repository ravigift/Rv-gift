import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ===============================
   JWT GENERATOR
================================ */
const generateToken = (id, role) =>
    jwt.sign(
        { id, role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

/* ===============================
   REGISTER (NORMAL USER ONLY)
================================ */
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if (exists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: "user",
        });

        return res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

/* ===============================
   LOGIN (USER + ADMIN + OWNER)
================================ */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email & password required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!["user", "admin", "owner"].includes(user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

/* ===============================
   GET PROFILE (PROTECTED)
================================ */
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("PROFILE ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/* ===============================
   ✅ SAVE LOCATION (PUBLIC)
================================ */
export const saveLocation = async (req, res) => {
    try {
        const { userId, latitude, longitude, city, state } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId required" });
        }

        await User.findByIdAndUpdate(userId, {
            $set: {
                "location.latitude": latitude,
                "location.longitude": longitude,
                "location.city": city,
                "location.state": state,
                "location.updatedAt": new Date(),
            },
        });

        res.json({ success: true });
    } catch (error) {
        console.error("SAVE LOCATION ERROR:", error);
        res.status(500).json({ message: "Failed to save location" });
    }
};

/* ===============================
   ✅ GET ALL USERS (ADMIN)
================================ */
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 })
            .lean();
        res.json(users);
    } catch (error) {
        console.error("GET ALL USERS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
};