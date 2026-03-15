// /**
//  * scripts/seedPincodes.js
//  *
//  * Ek baar run karo: node scripts/seedPincodes.js
//  * Ye script ServiceablePincode collection mein initial data insert karta hai.
//  * Existing entries ko overwrite nahi karta (upsert with $setOnInsert).
//  *
//  * Baad mein naye pincodes add karne ke liye:
//  *   - Is array mein add karo aur dobara run karo, OR
//  *   - Admin panel se directly DB mein add karo
//  */

// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import ServiceablePincode from "../models/ServiceablePincode.js";

// dotenv.config();

// // ─────────────────────────────────────────────────────────────
// // Apne area ke pincodes yahan add karo
// // codAllowed: true  → COD available
// // codAllowed: false → Only online payment (door ke areas)
// // ─────────────────────────────────────────────────────────────
// const PINCODES = [
//     // Akbarpur (shop ka area) — COD available
//     { pincode: "224122", city: "Akbarpur", state: "Uttar Pradesh", codAllowed: true, lat: 26.4279, lng: 82.5363 },
//     { pincode: "224123", city: "Akbarpur", state: "Uttar Pradesh", codAllowed: true, lat: 26.4279, lng: 82.5363 },
//     { pincode: "224120", city: "Akbarpur", state: "Uttar Pradesh", codAllowed: true, lat: 26.4279, lng: 82.5363 },

//     // Ambedkar Nagar nearby — COD available
//     { pincode: "224121", city: "Ambedkar Nagar", state: "Uttar Pradesh", codAllowed: true, lat: 26.4500, lng: 82.5200 },
//     { pincode: "224125", city: "Ambedkar Nagar", state: "Uttar Pradesh", codAllowed: true, lat: 26.4500, lng: 82.5200 },
//     { pincode: "224126", city: "Ambedkar Nagar", state: "Uttar Pradesh", codAllowed: true, lat: 26.4100, lng: 82.4800 },
//     { pincode: "224127", city: "Ambedkar Nagar", state: "Uttar Pradesh", codAllowed: true, lat: 26.3900, lng: 82.5500 },
//     { pincode: "224128", city: "Ambedkar Nagar", state: "Uttar Pradesh", codAllowed: true, lat: 26.3700, lng: 82.5100 },
//     { pincode: "224129", city: "Ambedkar Nagar", state: "Uttar Pradesh", codAllowed: true, lat: 26.4800, lng: 82.4600 },

//     // Faizabad / Ayodhya — Online only (door hai)
//     { pincode: "224001", city: "Ayodhya", state: "Uttar Pradesh", codAllowed: false, lat: 26.7922, lng: 82.1998 },
//     { pincode: "224002", city: "Ayodhya", state: "Uttar Pradesh", codAllowed: false, lat: 26.7922, lng: 82.1998 },

//     // Sultanpur — Online only
//     { pincode: "228001", city: "Sultanpur", state: "Uttar Pradesh", codAllowed: false, lat: 26.2648, lng: 82.0727 },

//     // Lucknow — Online only
//     { pincode: "226001", city: "Lucknow", state: "Uttar Pradesh", codAllowed: false, lat: 26.8467, lng: 80.9462 },
//     { pincode: "226010", city: "Lucknow", state: "Uttar Pradesh", codAllowed: false, lat: 26.8467, lng: 80.9462 },

//     // Pan-India major cities — Online only
//     { pincode: "110001", city: "New Delhi", state: "Delhi", codAllowed: false, lat: 28.6139, lng: 77.2090 },
//     { pincode: "400001", city: "Mumbai", state: "Maharashtra", codAllowed: false, lat: 18.9388, lng: 72.8354 },
//     { pincode: "700001", city: "Kolkata", state: "West Bengal", codAllowed: false, lat: 22.5726, lng: 88.3639 },
//     { pincode: "600001", city: "Chennai", state: "Tamil Nadu", codAllowed: false, lat: 13.0827, lng: 80.2707 },
//     { pincode: "500001", city: "Hyderabad", state: "Telangana", codAllowed: false, lat: 17.3850, lng: 78.4867 },
//     { pincode: "560001", city: "Bangalore", state: "Karnataka", codAllowed: false, lat: 12.9716, lng: 77.5946 },
// ];

// const seed = async () => {
//     try {
//         await mongoose.connect(process.env.MONGO_URI);
//         console.log("✅ MongoDB connected");

//         let inserted = 0;
//         let skipped = 0;

//         for (const entry of PINCODES) {
//             const result = await ServiceablePincode.updateOne(
//                 { pincode: entry.pincode },
//                 { $setOnInsert: entry },  // Only insert if not exists — never overwrite
//                 { upsert: true }
//             );
//             if (result.upsertedCount > 0) {
//                 inserted++;
//                 console.log(`  ➕ Inserted: ${entry.pincode} — ${entry.city}`);
//             } else {
//                 skipped++;
//                 console.log(`  ⏭️  Skipped (exists): ${entry.pincode} — ${entry.city}`);
//             }
//         }

//         console.log(`\n📊 Done — ${inserted} inserted, ${skipped} skipped`);
//     } catch (err) {
//         console.error("❌ Seed failed:", err.message);
//         process.exit(1);
//     } finally {
//         await mongoose.disconnect();
//         console.log("🔌 MongoDB disconnected");
//     }
// };

// seed();