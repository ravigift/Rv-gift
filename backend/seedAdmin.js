/**
 * seedAdmin.js
 * Run: node seedAdmin.js
 * Seeds the admin/owner account into MongoDB with a hashed password.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

const ADMIN_EMAIL = "officialrvgift@gmail.com";
const ADMIN_PASSWORD = "RVGifts@2026";
const ADMIN_NAME = "RV Gift Admin";
const ADMIN_ROLE = "owner"; // owner = full access

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected");

        // Check if already exists
        const existing = await User.findOne({ email: ADMIN_EMAIL });

        if (existing) {
            // Update role and password if account exists
            const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
            existing.password = hashed;
            existing.role = ADMIN_ROLE;
            existing.isEmailVerified = true;
            await existing.save();
            console.log(`✅ Admin account UPDATED — ${ADMIN_EMAIL} (role: ${ADMIN_ROLE})`);
        } else {
            // Create fresh account
            const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
            await User.create({
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                password: hashed,
                role: ADMIN_ROLE,
                isEmailVerified: true,
            });
            console.log(`✅ Admin account CREATED — ${ADMIN_EMAIL} (role: ${ADMIN_ROLE})`);
        }

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`  Email    : ${ADMIN_EMAIL}`);
        console.log(`  Password : ${ADMIN_PASSWORD}`);
        console.log(`  Role     : ${ADMIN_ROLE}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Seed failed:", err.message);
        process.exit(1);
    }
};

seed();
