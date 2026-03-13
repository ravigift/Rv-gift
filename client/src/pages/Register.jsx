import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGift, FaCheckCircle } from "react-icons/fa";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

const Register = () => {
    const navigate = useNavigate();
    const { loginWithData } = useAuth();

    const [step, setStep] = useState("register"); // "register" | "otp"
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [otp, setOtp] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    // Step 1 — Register
    const submitHandler = async (e) => {
        e.preventDefault();
        const { name, email, password } = form;
        if (!name || !email || !password) return setError("All fields are required");
        if (password.length < 6) return setError("Password must be at least 6 characters");

        try {
            setLoading(true);
            setError("");
            await api.post("/auth/register", { name: name.trim(), email: email.trim(), password });
            setStep("otp");
        } catch (err) {
            setError(err?.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    // Step 2 — Verify OTP
    const verifyOtp = async (e) => {
        e.preventDefault();
        if (!otp.trim() || otp.length !== 6) return setError("Enter valid 6-digit OTP");

        try {
            setLoading(true);
            setError("");
            const { data } = await api.post("/auth/verify-otp", { email: form.email.trim(), otp: otp.trim() });
            // Auto login after verification
            loginWithData(data);
            navigate("/", { replace: true });
        } catch (err) {
            setError(err?.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const resendOtp = async () => {
        try {
            setResendLoading(true);
            setError("");
            await api.post("/auth/resend-otp", { email: form.email.trim() });
            setSuccess("OTP resent successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to resend OTP");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-4 bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100 py-10">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
                .auth-font { font-family: 'DM Sans', sans-serif; }
                @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
                .fade-up { animation: fadeUp 0.4s ease forwards; }
                .input-field {
                    width:100%; padding: 12px 12px 12px 40px;
                    border: 1.5px solid #e7e5e4; border-radius: 12px;
                    font-size: 14px; background: #fafaf9;
                    outline: none; transition: all 0.2s;
                    font-family: 'DM Sans', sans-serif;
                }
                .input-field:focus { border-color: #f59e0b; background: white; box-shadow: 0 0 0 3px rgba(245,158,11,0.12); }
                .input-field:hover:not(:focus) { border-color: #d6d3d1; }
                .otp-input {
                    width:100%; padding: 16px;
                    border: 2px solid #e7e5e4; border-radius: 12px;
                    font-size: 28px; font-weight: 900; text-align: center;
                    letter-spacing: 12px; background: #fafaf9;
                    outline: none; transition: all 0.2s;
                    font-family: 'DM Sans', sans-serif;
                }
                .otp-input:focus { border-color: #f59e0b; background: white; box-shadow: 0 0 0 3px rgba(245,158,11,0.12); }
            `}</style>

            <div className="auth-font w-full max-w-md fade-up">
                <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/80 border border-stone-100 overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

                    <div className="p-8">
                        {/* Logo */}
                        <div className="flex justify-center mb-6">
                            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 -rotate-3 hover:rotate-0 transition-transform duration-300">
                                <FaGift size={24} className="text-white" />
                            </div>
                        </div>

                        {step === "register" ? (
                            <>
                                <h1 className="text-2xl font-black text-zinc-900 text-center mb-1">Create Account</h1>
                                <p className="text-center text-sm text-zinc-400 mb-7">Join RV Gifts to start shopping</p>

                                {error && (
                                    <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                                        <span>⚠️</span> {error}
                                    </div>
                                )}

                                <form onSubmit={submitHandler} className="space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 mb-1.5 block uppercase tracking-wide">Full Name</label>
                                        <div className="relative">
                                            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                                            <input name="name" type="text" placeholder="e.g. Rahul Verma"
                                                value={form.name} onChange={onChange} className="input-field" />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 mb-1.5 block uppercase tracking-wide">Email Address</label>
                                        <div className="relative">
                                            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                                            <input name="email" type="email" placeholder="your@email.com"
                                                value={form.email} onChange={onChange} className="input-field" />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 mb-1.5 block uppercase tracking-wide">Password</label>
                                        <div className="relative">
                                            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                                            <input name="password" type={showPassword ? "text" : "password"}
                                                placeholder="Min. 6 characters" value={form.password} onChange={onChange}
                                                style={{ paddingRight: "44px" }} className="input-field" />
                                            <button type="button" onClick={() => setShowPassword(s => !s)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-500 transition-colors p-1">
                                                {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                            </button>
                                        </div>
                                        {form.password.length > 0 && (
                                            <div className="mt-1.5 flex gap-1 items-center">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${form.password.length >= i * 3
                                                            ? form.password.length >= 9 ? "bg-emerald-400"
                                                                : form.password.length >= 6 ? "bg-amber-400"
                                                                    : "bg-red-400"
                                                            : "bg-stone-200"
                                                        }`} />
                                                ))}
                                                <span className="text-[10px] text-zinc-400 ml-1">
                                                    {form.password.length < 6 ? "Weak" : form.password.length < 9 ? "Medium" : "Strong"}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" disabled={loading}
                                        className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-60 shadow-lg shadow-amber-200 flex items-center justify-center gap-2">
                                        {loading ? (
                                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending OTP...</>
                                        ) : "Create Account 🎉"}
                                    </button>
                                </form>

                                <div className="mt-6 pt-6 border-t border-stone-100 text-center">
                                    <p className="text-sm text-zinc-400">
                                        Already have an account?{" "}
                                        <Link to="/login" className="text-amber-600 font-black hover:text-amber-700 transition-colors">Login →</Link>
                                    </p>
                                </div>
                            </>
                        ) : (
                            /* ── OTP Step ── */
                            <>
                                <h1 className="text-2xl font-black text-zinc-900 text-center mb-1">Verify Email</h1>
                                <p className="text-center text-sm text-zinc-400 mb-2">OTP sent to</p>
                                <p className="text-center text-sm font-bold text-amber-600 mb-3">{form.email}</p>
                                <p className="text-center text-xs text-zinc-400 mb-5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                    📬 OTP spam / junk folder mein bhi ho sakta hai — zaroor check karein
                                </p>

                                {error && (
                                    <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                                        <span>⚠️</span> {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                                        <FaCheckCircle /> {success}
                                    </div>
                                )}

                                <form onSubmit={verifyOtp} className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-wide text-center">Enter 6-digit OTP</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                                            placeholder="• • • • • •"
                                            className="otp-input"
                                        />
                                    </div>

                                    <button type="submit" disabled={loading}
                                        className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-60 shadow-lg shadow-amber-200 flex items-center justify-center gap-2">
                                        {loading ? (
                                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                                        ) : <><FaCheckCircle /> Verify & Continue</>}
                                    </button>
                                </form>

                                <div className="mt-5 text-center">
                                    <p className="text-sm text-zinc-400">
                                        Didn't receive OTP?{" "}
                                        <button onClick={resendOtp} disabled={resendLoading}
                                            className="text-amber-600 font-black hover:text-amber-700 transition-colors disabled:opacity-50">
                                            {resendLoading ? "Sending..." : "Resend OTP"}
                                        </button>
                                    </p>
                                </div>

                                <div className="mt-4 text-center">
                                    <button onClick={() => { setStep("register"); setError(""); setOtp(""); }}
                                        className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                                        ← Change email
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-zinc-400 mt-4">🔒 Your data is safe & secure</p>
            </div>
        </div>
    );
};

export default Register;