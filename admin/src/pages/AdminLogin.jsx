import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGift, FaShieldAlt } from "react-icons/fa";

const AdminLogin = () => {
    const { login } = useAdminAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        if (!email || !password) return setError("Email and password required");
        try {
            setLoading(true);
            setError("");
            await login(email.trim(), password);
            navigate("/admin", { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "'DM Sans', sans-serif",
            position: "relative",
            overflow: "hidden",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');

                @keyframes float1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(5deg)} }
                @keyframes float2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(15px) rotate(-5deg)} }
                @keyframes float3 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-10px) scale(1.05)} }
                @keyframes pulse-ring { 0%{transform:scale(0.95);opacity:0.7} 70%{transform:scale(1.1);opacity:0} 100%{transform:scale(0.95);opacity:0} }
                @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
                @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
                @keyframes spin { to{transform:rotate(360deg)} }

                .login-card { animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
                .orb1 { animation: float1 6s ease-in-out infinite; }
                .orb2 { animation: float2 8s ease-in-out infinite; }
                .orb3 { animation: float3 5s ease-in-out infinite; }
                .pulse-ring::before {
                    content:''; position:absolute; inset:-8px; border-radius:50%;
                    border:2px solid rgba(251,191,36,0.4);
                    animation: pulse-ring 2s ease-out infinite;
                }
                .shake { animation: shake 0.4s ease; }
                .btn-gradient {
                    background: linear-gradient(135deg, #f59e0b, #f97316, #ef4444);
                    background-size: 200%;
                    transition: all 0.3s;
                }
                .btn-gradient:hover { background-position: right; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(245,158,11,0.4); }
                .btn-gradient:active { transform: translateY(0); }
                .input-field {
                    width:100%; padding:14px 14px 14px 44px;
                    border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif;
                    outline:none; transition:all 0.3s; box-sizing:border-box;
                    background:rgba(255,255,255,0.07);
                    border:1.5px solid rgba(255,255,255,0.1);
                    color:#fff;
                }
                .input-field::placeholder { color:rgba(255,255,255,0.3); }
                .input-field:focus {
                    background:rgba(255,255,255,0.12);
                    border-color:rgba(251,191,36,0.6);
                    box-shadow:0 0 0 3px rgba(251,191,36,0.15);
                }
                .input-field.has-value {
                    background:rgba(255,255,255,0.1);
                    border-color:rgba(255,255,255,0.2);
                }
                .forgot-link {
                    color: rgba(251,191,36,0.7);
                    font-size: 12px;
                    font-weight: 700;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .forgot-link:hover { color: #f59e0b; }
            `}</style>

            {/* Background orbs */}
            <div className="orb1" style={{ position: "absolute", top: "10%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,0.15),transparent 70%)", pointerEvents: "none" }} />
            <div className="orb2" style={{ position: "absolute", bottom: "15%", right: "8%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.2),transparent 70%)", pointerEvents: "none" }} />
            <div className="orb3" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.08),transparent 70%)", pointerEvents: "none" }} />

            {/* Decorative grid */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" }} />

            <div className="login-card" style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 10 }}>

                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div className="pulse-ring" style={{ position: "relative", width: 72, height: 72, margin: "0 auto 16px", borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(245,158,11,0.4)" }}>
                        <FaGift size={28} color="#fff" />
                    </div>
                    <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>
                        RV<span style={{ color: "#f59e0b" }}>Gifts</span> Admin
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 6 }}>
                        Secure admin portal — authorized access only
                    </p>
                </div>

                {/* Card */}
                <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 24, overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>

                    {/* Top gradient bar */}
                    <div style={{ height: 3, background: "linear-gradient(90deg,#f59e0b,#f97316,#ef4444,#8b5cf6,#6366f1)" }} />

                    <form onSubmit={submit} style={{ padding: 28 }}>

                        {/* Error */}
                        {error && (
                            <div className="shake" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", padding: "10px 14px", borderRadius: 12, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Email */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                                Email Address
                            </label>
                            <div style={{ position: "relative" }}>
                                <FaEnvelope size={13} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: focused === "email" ? "#f59e0b" : "rgba(255,255,255,0.3)", transition: "color 0.2s" }} />
                                <input
                                    type="email"
                                    placeholder="admin@rvgifts.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                    onFocus={() => setFocused("email")}
                                    onBlur={() => setFocused("")}
                                    className={`input-field ${email ? "has-value" : ""}`}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    Password
                                </label>
                                <Link to="/admin/forgot-password" className="forgot-link">
                                    Forgot Password?
                                </Link>
                            </div>
                            <div style={{ position: "relative" }}>
                                <FaLock size={13} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: focused === "password" ? "#f59e0b" : "rgba(255,255,255,0.3)", transition: "color 0.2s" }} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                    onFocus={() => setFocused("password")}
                                    onBlur={() => setFocused("")}
                                    className={`input-field ${password ? "has-value" : ""}`}
                                    style={{ paddingRight: 44 }}
                                />
                                <button type="button" onClick={() => setShowPassword(s => !s)}
                                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 0, transition: "color 0.2s" }}
                                    onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.8)"}
                                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.4)"}>
                                    {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={loading} className="btn-gradient"
                            style={{ width: "100%", padding: "14px", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'DM Sans',sans-serif" }}>
                            {loading ? (
                                <>
                                    <div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                    Signing in...
                                </>
                            ) : (
                                <><FaShieldAlt size={14} /> Sign In to Admin Panel</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer badges */}
                <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20 }}>
                    {["🔒 SSL Secured", "🛡️ Admin Only", "⚡ RVGifts"].map(badge => (
                        <span key={badge} style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{badge}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;