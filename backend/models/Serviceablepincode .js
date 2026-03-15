// /**
//  * ServiceablePincode Model
//  *
//  * Stores all delivery-serviceable pincodes with COD eligibility.
//  * Admin panel ya seed script se manage karo — code change ki zaroorat nahi.
//  *
//  * Usage:
//  *   import ServiceablePincode from "./models/ServiceablePincode.js";
//  *   const sp = await ServiceablePincode.findOne({ pincode: "224122" });
//  *   if (!sp) → not serviceable
//  *   if (sp.codAllowed) → COD available
//  */

// import mongoose from "mongoose";

// const serviceablePincodeSchema = new mongoose.Schema(
//     {
//         pincode: {
//             type: String,
//             required: true,
//             unique: true,
//             trim: true,
//             index: true,
//             validate: {
//                 validator: (v) => /^\d{6}$/.test(v),
//                 message: "Pincode must be exactly 6 digits",
//             },
//         },
//         city: { type: String, required: true, trim: true },
//         state: { type: String, required: true, trim: true },

//         // Whether COD is allowed for this pincode
//         codAllowed: { type: Boolean, default: true },

//         // Coordinates for distance-based delivery logic
//         lat: { type: Number, default: null },
//         lng: { type: Number, default: null },

//         // Optional: mark inactive without deleting
//         isActive: { type: Boolean, default: true, index: true },

//         // Optional: human note for admin reference
//         note: { type: String, default: "" },
//     },
//     {
//         timestamps: true, // createdAt, updatedAt auto-managed
//     }
// );

// // Compound index: only active pincodes returned in lookups
// serviceablePincodeSchema.index({ pincode: 1, isActive: 1 });

// export default mongoose.model("ServiceablePincode", serviceablePincodeSchema);