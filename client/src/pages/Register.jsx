import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaPhone, FaArrowLeft, FaShieldAlt } from "react-icons/fa";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../assets/logo.png.jpeg";

const Register = () => {
    const navigate = useNavigate();
    const { loginWithData } = useAuth();

    const [step, setStep] = useState("register"); // "register" | "otp"
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
    const [otp, setOtp] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Resend Timer countdown
    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(t => t - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const onChange = (e) => {
        const { name, value } = e.target;
        if (name === "phone" && !/^\d*$/.test(value)) return;
        setForm({ ...form, [name]: value });
        setError("");
    };

    // ── Step 1: Register ────────────────────────────────────
    const submitHandler = async (e) => {
        e.preventDefault();
        const { name, email, phone, password } = form;

        if (!name.trim() || !email.trim() || !phone.trim() || !password)
            return setError("All fields are required");

        if (!/^[6-9]\d{9}$/.test(phone.trim()))
            return setError("Enter a valid 10-digit Indian mobile number");

        if (password.length < 8)
            return setError("Password must be at least 8 characters");

        try {
            setLoading(true);
            setError("");
            await api.post("/auth/register", {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password,
            });
            setStep("otp");
            setResendTimer(30);
        } catch (err) {
            setError(err?.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP ──────────────────────────────────
    const verifyOtp = async (e) => {
        e.preventDefault();
        if (!otp.trim() || otp.length !== 6) return setError("Please enter the complete 6-digit OTP");
        try {
            setLoading(true);
            setError("");
            const { data } = await api.post("/auth/verify-otp", {
                email: form.email.trim(),
                otp: otp.trim(),
            });
            loginWithData(data);
            navigate("/", { replace: true });
        } catch (err) {
            setError(err?.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    // ── Resend OTP ──────────────────────────────────────────
    const resendOtp = async () => {
        if (resendTimer > 0 || resendLoading) return;
        try {
            setResendLoading(true);
            setError("");
            await api.post("/auth/resend-otp", { email: form.email.trim() });
            setSuccess("A fresh OTP has been sent to your email!");
            setResendTimer(30);
            setTimeout(() => setSuccess(""), 4000);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to resend OTP");
        } finally {
            setResendLoading(false);
        }
    };

    // ── Password strength ────────────────────────────────────
    const passwordStrength = form.password.length === 0 ? null
        : form.password.length < 8 ? "weak"
            : form.password.length < 12 ? "medium"
                : "strong";

    const strengthColor = { weak: "bg-red-400", medium: "bg-amber-400", strong: "bg-emerald-400" };
    const strengthLabel = { weak: "Too short", medium: "Medium", strong: "Strong" };
    const strengthText = { weak: "text-red-400", medium: "text-amber-500", strong: "text-emerald-500" };

    const passwordInvalid = form.password.length > 0 && form.password.length < 8;

    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-stone-100 via-amber-50/20 to-stone-100">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                .auth-font { font-family: 'DM Sans', sans-serif; }
                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                .fade-up { animation: fadeUp 0.35s ease forwards; }
                .input-wrap { position: relative; }
                .input-field {
                    width: 100%; padding: 12px 14px 12px 42px;
                    border: 1.5px solid #e7e5e4; border-radius: 14px;
                    font-size: 14px; background: #fafaf9;
                    outline: none; transition: all 0.2s;
                    font-family: 'DM Sans', sans-serif; color: #18181b;
                    box-sizing: border-box;
                }
                .input-field:focus {
                    border-color: #f59e0b; background: #fff;
                    box-shadow: 0 0 0 4px rgba(245,158,11,0.12);
                }
                .input-field:hover:not(:focus) { border-color: #d6d3d1; }
                .input-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#a8a29e; pointer-events:none; }
                .phone-prefix {
                    position:absolute; left:40px; top:50%; transform:translateY(-50%);
                    font-size:13px; font-weight:800; color:#78716c; pointer-events:none;
                }
                .input-field-phone { padding-left: 70px !important; }
                .otp-input {
                    width:100%; padding: 14px;
                    border: 2px solid #e7e5e4; border-radius: 16px;
                    font-size: 26px; font-weight: 900; text-align: center;
                    letter-spacing: 10px; background: #fafaf9;
                    outline: none; transition: all 0.2s;
                    font-family: 'DM Sans', sans-serif; box-sizing: border-box;
                    color: #18181b;
                }
                .otp-input:focus {
                    border-color: #f59e0b; background: white;
                    box-shadow: 0 0 0 4px rgba(245,158,11,0.15);
                }
            `}</style>

            {/* Back to Home Button */}
            <div className="w-full max-w-md mb-4 flex items-center justify-start px-1">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                    <FaArrowLeft size={11} /> Back to Store
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

                        {step === "register" ? (
                            <>
                                <h1 className="text-2xl font-black text-zinc-900 text-center mb-1">
                                    Create Account
                                </h1>
                                <p className="text-center text-xs sm:text-sm text-zinc-400 mb-6 font-medium">
                                    Join RV Gifts to explore customized gifts & rewards
                                </p>

                                {error && (
                                    <div className="mb-5 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl flex items-start gap-2.5 leading-snug">
                                        <span className="shrink-0 mt-0.5">⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={submitHandler} className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="text-[11px] font-black text-zinc-400 mb-1.5 block uppercase tracking-wider">
                                            Full Name
                                        </label>
                                        <div className="input-wrap">
                                            <FaUser className="input-icon" size={13} />
                                            <input
                                                name="name"
                                                type="text"
                                                placeholder=""
                                                value={form.name}
                                                onChange={onChange}
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="text-[11px] font-black text-zinc-400 mb-1.5 block uppercase tracking-wider">
                                            Email Address
                                        </label>
                                        <div className="input-wrap">
                                            <FaEnvelope className="input-icon" size={13} />
                                            <input
                                                name="email"
                                                type="email"
                                                placeholder=""
                                                value={form.email}
                                                onChange={onChange}
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="text-[11px] font-black text-zinc-400 mb-1.5 block uppercase tracking-wider">
                                            Mobile Number <span className="text-amber-500 font-bold">*</span>
                                        </label>
                                        <div className="input-wrap">
                                            <FaPhone className="input-icon" size={13} />
                                            <span className="phone-prefix">+91</span>
                                            <input
                                                name="phone"
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={10}
                                                placeholder=""
                                                value={form.phone}
                                                onChange={onChange}
                                                className="input-field input-field-phone"
                                                required
                                            />
                                        </div>
                                        {form.phone.length > 0 && form.phone.length < 10 && (
                                            <p className="text-[11px] text-amber-600 mt-1 font-medium">{10 - form.phone.length} more digits needed</p>
                                        )}
                                        {form.phone.length === 10 && /^[6-9]\d{9}$/.test(form.phone) && (
                                            <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                                                <FaCheckCircle size={10} /> Valid mobile number
                                            </p>
                                        )}
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="text-[11px] font-black text-zinc-400 mb-1.5 block uppercase tracking-wider">
                                            Password
                                        </label>
                                        <div className="input-wrap">
                                            <FaLock className="input-icon" size={13} />
                                            <input
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder=""
                                                value={form.password}
                                                onChange={onChange}
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

                                        {/* Strength meter */}
                                        {passwordStrength && (
                                            <div className="mt-1.5 flex gap-1 items-center">
                                                {[1, 2, 3].map(i => (
                                                    <div
                                                        key={i}
                                                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${(passwordStrength === "weak" && i === 1) ||
                                                            (passwordStrength === "medium" && i <= 2) ||
                                                            (passwordStrength === "strong")
                                                            ? strengthColor[passwordStrength]
                                                            : "bg-stone-200"
                                                        }`}
                                                    />
                                                ))}
                                                <span className={`text-[10px] ml-1 font-bold ${strengthText[passwordStrength]}`}>
                                                    {strengthLabel[passwordStrength]}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || passwordInvalid}
                                        className="w-full mt-3 py-3.5 rounded-2xl font-black text-sm text-zinc-950 transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-200/80 hover:shadow-amber-300"
                                        style={{
                                            background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
                                        }}
                                    >
                                        {loading ? (
                                            <><span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" /> Creating Account...</>
                                        ) : "Create Account →"}
                                    </button>
                                </form>

                                <div className="mt-5 pt-5 border-t border-stone-100 text-center">
                                    <p className="text-xs sm:text-sm text-zinc-500">
                                        Already have an account?{" "}
                                        <Link
                                            to="/login"
                                            className="text-amber-600 font-black hover:text-amber-700 transition-colors inline-block"
                                        >
                                            Login
                                        </Link>
                                    </p>
                                </div>
                            </>
                        ) : (
                            /* ── OTP Verification Step ── */
                            <>
                                <h1 className="text-2xl font-black text-zinc-900 text-center mb-1">
                                    Verify Email OTP
                                </h1>
                                <p className="text-center text-xs sm:text-sm text-zinc-400 mb-1">
                                    We sent a 6-digit verification code to
                                </p>
                                <p className="text-center text-xs sm:text-sm font-bold text-amber-600 mb-3">
                                    {form.email}
                                </p>
                                <p className="text-center text-xs text-zinc-500 mb-5 bg-amber-50/80 border border-amber-200/80 rounded-2xl px-3.5 py-2.5">
                                    📬 Please check your Inbox and Spam/Junk folder
                                </p>

                                {error && (
                                    <div className="mb-5 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl flex items-start gap-2.5">
                                        <span className="shrink-0 mt-0.5">⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                )}
                                {success && (
                                    <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm px-4 py-3 rounded-2xl flex items-center gap-2 font-medium">
                                        <FaCheckCircle className="text-emerald-500 shrink-0" /> {success}
                                    </div>
                                )}

                                <form onSubmit={verifyOtp} className="space-y-5">
                                    <div>
                                        <label className="text-[11px] font-black text-zinc-400 mb-2 block uppercase tracking-wider text-center">
                                            Enter 6-Digit Code
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                                            placeholder="• • • • • •"
                                            className="otp-input"
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || otp.length !== 6}
                                        className="w-full py-3.5 rounded-2xl font-black text-sm text-zinc-950 transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
                                        style={{
                                            background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
                                        }}
                                    >
                                        {loading ? (
                                            <><span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" /> Verifying...</>
                                        ) : <><FaCheckCircle /> Verify & Continue</>}
                                    </button>
                                </form>

                                <div className="mt-5 text-center space-y-2">
                                    <p className="text-xs sm:text-sm text-zinc-500">
                                        Didn't receive the OTP?{" "}
                                        {resendTimer > 0 ? (
                                            <span className="text-zinc-400 font-bold ml-1">
                                                Resend in {resendTimer}s
                                            </span>
                                        ) : (
                                            <button
                                                onClick={resendOtp}
                                                disabled={resendLoading}
                                                className="text-amber-600 font-black hover:text-amber-700 transition-colors disabled:opacity-50 cursor-pointer"
                                            >
                                                {resendLoading ? "Sending..." : "Resend OTP"}
                                            </button>
                                        )}
                                    </p>
                                    <div>
                                        <button
                                            onClick={() => { setStep("register"); setError(""); setOtp(""); }}
                                            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer font-bold"
                                        >
                                            ← Change details
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-center text-xs text-zinc-400 mt-5">
                    <FaShieldAlt size={12} className="text-emerald-500" />
                    <span>256-Bit SSL Encrypted & 100% Safe Checkout</span>
                </div>
            </div>
        </div>
    );
};

export default Register;