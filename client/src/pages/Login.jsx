import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGift } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && user) navigate("/", { replace: true });
    }, [user, loading, navigate]);

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!email || !password) return setError("Email and password are required");
        try {
            setSubmitting(true);
            setError("");
            await login(email.trim(), password);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid email or password");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-4 bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100">
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
                .input-field:focus {
                    border-color: #f59e0b;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
                }
                .input-field:hover:not(:focus) { border-color: #d6d3d1; }
            `}</style>

            <div className="auth-font w-full max-w-md fade-up">
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/80 border border-stone-100 overflow-hidden">

                    {/* Top accent */}
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

                    <div className="p-8">
                        {/* Logo */}
                        <div className="flex justify-center mb-6">
                            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 rotate-3 hover:rotate-0 transition-transform duration-300">
                                <FaGift size={24} className="text-white" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-zinc-900 text-center mb-1">Welcome Back</h2>
                        <p className="text-center text-sm text-zinc-400 mb-7">Login to your RV Gifts account</p>

                        {/* Error */}
                        {error && (
                            <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl flex items-center gap-2">
                                <span className="text-base">⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={submitHandler} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="text-xs font-bold text-zinc-500 mb-1.5 block uppercase tracking-wide">Email Address</label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                        placeholder="your@email.com"
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-xs font-bold text-zinc-500 mb-1.5 block uppercase tracking-wide">Password</label>
                                <div className="relative">
                                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                        placeholder="Enter your password"
                                        style={{ paddingRight: "44px" }}
                                        className="input-field"
                                    />
                                    <button type="button" onClick={() => setShowPassword(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-500 transition-colors p-1">
                                        {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={submitting}
                                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-60 shadow-lg shadow-amber-200 mt-2 flex items-center justify-center gap-2">
                                {submitting ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Logging in...</>
                                ) : "Login to Account"}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-stone-100 text-center">
                            <p className="text-sm text-zinc-400">
                                Don't have an account?{" "}
                                <Link to="/register" className="text-amber-600 font-black hover:text-amber-700 transition-colors">
                                    Create Account →
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-zinc-400 mt-4">🔒 Your data is safe & secure</p>
            </div>
        </div>
    );
};

export default Login;