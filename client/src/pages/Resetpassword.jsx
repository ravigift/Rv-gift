import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaArrowLeft, FaShieldAlt } from "react-icons/fa";
import api from "../api/axios";
import Logo from "../assets/logo.png.jpeg";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password.trim()) return setError("Please enter a new password");
        if (password.length < 8) return setError("Password must be at least 8 characters");
        if (password !== confirmPassword) return setError("Passwords do not match");

        try {
            setLoading(true);
            setError("");
            await api.post(`/auth/reset-password/${token}`, { password });
            setSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired reset link");
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
                                    Set New Password
                                </h1>
                                <p className="text-center text-xs sm:text-sm text-zinc-400 mb-6 font-medium">
                                    Choose a secure password for your account
                                </p>

                                {error && (
                                    <div className="mb-5 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl flex items-start gap-2.5 leading-snug">
                                        <span className="shrink-0 mt-0.5">⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* New Password */}
                                    <div>
                                        <label className="text-[11px] font-black text-zinc-400 mb-1.5 block uppercase tracking-wider">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                                placeholder=""
                                                style={{ paddingRight: "44px" }}
                                                className="input-field"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(s => !s)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-600 transition-colors p-1 cursor-pointer"
                                                aria-label="Toggle password visibility"
                                            >
                                                {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="text-[11px] font-black text-zinc-400 mb-1.5 block uppercase tracking-wider">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                                            <input
                                                type={showConfirm ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                                                placeholder=""
                                                style={{ paddingRight: "44px" }}
                                                className="input-field"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(s => !s)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-600 transition-colors p-1 cursor-pointer"
                                                aria-label="Toggle password visibility"
                                            >
                                                {showConfirm ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                            </button>
                                        </div>

                                        {confirmPassword && (
                                            <p className={`text-xs mt-1.5 flex items-center gap-1 ${password === confirmPassword ? "text-emerald-600" : "text-red-500"}`}>
                                                {password === confirmPassword
                                                    ? <><FaCheckCircle size={10} /> Passwords match</>
                                                    : "⚠️ Passwords do not match"
                                                }
                                            </p>
                                        )}
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
                                            <><span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" /> Updating password...</>
                                        ) : "Update Password →"}
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* ── Success State ── */
                            <div className="text-center py-2">
                                <div className="w-16 h-16 bg-emerald-100/70 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    ✅
                                </div>
                                <h2 className="text-xl font-black text-zinc-900 mb-1.5">
                                    Password Reset Successful!
                                </h2>
                                <p className="text-xs sm:text-sm text-zinc-500 mb-4">
                                    Your password has been changed. Redirecting to login page...
                                </p>
                                <button
                                    onClick={() => navigate("/login")}
                                    className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 transition-colors"
                                >
                                    Login Now
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

export default ResetPassword;