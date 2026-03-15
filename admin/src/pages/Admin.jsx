import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAdminAuth } from "../auth/AdminAuthContext";
import {
    FaThLarge, FaBox, FaClipboardList,
    FaSignOutAlt, FaGift, FaCashRegister,
    FaBars, FaTimes, FaChevronRight
} from "react-icons/fa";

const navItems = [
    { to: ".", end: true, icon: FaThLarge, label: "Dashboard", accent: "#F59E0B", lightBg: "#FFFBEB", border: "#FDE68A" },
    { to: "products", icon: FaBox, label: "Products", accent: "#3B82F6", lightBg: "#EFF6FF", border: "#BFDBFE" },
    { to: "orders", icon: FaClipboardList, label: "Orders", accent: "#10B981", lightBg: "#ECFDF5", border: "#A7F3D0" },
    { to: "pos", icon: FaCashRegister, label: "Shop POS", accent: "#8B5CF6", lightBg: "#F5F3FF", border: "#DDD6FE" },
];

const Admin = () => {
    const { admin, logout } = useAdminAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const currentLabel = (() => {
        const seg = location.pathname.replace(/.*\/admin\/?/, "") || ".";
        return navItems.find(n => n.to === seg || (n.to === "." && seg === "."))?.label || "Dashboard";
    })();

    const roleStyle = admin?.role === "owner"
        ? { bg: "#FEF9C3", text: "#CA8A04", border: "#FDE68A" }
        : { bg: "#DBEAFE", text: "#2563EB", border: "#BFDBFE" };

    const SidebarContent = () => (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

            {/* Logo */}
            <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "linear-gradient(135deg,#F59E0B,#D97706)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
                    }}>
                        <FaGift size={15} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#0F172A", lineHeight: 1 }}>RV Gifts</div>
                        <div style={{ fontSize: 9, color: "#F59E0B", letterSpacing: "0.15em", fontWeight: 700, marginTop: 2 }}>ADMIN PANEL</div>
                    </div>
                </div>
            </div>

            {/* Profile */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg,#F59E0B,#D97706)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 15, color: "#fff",
                    }}>
                        {admin?.name?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {admin?.name || "Admin"}
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {admin?.email}
                        </div>
                    </div>
                </div>
                <div style={{
                    marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5,
                    background: roleStyle.bg, color: roleStyle.text,
                    border: `1px solid ${roleStyle.border}`,
                    borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700,
                }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: roleStyle.text }} />
                    {admin?.role?.charAt(0).toUpperCase() + (admin?.role?.slice(1) || "")}
                </div>
            </div>

            {/* Nav */}
            <div style={{ flex: 1, padding: "12px 10px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.14em", padding: "0 6px 10px" }}>
                    MENU
                </div>
                <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {navItems.map(({ to, end, icon: Icon, label, accent, lightBg, border }) => (
                        <NavLink
                            key={to} to={to} end={end}
                            onClick={() => setMobileOpen(false)}
                            style={({ isActive }) => ({
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "10px 12px", borderRadius: 12,
                                textDecoration: "none", fontWeight: isActive ? 700 : 500, fontSize: 13,
                                transition: "all 0.15s",
                                background: isActive ? lightBg : "transparent",
                                color: isActive ? accent : "#64748B",
                                border: isActive ? `1px solid ${border}` : "1px solid transparent",
                            })}
                        >
                            {({ isActive }) => (
                                <>
                                    <div style={{
                                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                        background: isActive ? `${accent}20` : "#F8FAFC",
                                        border: `1px solid ${isActive ? `${accent}30` : "#E2E8F0"}`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <Icon size={13} color={isActive ? accent : "#94A3B8"} />
                                    </div>
                                    <span style={{ flex: 1 }}>{label}</span>
                                    {isActive && <FaChevronRight size={9} color={accent} />}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Sign Out */}
            <div style={{ padding: "10px 10px 20px" }}>
                <div style={{ height: 1, background: "#F1F5F9", marginBottom: 12 }} />
                <button
                    onClick={logout}
                    style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 7, padding: "10px 0", borderRadius: 12,
                        border: "1px solid #FECACA",
                        background: "#FEF2F2", color: "#EF4444",
                        fontWeight: 600, fontSize: 12, cursor: "pointer",
                        transition: "all 0.15s", fontFamily: "inherit",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#EF4444"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; }}
                >
                    <FaSignOutAlt size={11} /> Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: #F8FAFC; }
                ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
                @media (max-width: 1023px) {
                    .rv-sidebar { display: none !important; }
                    .rv-menu-btn { display: flex !important; }
                }
            `}</style>

            {/* TOPBAR — white */}
            <header style={{
                height: 56, background: "#fff",
                borderBottom: "1px solid #E2E8F0",
                padding: "0 20px", display: "flex", alignItems: "center",
                justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50,
                boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            }}>
                {/* Left */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                        onClick={() => setMobileOpen(v => !v)}
                        className="rv-menu-btn"
                        style={{
                            display: "none", alignItems: "center", justifyContent: "center",
                            width: 34, height: 34, borderRadius: 9,
                            background: "#F8FAFC", border: "1px solid #E2E8F0",
                            color: "#64748B", cursor: "pointer",
                        }}
                    >
                        {mobileOpen ? <FaTimes size={13} /> : <FaBars size={13} />}
                    </button>

                    {/* Page breadcrumb */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>Admin</span>
                        <span style={{ fontSize: 12, color: "#CBD5E1" }}>/</span>
                        <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 700 }}>{currentLabel}</span>
                    </div>
                </div>

                {/* Right */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "#F8FAFC", border: "1px solid #E2E8F0",
                        borderRadius: 10, padding: "5px 12px 5px 6px",
                    }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "linear-gradient(135deg,#F59E0B,#D97706)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, fontSize: 11, color: "#fff",
                        }}>
                            {admin?.name?.[0]?.toUpperCase() || "A"}
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>
                                {admin?.name || "Admin"}
                            </div>
                            <div style={{ fontSize: 9, color: "#94A3B8", textTransform: "capitalize" }}>
                                {admin?.role}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "7px 14px", borderRadius: 9,
                            border: "1px solid #FECACA",
                            background: "#FEF2F2", color: "#EF4444",
                            fontWeight: 600, fontSize: 12, cursor: "pointer",
                            transition: "all 0.15s", fontFamily: "inherit",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#EF4444"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; }}
                    >
                        <FaSignOutAlt size={10} /> Logout
                    </button>
                </div>
            </header>

            {/* BODY */}
            <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

                {/* Desktop Sidebar — white */}
                <aside className="rv-sidebar" style={{
                    width: 220, flexShrink: 0,
                    background: "#fff",
                    borderRight: "1px solid #E2E8F0",
                    height: "calc(100vh - 56px)", position: "sticky", top: 56,
                    overflowY: "auto",
                    boxShadow: "2px 0 8px rgba(0,0,0,0.03)",
                }}>
                    <SidebarContent />
                </aside>

                {/* Mobile drawer */}
                {mobileOpen && <>
                    <div
                        onClick={() => setMobileOpen(false)}
                        style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)" }}
                    />
                    <div style={{
                        position: "fixed", left: 0, top: 56, bottom: 0, width: 230,
                        background: "#fff", zIndex: 45,
                        borderRight: "1px solid #E2E8F0", overflowY: "auto",
                        boxShadow: "4px 0 24px rgba(0,0,0,0.1)",
                    }}>
                        <SidebarContent />
                    </div>
                </>}

                {/* Main content */}
                <main style={{ flex: 1, minWidth: 0, overflowY: "auto", background: "#F8FAFC" }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Admin;