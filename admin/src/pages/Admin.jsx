import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAdminAuth } from "../auth/AdminAuthContext";
import {
    FaThLarge, FaBox, FaClipboardList,
    FaSignOutAlt, FaGift, FaCashRegister,
    FaBars, FaTimes, FaChevronRight
} from "react-icons/fa";

const NAVY = "#0F172A";
const AMBER = "#F59E0B";

const navItems = [
    { to: ".", end: true, icon: FaThLarge, label: "Dashboard", accent: "#F59E0B" },
    { to: "products", icon: FaBox, label: "Products", accent: "#3B82F6" },
    { to: "orders", icon: FaClipboardList, label: "Orders", accent: "#10B981" },
    { to: "pos", icon: FaCashRegister, label: "Shop POS", accent: "#8B5CF6" },
];

const Admin = () => {
    const { admin, logout } = useAdminAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const roleStyle = admin?.role === "owner"
        ? { bg: "rgba(245,158,11,0.15)", text: "#F59E0B" }
        : { bg: "rgba(59,130,246,0.15)", text: "#60A5FA" };

    const currentLabel = (() => {
        const seg = location.pathname.replace(/.*\/admin\/?/, "") || ".";
        return navItems.find(n => n.to === seg || (n.to === "." && seg === "."))?.label || "Dashboard";
    })();

    const SidebarContent = () => (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

            {/* Profile */}
            <div style={{
                margin: "16px 12px 8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "14px 12px"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg,#F59E0B,#D97706)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 15, color: "#fff"
                    }}>
                        {admin?.name?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#F9FAFB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {admin?.name || "Admin"}
                        </div>
                        <div style={{ fontSize: 10, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {admin?.email}
                        </div>
                    </div>
                </div>
                <div style={{
                    marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5,
                    background: roleStyle.bg, color: roleStyle.text,
                    borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700
                }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: roleStyle.text }} />
                    {admin?.role?.charAt(0).toUpperCase() + (admin?.role?.slice(1) || "")}
                </div>
            </div>

            {/* Nav */}
            <div style={{ flex: 1, padding: "8px 12px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#374151", letterSpacing: "0.12em", padding: "4px 6px 10px" }}>
                    MENU
                </div>
                <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {navItems.map(({ to, end, icon: Icon, label, accent }) => (
                        <NavLink
                            key={to} to={to} end={end}
                            onClick={() => setMobileOpen(false)}
                            style={({ isActive }) => ({
                                display: "flex", alignItems: "center", gap: 9,
                                padding: "9px 10px", borderRadius: 10,
                                textDecoration: "none", fontWeight: 600, fontSize: 13,
                                transition: "all 0.15s",
                                background: isActive ? `${accent}18` : "transparent",
                                color: isActive ? accent : "#6B7280",
                                borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent",
                            })}
                        >
                            {({ isActive }) => (
                                <>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                                        background: isActive ? `${accent}20` : "rgba(255,255,255,0.04)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <Icon size={12} color={isActive ? accent : "#4B5563"} />
                                    </div>
                                    <span style={{ flex: 1 }}>{label}</span>
                                    {isActive && <FaChevronRight size={8} color={accent} />}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Sign Out */}
            <div style={{ padding: "8px 12px 20px" }}>
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 12 }} />
                <button
                    onClick={logout}
                    style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 7, padding: "9px 0", borderRadius: 10,
                        border: "1px solid rgba(239,68,68,0.2)",
                        background: "rgba(239,68,68,0.05)", color: "#F87171",
                        fontWeight: 600, fontSize: 12, cursor: "pointer",
                        transition: "all 0.15s", fontFamily: "inherit"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#DC2626"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.05)"; e.currentTarget.style.color = "#F87171"; }}
                >
                    <FaSignOutAlt size={11} /> Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                * { box-sizing:border-box; }
                ::-webkit-scrollbar { width:3px; }
                ::-webkit-scrollbar-thumb { background:#1E293B; border-radius:4px; }
                @media (max-width:1023px) {
                    .rv-sidebar { display:none !important; }
                    .rv-menu-btn { display:flex !important; }
                }
            `}</style>

            {/* ══ TOPBAR ══ */}
            <header style={{
                height: 52, background: NAVY,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                padding: "0 16px", display: "flex", alignItems: "center",
                justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50,
                boxShadow: "0 2px 16px rgba(0,0,0,0.4)"
            }}>
                {/* Left: hamburger + logo */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                        onClick={() => setMobileOpen(v => !v)}
                        className="rv-menu-btn"
                        style={{
                            display: "none", alignItems: "center", justifyContent: "center",
                            width: 32, height: 32, borderRadius: 8,
                            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)",
                            color: "#9CA3AF", cursor: "pointer"
                        }}
                    >
                        {mobileOpen ? <FaTimes size={13} /> : <FaBars size={13} />}
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: "linear-gradient(135deg,#F59E0B,#D97706)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(245,158,11,0.35)"
                        }}>
                            <FaGift size={13} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", lineHeight: 1 }}>
                                RV Gifts
                            </div>
                            <div style={{ fontSize: 8, color: "#F59E0B", letterSpacing: "0.1em", fontWeight: 700 }}>
                                ADMIN
                            </div>
                        </div>
                    </div>

                    {/* page indicator */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 6, padding: "3px 9px", marginLeft: 4
                    }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: AMBER, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{currentLabel}</span>
                    </div>
                </div>

                {/* Right: user + logout */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 9, padding: "4px 11px 4px 5px"
                    }}>
                        <div style={{
                            width: 26, height: 26, borderRadius: "50%",
                            background: "linear-gradient(135deg,#F59E0B,#D97706)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 11, color: "#fff"
                        }}>
                            {admin?.name?.[0]?.toUpperCase() || "A"}
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#F9FAFB", lineHeight: 1.3 }}>
                                {admin?.name || "Admin"}
                            </div>
                            <div style={{ fontSize: 9, color: "#6B7280", textTransform: "capitalize" }}>
                                {admin?.role}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", borderRadius: 8,
                            border: "1px solid rgba(239,68,68,0.25)",
                            background: "rgba(239,68,68,0.07)", color: "#F87171",
                            fontWeight: 600, fontSize: 11, cursor: "pointer",
                            transition: "all 0.15s", fontFamily: "inherit"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#DC2626"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.07)"; e.currentTarget.style.color = "#F87171"; }}
                    >
                        <FaSignOutAlt size={10} /> Logout
                    </button>
                </div>
            </header>

            {/* ══ BODY ══ */}
            <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

                {/* Desktop Sidebar */}
                <aside className="rv-sidebar" style={{
                    width: 210, flexShrink: 0, background: NAVY,
                    borderRight: "1px solid rgba(255,255,255,0.05)",
                    height: "calc(100vh - 52px)", position: "sticky", top: 52,
                    overflowY: "auto"
                }}>
                    <SidebarContent />
                </aside>

                {/* Mobile drawer */}
                {mobileOpen && <>
                    <div
                        onClick={() => setMobileOpen(false)}
                        style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }}
                    />
                    <div style={{
                        position: "fixed", left: 0, top: 52, bottom: 0, width: 220,
                        background: NAVY, zIndex: 45,
                        borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto"
                    }}>
                        <SidebarContent />
                    </div>
                </>}

                {/* Main */}
                <main style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Admin;