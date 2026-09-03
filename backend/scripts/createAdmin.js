/**
 * createAdmin.js — one-time bootstrap for the first owner account.
 *
 * Credentials are read from environment variables — NEVER hard-code them here.
 *
 *   ADMIN_NAME="Ravi Verma" \
 *   ADMIN_BOOTSTRAP_EMAIL="owner@example.com" \
 *   ADMIN_BOOTSTRAP_PHONE="9999999999" \
 *   ADMIN_BOOTSTRAP_PASSWORD="a-long-random-password" \
 *   node scripts/createAdmin.js
 *
 * If the account already exists this script does nothing. To change an
 * existing password use the in-app "Forgot Password" (admin) flow.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const {
    ADMIN_NAME = "Owner",
    ADMIN_BOOTSTRAP_EMAIL,
    ADMIN_BOOTSTRAP_PHONE,
    ADMIN_BOOTSTRAP_PASSWORD,
    MONGO_URI,
} = process.env;

const fail = (msg) => {
    console.error(`❌ ${msg}`);
    process.exit(1);
};

const run = async () => {
    if (!MONGO_URI) fail("MONGO_URI is not set");
    if (!ADMIN_BOOTSTRAP_EMAIL || !ADMIN_BOOTSTRAP_PHONE || !ADMIN_BOOTSTRAP_PASSWORD)
        fail("Set ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_PHONE and ADMIN_BOOTSTRAP_PASSWORD env vars");
    if (ADMIN_BOOTSTRAP_PASSWORD.length < 12)
        fail("ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters");
    if (!/^[6-9]\d{9}$/.test(ADMIN_BOOTSTRAP_PHONE))
        fail("ADMIN_BOOTSTRAP_PHONE must be a valid 10-digit Indian mobile number");

    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const { default: User } = await import("../models/User.js");

        const email = ADMIN_BOOTSTRAP_EMAIL.toLowerCase().trim();
        const existing = await User.findOne({ email });
        if (existing) {
            console.log(`⚠️  Account already exists: ${existing.email} (role: ${existing.role})`);
            console.log("   Use the admin 'Forgot Password' flow to reset its password.");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(ADMIN_BOOTSTRAP_PASSWORD, 12);

        await User.create({
            name: ADMIN_NAME.trim(),
            email,
            phone: ADMIN_BOOTSTRAP_PHONE.trim(),
            password: hashedPassword,
            role: "owner",
            isEmailVerified: true,
        });

        console.log(`✅ Owner account created: ${email}`);
        process.exit(0);
    } catch (err) {
        fail(err.message);
    }
};

run();
