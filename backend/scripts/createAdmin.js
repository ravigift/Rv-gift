/**
 * createAdmin.js — One-time script
 * Run: node scripts/createAdmin.js
 * Delete this file after running!
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

// ── Admin details ──────────────────────────────────────────────
const ADMIN = {
    name: "Ravi Verma",
    email: "officialrvgift@gmail.com",
    phone: "8299519532",
    password: "RVGifts@2026",   // ← deploy ke baad change kar lena
    role: "owner",
};
// ──────────────────────────────────────────────────────────────

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Already exists check
        const { default: User } = await import("../models/User.js");

        const existing = await User.findOne({ email: ADMIN.email });
        if (existing) {
            console.log(`⚠️  Admin already exists: ${existing.email} (role: ${existing.role})`);
            console.log("Agar password reset karna hai toh Security Section use karo.");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(ADMIN.password, 12);

        await User.create({
            name: ADMIN.name,
            email: ADMIN.email,
            phone: ADMIN.phone,
            password: hashedPassword,
            role: ADMIN.role,
            isEmailVerified: true,
        });

        console.log("✅ Admin created successfully!");
        console.log(`   Name  : ${ADMIN.name}`);
        console.log(`   Email : ${ADMIN.email}`);
        console.log(`   Role  : ${ADMIN.role}`);
        console.log(`   Phone : ${ADMIN.phone}`);
        console.log("");
        console.log("⚠️  IMPORTANT: Ab yeh file delete kar do!");
        console.log("   rm scripts/createAdmin.js");

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
};

run();