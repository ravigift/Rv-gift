import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaArrowLeft, FaShieldAlt } from "react-icons/fa";
import api from "../api/axios";
import Logo from "../assets/logo.png.jpeg";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return setError("Please enter your email address");

        try {
            setLoading(true);
            setError("");
            await api.post("/auth/forgot-password", { email: email.trim() });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-stone-100 via-amber-50/20 to-stone-100">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                .auth-font { font-family: 'DM Sans', sans-serif; }
                @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                .fade-up { animation: fadeUp 0.35s ease forwards; }
                .input-field {
                    width: 100%; padding: 13px 14px 13px 42px;
                    border: 1.5px solid #e7e5e4; border-radius: 14px;
                    font-size: 14px; background: #fafaf9;
                    outline: none; transition: all 0.2s;
                    font-family: 'DM Sans', sans-serif; color: #18181b;
                    box-sizing: border-box;
                }
                .input-field:focus {
                    border-color: #f59e0b; background: #ffffff;
                    box-shadow: 0 0 0 4px rgba(245,158,11,0.12);
                }
                .input-field:hover:not(:focus) { border-color: #d6d3d1; }
            `}</style>

            {/* Back Link */}
            <div className="w-full max-w-md mb-4 flex items-center justify-start px-1">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                    <FaArrowLeft size={11} /> Back to Login
                </Link>
            </div>

            <div className="auth-font w-full max-w-md fade-up">
                <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/70 border border-stone-200/70 overflow-hidden">
                    {/* Top gradient accent line */}
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400" />

                    <div className="p-7 sm:p-9">
                        {/* Brand Logo Header */}
                        <div className="flex items-center justify-center mb-6">
                            <Link to="/" className="group flex flex-col sm:flex-row items-center gap-3 transition-transform duration-200 hover:scale-105" title="Go to RV Gifts Store">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-400 p-2 shadow-lg shadow-amber-300/40 flex items-center justify-center">
                                    <img
                                        src={Logo}
                                        alt="RV Gifts"
                                        className="w-full h-full object-contain rounded-xl"
                                    />
                                </div>
                                <div className="text-center sm:text-left">
                                    <span className="font-black text-2xl text-zinc-900 tracking-tight leading-none block">
                                        RV<span className="text-amber-500">Gifts</span>
                                    </span>
                                    <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mt-1 block">
                                        Custom Printing & Gifts
                                    </span>
                                </div>
                            </Link>
                        </div>

                        {!success ? (
                            <>
                                <h1 className="text-2xl font-black text-zinc-900 text-center mb-1">
                                    Forgot Password?
                                </h1>
                                <p className="text-center text-xs sm:text-sm text-zinc-400 mb-6 font-medium">
                                    Enter your registered email and we'll send you a password reset link
                                </p>

                                {error && (
                                    <div className="mb-5 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl flex items-start gap-2.5 leading-snug">
                                        <span className="shrink-0 mt-0.5">⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-[11px] font-black text-zinc-400 mb-1.5 block uppercase tracking-wider">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                                placeholder=""
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full mt-2 py-3.5 rounded-2xl font-black text-sm text-zinc-950 transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-amber-200/80 hover:shadow-amber-300"
                                        style={{
                                            background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
                                        }}
                                    >
                                        {loading ? (
                                            <><span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" /> Sending link...</>
                                        ) : "Send Reset Link →"}
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* ── Success State ── */
                            <div className="text-center py-2">
                                <div className="w-16 h-16 bg-emerald-100/70 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    📬
                                </div>
                                <h2 className="text-xl font-black text-zinc-900 mb-1.5">
                                    Check Your Email
                                </h2>
                                <p className="text-xs sm:text-sm text-zinc-500 mb-2">
                                    We've sent a password reset link to
                                </p>
                                <p className="text-sm font-bold text-amber-600 mb-4 bg-amber-50 py-1 px-3 rounded-xl inline-block">
                                    {email}
                                </p>
                                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                                    The link will expire in 15 minutes. If you don't see it, please check your Spam / Junk folder.
                                </p>
                                <button
                                    onClick={() => { setSuccess(false); setEmail(""); }}
                                    className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
                                >
                                    Try a different email address
                                </button>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-stone-100 text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-xs sm:text-sm text-zinc-500 hover:text-zinc-900 transition-colors font-bold"
                            >
                                <FaArrowLeft size={10} /> Back to Login
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-center text-xs text-zinc-400 mt-5">
                    <FaShieldAlt size={12} className="text-emerald-500" />
                    <span>256-Bit SSL Encrypted & 100% Safe Recovery</span>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;