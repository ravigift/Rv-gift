import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGift, FaCheckCircle, FaPhone } from "react-icons/fa";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

const Register = () => {
    const navigate = useNavigate();
    const { loginWithData } = useAuth();

    const [step, setStep] = useState("register"); // "register" | "otp"
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
    const [otp, setOtp] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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

        if (!name || !email || !phone || !password)
            return setError("All fields are required");

        if (!/^[6-9]\d{9}$/.test(phone))
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
        } catch (err) {
            setError(err?.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP ──────────────────────────────────
    const verifyOtp = async (e) => {
        e.preventDefault();
        if (!otp.trim() || otp.length !== 6) return setError("Enter valid 6-digit OTP");
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

    // ── Password strength ────────────────────────────────────
    // weak   = < 8  (invalid — button disabled)
    // medium = 8–11
    // strong = 12+
    const passwordStrength = form.password.length === 0 ? null
        : form.password.length < 8 ? "weak"
            : form.password.length < 12 ? "medium"
                : "strong";

    const strengthColor = { weak: "bg-red-400", medium: "bg-amber-400", strong: "bg-emerald-400" };
    const strengthLabel = { weak: "Too short", medium: "Medium", strong: "Strong" };
    const strengthText = { weak: "text-red-400", medium: "text-amber-500", strong: "text-emerald-500" };

    const passwordInvalid = form.password.length > 0 && form.password.length < 8;

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-4 py-10"
            style={{ background: "linear-gradient(135deg, #f8f7f5 0%, #fffbeb 50%, #f8f7f5 100%)" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                .auth-font { font-family: 'DM Sans', sans-serif; }
                @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                @keyframes shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
                .fade-up { animation: fadeUp 0.4s ease forwards; }
                .shake   { animation: shake 0.35s ease; }
                .input-wrap { position: relative; }
                .input-field {
                    width: 100%; padding: 11px 12px 11px 40px;
                    border: 1.5px solid #e7e5e4; border-radius: 12px;
                    font-size: 14px; background: #fafaf9;
                    outline: none; transition: all 0.2s;
                    font-family: 'DM Sans', sans-serif; color: #18181b;
                    box-sizing: border-box;
                }
                .input-field:focus { border-color: #f59e0b; background: #fff; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
                .input-field:hover:not(:focus) { border-color: #d6d3d1; }
                .input-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#a8a29e; pointer-events:none; }
                .phone-prefix {
                    position:absolute; left:38px; top:50%; transform:translateY(-50%);
                    font-size:13px; font-weight:700; color:#78716c; pointer-events:none;
                }
                .input-field-phone { padding-left: 68px !important; }
                .otp-input {
                    width:100%; padding:16px;
                    border:2px solid #e7e5e4; border-radius:12px;
                    font-size:28px; font-weight:900; text-align:center;
                    letter-spacing:12px; background:#fafaf9;
                    outline:none; transition:all 0.2s;
                    font-family:'DM Sans',sans-serif; box-sizing:border-box;
                }
                .otp-input:focus { border-color:#f59e0b; background:white; box-shadow:0 0 0 3px rgba(245,158,11,0.12); }
                .submit-btn {
                    width:100%; padding:14px;
                    border-radius:12px; font-weight:900; font-size:14px;
                    color:#111; border:none; cursor:pointer;
                    background:linear-gradient(135deg,#f59e0b,#fbbf24);
                    box-shadow:0 6px 20px rgba(245,158,11,0.35);
                    transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px;
                }
                .submit-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 10px 28px rgba(245,158,11,0.45); }
                .submit-btn:active:not(:disabled) { transform:scale(0.98); }
                .submit-btn:disabled { opacity:0.6; cursor:not-allowed; }
            `}</style>

            <div className="auth-font w-full max-w-md fade-up">
                <div className="bg-white rounded-3xl shadow-2xl shadow-stone-200/60 border border-stone-100 overflow-hidden">

                    {/* Top accent bar */}
                    <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />

                    <div className="p-7">

                        {/* Icon */}
                        <div className="flex justify-center mb-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 -rotate-3 hover:rotate-0 transition-transform duration-300 cursor-default"
                                style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)" }}>
                                <FaGift size={24} className="text-white" />
                            </div>
                        </div>

                        {step === "register" ? (
                            <>
                                <h1 className="text-2xl font-black text-zinc-900 text-center mb-1">Create Account</h1>
                                <p className="text-center text-sm text-zinc-400 mb-6">Join RV Gifts to start shopping</p>

                                {error && (
                                    <div className="shake mb-5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                                        <span className="mt-0.5">⚠️</span> <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={submitHandler} className="space-y-4">

                                    {/* Name */}
                                    <div>
                                        <label className="text-[11px] font-black text-zinc-400 mb-1.5 block uppercase tracking-wider">Full Name</label>
                                        <div className="input-wrap">
                                            <FaUser className="input-icon" size={12} />
                                            <input name="name" type="text" placeholder="e.g. Rahul Verma"
                                                value={form.name} onChange={onChange} className="input-field" />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="text-[11px] font-black text-zinc-400 mb-1.5 block uppercase tracking-wider">Email Address</label>
                                        <div className="input-wrap">
                                            <FaEnvelope className="input-icon" size={12} />
                                            <input name="email" type="email" placeholder="your@email.com"
                                                value={form.email} onChange={onChange} className="input-field" />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="text-[11px] font-black text-zinc-400 mb-1.5 block uppercase tracking-wider">
                                            Mobile Number <span className="text-red-400 normal-case font-bold tracking-normal">*</span>
                                        </label>
                                        <div className="input-wrap">
                                            <FaPhone className="input-icon" size={12} />
                                            <span className="phone-prefix">+91</span>
                                            <input
                                                name="phone" type="tel" inputMode="numeric"
                                                maxLength={10} placeholder="9876543210"
                                                value={form.phone} onChange={onChange}
                                                className="input-field input-field-phone"
                                            />
                                        </div>
                                        {form.phone.length > 0 && form.phone.length < 10 && (
                                            <p className="text-[11px] text-amber-600 mt-1 font-medium">{10 - form.phone.length} more digits needed</p>
                                        )}
                                        {form.phone.length === 10 && !/^[6-9]\d{9}$/.test(form.phone) && (
                                            <p className="text-[11px] text-red-500 mt-1 font-medium">Must start with 6, 7, 8 or 9</p>
                                        )}
                                        {form.phone.length === 10 && /^[6-9]\d{9}$/.test(form.phone) && (
                                            <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                                                <FaCheckCircle size={9} /> Valid number
                                            </p>
                                        )}
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="text-[11px] font-black text-zinc-400 mb-1.5 block uppercase tracking-wider">Password</label>
                                        <div className="input-wrap">
                                            <FaLock className="input-icon" size={12} />
                                            <input
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Min. 8 characters"
                                                value={form.password}
                                                onChange={onChange}
                                                style={{ paddingRight: "44px" }}
                                                className="input-field"
                                            />
                                            <button type="button" onClick={() => setShowPassword(s => !s)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-500 transition-colors p-1 cursor-pointer">
                                                {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                                            </button>
                                        </div>

                                        {/* Strength meter */}
                                        {passwordStrength && (
                                            <div className="mt-1.5 flex gap-1 items-center">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${(passwordStrength === "weak" && i === 1) ||
                                                            (passwordStrength === "medium" && i <= 2) ||
                                                            (passwordStrength === "strong")
                                                            ? strengthColor[passwordStrength]
                                                            : "bg-stone-200"
                                                        }`} />
                                                ))}
                                                <span className={`text-[10px] ml-1 font-bold ${strengthText[passwordStrength]}`}>
                                                    {strengthLabel[passwordStrength]}
                                                </span>
                                            </div>
                                        )}

                                        {/* Inline hint when too short */}
                                        {passwordInvalid && (
                                            <p className="text-[11px] text-red-500 mt-1 font-medium">
                                                {8 - form.password.length} more character{8 - form.password.length > 1 ? "s" : ""} needed
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || passwordInvalid}
                                        className="submit-btn mt-2"
                                    >
                                        {loading ? (
                                            <><span className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" /> Sending OTP...</>
                                        ) : "Create Account 🎉"}
                                    </button>
                                </form>

                                <div className="mt-5 pt-5 border-t border-stone-100 text-center">
                                    <p className="text-sm text-zinc-400">
                                        Already have an account?{" "}
                                        <Link to="/login" className="text-amber-600 font-black hover:text-amber-700 transition-colors cursor-pointer">
                                            Login →
                                        </Link>
                                    </p>
                                </div>
                            </>
                        ) : (
                            /* ── OTP Step ── */
                            <>
                                <h1 className="text-2xl font-black text-zinc-900 text-center mb-1">Verify Email</h1>
                                <p className="text-center text-sm text-zinc-400 mb-1">OTP sent to</p>
                                <p className="text-center text-sm font-bold text-amber-600 mb-3">{form.email}</p>
                                <p className="text-center text-xs text-zinc-400 mb-5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                                    📬 OTP spam / junk folder mein bhi ho sakta hai — zaroor check karein
                                </p>

                                {error && (
                                    <div className="shake mb-5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
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
                                        <label className="text-[11px] font-black text-zinc-400 mb-2 block uppercase tracking-wider text-center">
                                            Enter 6-digit OTP
                                        </label>
                                        <input
                                            type="text" inputMode="numeric" maxLength={6}
                                            value={otp}
                                            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                                            placeholder="• • • • • •"
                                            className="otp-input"
                                        />
                                    </div>
                                    <button type="submit" disabled={loading} className="submit-btn">
                                        {loading ? (
                                            <><span className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" /> Verifying...</>
                                        ) : <><FaCheckCircle /> Verify & Continue</>}
                                    </button>
                                </form>

                                <div className="mt-5 text-center space-y-2">
                                    <p className="text-sm text-zinc-400">
                                        Didn't receive OTP?{" "}
                                        <button onClick={resendOtp} disabled={resendLoading}
                                            className="text-amber-600 font-black hover:text-amber-700 transition-colors disabled:opacity-50 cursor-pointer">
                                            {resendLoading ? "Sending..." : "Resend OTP"}
                                        </button>
                                    </p>
                                    <button onClick={() => { setStep("register"); setError(""); setOtp(""); }}
                                        className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                                        ← Change email
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-zinc-400 mt-4 font-medium">🔒 Your data is safe & secure</p>
            </div>
        </div>
    );
};

export default Register;