// components/SecuritySection.jsx
// Works with existing PosSecurity model + walkin routes

import { useState } from "react";
import {
    FaShieldAlt, FaKey, FaEnvelope, FaPaperPlane,
    FaCheckCircle, FaLock, FaRedo,
} from "react-icons/fa";
import api from "../api/adminApi";

/*
  Backend routes used:
  POST /api/walkin/delete-pin/send-otp   → OTP admin email pe jaata hai
  POST /api/walkin/delete-pin/reset      → { otp, newPin } → PIN save hota hai
*/

const STEPS = {
    IDLE: "idle",
    OTP_SENT: "otp_sent",
    SUCCESS: "success",
};

const SecuritySection = () => {
    const [step, setStep] = useState(STEPS.IDLE);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [otp, setOtp] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    const resetState = () => {
        setOtp(""); setNewPin(""); setConfirmPin("");
        setError(""); setInfo(""); setStep(STEPS.IDLE);
    };

    // Step 1 — OTP bhejo
    const handleSendOtp = async () => {
        setSendingOtp(true);
        setError(""); setInfo("");
        try {
            await api.post("/walkin/delete-pin/send-otp");
            setStep(STEPS.OTP_SENT);
            setInfo("OTP admin email pe bhej diya gaya hai ✉️");
        } catch (err) {
            setError(err.response?.data?.message || "OTP send karne mein error aaya");
        } finally {
            setSendingOtp(false);
        }
    };

    // Step 2 — OTP + new PIN verify karke save karo
    const handleSavePin = async () => {
        setError("");

        if (!otp.trim()) return setError("OTP required hai");
        if (newPin.length < 4) return setError("PIN kam se kam 4 digits ka hona chahiye");
        if (newPin !== confirmPin) return setError("PINs match nahi kar rahe");

        setSaving(true);
        try {
            await api.post("/walkin/delete-pin/reset", {
                otp: Number(otp),
                newPin,
            });
            setStep(STEPS.SUCCESS);
        } catch (err) {
            setError(err.response?.data?.message || "PIN reset mein error aaya");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* ── Header ── */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <FaShieldAlt size={16} className="text-violet-600" />
                </div>
                <div>
                    <p className="font-black text-zinc-900 text-base">Security</p>
                    <p className="text-xs text-zinc-400">Bill delete PIN manage karo</p>
                </div>
            </div>

            {/* ── SUCCESS STATE ── */}
            {step === STEPS.SUCCESS && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                    <FaCheckCircle size={28} className="text-emerald-500 mx-auto mb-2" />
                    <p className="font-black text-emerald-700 text-base">PIN successfully set ho gaya!</p>
                    <p className="text-xs text-emerald-600 mt-1 mb-4">
                        Ab bill delete karte waqt yeh naya PIN use karo.
                    </p>
                    <button
                        onClick={resetState}
                        className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition cursor-pointer"
                    >
                        Done
                    </button>
                </div>
            )}

            {/* ── IDLE STATE ── */}
            {step === STEPS.IDLE && (
                <>
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <FaKey size={14} className="text-violet-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-violet-800 mb-0.5">Delete PIN kaise set hota hai?</p>
                                <p className="text-xs text-violet-600 leading-relaxed">
                                    Admin email pe ek OTP bheja jaayega. OTP verify karne ke baad
                                    apna naya PIN set karo. Yeh PIN bill delete karte waqt maanga jaayega.
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 font-semibold mb-3">⚠ {error}</p>
                    )}

                    <button
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white text-sm font-black hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-60 cursor-pointer shadow-md shadow-violet-200"
                    >
                        {sendingOtp ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                OTP bhej rahe hain...
                            </>
                        ) : (
                            <>
                                <FaEnvelope size={13} />
                                OTP Email Bhejo
                            </>
                        )}
                    </button>
                </>
            )}

            {/* ── OTP SENT STATE ── */}
            {step === STEPS.OTP_SENT && (
                <>
                    {info && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                            <FaPaperPlane size={11} className="text-blue-500 shrink-0" />
                            <p className="text-xs font-semibold text-blue-700">{info}</p>
                        </div>
                    )}

                    {/* OTP */}
                    <div className="mb-3">
                        <label className="block text-xs font-bold text-zinc-500 mb-1.5">
                            Email OTP
                        </label>
                        <input
                            type="number"
                            value={otp}
                            onChange={e => { setOtp(e.target.value); setError(""); }}
                            placeholder="6-digit OTP"
                            maxLength={6}
                            className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm font-mono font-bold text-zinc-800 tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* New PIN */}
                    <div className="mb-3">
                        <label className="block text-xs font-bold text-zinc-500 mb-1.5">
                            Naya Delete PIN
                        </label>
                        <div className="relative">
                            <FaLock size={11} className="absolute left-3 top-3.5 text-zinc-400" />
                            <input
                                type="password"
                                value={newPin}
                                onChange={e => { setNewPin(e.target.value); setError(""); }}
                                placeholder="Minimum 4 digits"
                                inputMode="numeric"
                                className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all tracking-widest"
                            />
                        </div>
                    </div>

                    {/* Confirm PIN */}
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-zinc-500 mb-1.5">
                            PIN Confirm Karo
                        </label>
                        <div className="relative">
                            <FaLock size={11} className="absolute left-3 top-3.5 text-zinc-400" />
                            <input
                                type="password"
                                value={confirmPin}
                                onChange={e => { setConfirmPin(e.target.value); setError(""); }}
                                placeholder="Same PIN dobara daalo"
                                inputMode="numeric"
                                className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all tracking-widest"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 font-semibold mb-3">⚠ {error}</p>
                    )}

                    <div className="flex gap-2">
                        {/* Resend OTP */}
                        <button
                            onClick={handleSendOtp}
                            disabled={sendingOtp}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-zinc-500 hover:bg-stone-50 transition cursor-pointer disabled:opacity-50"
                        >
                            <FaRedo size={10} />
                            {sendingOtp ? "..." : "Resend"}
                        </button>

                        {/* Save */}
                        <button
                            onClick={handleSavePin}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-black hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-60 cursor-pointer shadow-md shadow-violet-200"
                        >
                            {saving ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaCheckCircle size={12} />
                                    Set PIN
                                </>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={resetState}
                        className="mt-3 w-full text-xs text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
                    >
                        Cancel
                    </button>
                </>
            )}
        </div>
    );
};

export default SecuritySection;