// models/posSecurityModel.js
import mongoose from "mongoose";

const posSecuritySchema = new mongoose.Schema({
    deletePin: {
        type: String,
        default: "",   // required hata diya — pehli baar blank rahega
    },
    resetOtp: Number,
    resetOtpExpire: Date,
});

export default mongoose.model("PosSecurity", posSecuritySchema);