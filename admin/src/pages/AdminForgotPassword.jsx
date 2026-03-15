import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaGift, FaArrowLeft, FaPaperPlane, FaRedo } from "react-icons/fa";
import api from "../api/adminApi";

// ── Particle component for background effect ──
const Particle = ({ style }) => (
    <div style={{
        position: "absolute",
        width: 3,
        height: 3,
        borderRadius: "50%",
        background: "rgba(245,158,11,0.4)",
        pointerEvents: "none",
        ...style,
    }} />
);

const AdminForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [focused, setFocused] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [countdown, setCountdown] = useState(0); // resend cooldown

    // Entry animation trigger
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    // Resend countdown timer
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setInterval(() => setCountdown(c => c - 1), 1000);
        return () => clearInterval(t);
    }, [countdown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return setError("Email address required");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
            return setError("Please enter a valid email address");

        try {
            setLoading(true);
            setError("");
            // ✅ Admin-specific route — admin.rvgift.com link bhejega
            await api.post("/auth/admin/forgot-password", { email: email.trim() });
            setSuccess(true);
            setCountdown(60); // 60s resend cooldown
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0 || loading) return;
        try {
            setLoading(true);
            await api.post("/auth/admin/forgot-password", { email: email.trim() });
            setCountdown(60);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend. Try again.");
        } finally {
            setLoading(false);
        }
    };

    // Particles config (memoized positions)
    const particles = [
        { top: "15%", left: "12%", animationDelay: "0s", animationDuration: "4s" },
        { top: "70%", left: "8%", animationDelay: "1.2s", animationDuration: "5s" },
        { top: "30%", right: "10%", animationDelay: "0.6s", animationDuration: "3.5s" },
        { top: "80%", right: "15%", animationDelay: "2s", animationDuration: "4.5s" },
        { top: "50%", left: "5%", animationDelay: "0.3s", animationDuration: "6s" },
        { top: "20%", right: "5%", animationDelay: "1.8s", animationDuration: "3.8s" },
        { top: "90%", left: "30%", animationDelay: "0.9s", animationDuration: "5.2s" },
        { top: "10%", left: "55%", animationDelay: "2.4s", animationDuration: "4.2s" },
    ];

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
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

                /* ── Keyframes ── */
                @keyframes floatA   { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-22px) rotate(6deg)} }
                @keyframes floatB   { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(16px) rotate(-4deg)} }
                @keyframes floatC   { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-12px) scale(1.06)} }
                @keyframes particle { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-18px);opacity:1} }
                @keyframes slideUp  { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
                @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
                @keyframes shake    { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
                @keyframes spin     { to{transform:rotate(360deg)} }
                @keyframes pulseRing{
                    0%  { transform:scale(0.92); box-shadow:0 0 0 0 rgba(245,158,11,0.5); }
                    70% { transform:scale(1);    box-shadow:0 0 0 18px rgba(245,158,11,0); }
                    100%{ transform:scale(0.92); box-shadow:0 0 0 0 rgba(245,158,11,0); }
                }
                @keyframes successBounce {
                    0%  { transform:scale(0.5) rotate(-10deg); opacity:0; }
                    60% { transform:scale(1.15) rotate(4deg); }
                    80% { transform:scale(0.95) rotate(-2deg); }
                    100%{ transform:scale(1) rotate(0deg); opacity:1; }
                }
                @keyframes barFill  { from{width:0%} to{width:100%} }
                @keyframes glow     { 0%,100%{opacity:0.6} 50%{opacity:1} }
                @keyframes gridMove { from{background-position:0 0} to{background-position:50px 50px} }

                /* ── Utilities ── */
                .orb-a { animation: floatA 6s ease-in-out infinite; }
                .orb-b { animation: floatB 8s ease-in-out infinite; }
                .orb-c { animation: floatC 5s ease-in-out infinite; }

                .card-enter { animation: slideUp 0.65s cubic-bezier(0.16,1,0.3,1) forwards; }
                .card-hidden { opacity:0; transform:translateY(36px); }

                .error-shake { animation: shake 0.42s ease; }

                .logo-pulse { animation: pulseRing 2.2s ease-in-out infinite; }

                .success-icon { animation: successBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }

                /* Input */
                .fp-input {
                    width: 100%;
                    padding: 14px 14px 14px 46px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-family: 'DM Sans', sans-serif;
                    outline: none;
                    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
                    box-sizing: border-box;
                    background: rgba(255,255,255,0.07);
                    border: 1.5px solid rgba(255,255,255,0.1);
                    color: #fff;
                    letter-spacing: 0.01em;
                }
                .fp-input::placeholder { color: rgba(255,255,255,0.28); }
                .fp-input:focus {
                    background: rgba(255,255,255,0.11);
                    border-color: rgba(251,191,36,0.65);
                    box-shadow: 0 0 0 3px rgba(251,191,36,0.12), 0 4px 20px rgba(0,0,0,0.2);
                    transform: translateY(-1px);
                }
                .fp-input.filled {
                    border-color: rgba(255,255,255,0.2);
                    background: rgba(255,255,255,0.09);
                }

                /* Submit button */
                .fp-btn {
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 12px;
                    color: #fff;
                    font-weight: 800;
                    font-size: 15px;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 9px;
                    background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%);
                    background-size: 200% 100%;
                    background-position: left;
                    transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
                    position: relative;
                    overflow: hidden;
                    letter-spacing: 0.02em;
                }
                .fp-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: rgba(255,255,255,0);
                    transition: background 0.2s;
                }
                .fp-btn:hover:not(:disabled) {
                    background-position: right;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(245,158,11,0.45);
                }
                .fp-btn:hover:not(:disabled)::after { background: rgba(255,255,255,0.06); }
                .fp-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
                .fp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

                /* Resend button */
                .resend-btn {
                    background: none;
                    border: none;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 6px 12px;
                    border-radius: 8px;
                }
                .resend-btn:not(:disabled):hover {
                    background: rgba(245,158,11,0.12);
                    transform: translateY(-1px);
                }
                .resend-btn:disabled { cursor: default; }

                /* Back link */
                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    color: rgba(255,255,255,0.38);
                    font-size: 13px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.25s;
                    padding: 6px 10px;
                    border-radius: 8px;
                }
                .back-link:hover {
                    color: rgba(255,255,255,0.8);
                    background: rgba(255,255,255,0.06);
                    transform: translateX(-3px);
                }

                /* Particles */
                .particle { animation: particle var(--dur, 4s) ease-in-out infinite var(--delay, 0s); }

                /* Animated grid */
                .animated-grid {
                    animation: gridMove 8s linear infinite;
                }

                /* Success bar */
                .success-bar {
                    height: 3px;
                    background: linear-gradient(90deg, #10b981, #34d399);
                    animation: barFill 1.2s ease forwards;
                }

                /* Email highlight */
                .email-badge {
                    display: inline-block;
                    background: rgba(245,158,11,0.15);
                    border: 1px solid rgba(245,158,11,0.3);
                    color: #fbbf24;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 700;
                    margin-top: 6px;
                    animation: glow 2s ease-in-out infinite;
                }

                /* Stagger delays for form elements */
                .stagger-1 { animation-delay: 0.1s; }
                .stagger-2 { animation-delay: 0.2s; }
                .stagger-3 { animation-delay: 0.3s; }
            `}</style>

            {/* ── Animated Background Orbs ── */}
            <div className="orb-a" style={{ position: "absolute", top: "8%", left: "8%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,0.14),transparent 70%)", pointerEvents: "none" }} />
            <div className="orb-b" style={{ position: "absolute", bottom: "12%", right: "6%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.18),transparent 70%)", pointerEvents: "none" }} />
            <div className="orb-c" style={{ position: "absolute", top: "45%", left: "45%", transform: "translate(-50%,-50%)", width: 550, height: 550, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.07),transparent 70%)", pointerEvents: "none" }} />

            {/* ── Animated Grid ── */}
            <div className="animated-grid" style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" }} />

            {/* ── Floating Particles ── */}
            {particles.map((p, i) => (
                <Particle key={i} style={{ ...p, "--dur": p.animationDuration, "--delay": p.animationDelay }} className="particle" />
            ))}

            {/* ── Main Card ── */}
            <div
                className={mounted ? "card-enter" : "card-hidden"}
                style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 10 }}
            >
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 30 }}>
                    <div
                        className="logo-pulse"
                        style={{
                            position: "relative", width: 72, height: 72,
                            margin: "0 auto 16px", borderRadius: "50%",
                            background: "linear-gradient(135deg,#f59e0b,#f97316)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 0 40px rgba(245,158,11,0.35)",
                        }}
                    >
                        <FaGift size={28} color="#fff" />
                    </div>
                    <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 27, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>
                        RV<span style={{ color: "#f59e0b" }}>Gifts</span> Admin
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 6, letterSpacing: "0.03em" }}>
                        Secure admin portal — authorized access only
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                    border: "1.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 24, overflow: "hidden",
                    boxShadow: "0 28px 64px rgba(0,0,0,0.45)",
                }}>
                    {/* Top gradient bar */}
                    <div style={{ height: 3, background: "linear-gradient(90deg,#f59e0b,#f97316,#ef4444,#8b5cf6,#6366f1)" }} />

                    <div style={{ padding: 30 }}>

                        {/* ══ SUCCESS STATE ══ */}
                        {success ? (
                            <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
                                {/* Success bar replaces gradient bar */}
                                <div className="success-bar" style={{ margin: "-30px -30px 28px", height: 3, background: "linear-gradient(90deg,#10b981,#34d399)" }} />

                                {/* Icon */}
                                <div
                                    className="success-icon"
                                    style={{
                                        width: 72, height: 72, margin: "0 auto 20px",
                                        background: "rgba(16,185,129,0.12)",
                                        border: "1.5px solid rgba(16,185,129,0.3)",
                                        borderRadius: "50%",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 30,
                                    }}
                                >
                                    📧
                                </div>

                                <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: "0 0 8px" }}>
                                    Check Your Email
                                </h2>
                                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "0 0 6px", lineHeight: 1.6 }}>
                                    Reset link sent to
                                </p>
                                <span className="email-badge">{email}</span>

                                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11.5, margin: "16px 0 24px", lineHeight: 1.7 }}>
                                    Link expires in 15 minutes. Check spam folder if not received.
                                </p>

                                {/* Resend */}
                                <button
                                    onClick={handleResend}
                                    disabled={countdown > 0 || loading}
                                    className="resend-btn"
                                    style={{ color: countdown > 0 ? "rgba(255,255,255,0.25)" : "#f59e0b" }}
                                >
                                    {loading ? (
                                        <div style={{ width: 14, height: 14, border: "2px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                    ) : (
                                        <FaRedo size={11} />
                                    )}
                                    {countdown > 0 ? `Resend in ${countdown}s` : "Try a different email"}
                                </button>

                                <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                                    <Link to="/admin/login" className="back-link" style={{ justifyContent: "center" }}>
                                        <FaArrowLeft size={11} /> Back to Login
                                    </Link>
                                </div>
                            </div>

                        ) : (
                            /* ══ FORM STATE ══ */
                            <>
                                <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: "0 0 6px", textAlign: "center" }}>
                                    Forgot Password?
                                </h2>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", margin: "0 0 26px", lineHeight: 1.6 }}>
                                    Enter your admin email and we'll send a reset link
                                </p>

                                {/* Error */}
                                {error && (
                                    <div
                                        className="error-shake"
                                        key={error}
                                        style={{
                                            background: "rgba(239,68,68,0.14)",
                                            border: "1px solid rgba(239,68,68,0.3)",
                                            color: "#fca5a5",
                                            padding: "10px 14px", borderRadius: 12,
                                            fontSize: 13, marginBottom: 18,
                                            display: "flex", alignItems: "center", gap: 8,
                                        }}
                                    >
                                        ⚠️ {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    {/* Email field */}
                                    <div style={{ marginBottom: 22 }}>
                                        <label style={{
                                            fontSize: 11, fontWeight: 700,
                                            color: "rgba(255,255,255,0.4)",
                                            textTransform: "uppercase", letterSpacing: "0.08em",
                                            display: "block", marginBottom: 8,
                                        }}>
                                            Admin Email Address
                                        </label>
                                        <div style={{ position: "relative" }}>
                                            <FaEnvelope
                                                size={13}
                                                style={{
                                                    position: "absolute", left: 15, top: "50%",
                                                    transform: "translateY(-50%)",
                                                    color: focused ? "#f59e0b" : "rgba(255,255,255,0.28)",
                                                    transition: "color 0.25s",
                                                    pointerEvents: "none",
                                                }}
                                            />
                                            <input
                                                type="email"
                                                placeholder="admin@rvgifts.com"
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                                onFocus={() => setFocused(true)}
                                                onBlur={() => setFocused(false)}
                                                className={`fp-input ${email ? "filled" : ""}`}
                                                autoComplete="email"
                                            />
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="fp-btn"
                                    >
                                        {loading ? (
                                            <>
                                                <div style={{ width: 17, height: 17, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                                Sending link...
                                            </>
                                        ) : (
                                            <>
                                                <FaPaperPlane size={13} />
                                                Send Reset Link
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* Back link */}
                                <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                                    <Link to="/admin/login" className="back-link" style={{ justifyContent: "center" }}>
                                        <FaArrowLeft size={11} /> Back to Login
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer badges */}
                <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 20, flexWrap: "wrap" }}>
                    {["🔒 SSL Secured", "🛡️ Admin Only", "⚡ RVGifts"].map(badge => (
                        <span key={badge} style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontWeight: 600 }}>
                            {badge}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminForgotPassword;