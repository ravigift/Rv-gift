import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAdminAuth } from "../auth/AdminAuthContext";
import api from "../api/adminApi";
import {
    FaThLarge, FaBox, FaClipboardList,
    FaSignOutAlt, FaGift, FaCashRegister,
    FaBars, FaTimes, FaChevronRight, FaImage, FaListOl,
    FaUsers, FaUndo, FaEnvelope, FaShieldAlt, FaChartLine,
} from "react-icons/fa";

const NAV_GROUPS = [
    {
        label: "Overview",
        items: [
            { to: ".", end: true, icon: FaThLarge, label: "Dashboard", accent: "#F59E0B", lightBg: "#FFFBEB", border: "#FDE68A" },
            { to: "reports", icon: FaChartLine, label: "Reports", accent: "#0D9488", lightBg: "#F0FDFA", border: "#99F6E4" },
        ],
    },
    {
        label: "Storefront",
        items: [
            { to: "banners", icon: FaImage, label: "Hero Banners", accent: "#EC4899", lightBg: "#FDF2F8", border: "#FBCFE8" },
            { to: "home-content", icon: FaListOl, label: "Home Content", accent: "#0EA5E9", lightBg: "#F0F9FF", border: "#BAE6FD" },
            { to: "products", icon: FaBox, label: "Products", accent: "#3B82F6", lightBg: "#EFF6FF", border: "#BFDBFE" },
        ],
    },
    {
        label: "Commerce",
        items: [
            { to: "orders", icon: FaClipboardList, label: "Orders", accent: "#10B981", lightBg: "#ECFDF5", border: "#A7F3D0" },
            { to: "refunds", icon: FaUndo, label: "Refunds & Returns", accent: "#F97316", lightBg: "#FFF7ED", border: "#FED7AA" },
            { to: "pos", icon: FaCashRegister, label: "Shop POS", accent: "#8B5CF6", lightBg: "#F5F3FF", border: "#DDD6FE" },
        ],
    },
    {
        label: "People",
        items: [
            { to: "customers", icon: FaUsers, label: "Customers", accent: "#06B6D4", lightBg: "#ECFEFF", border: "#A5F3FC" },
            { to: "queries", icon: FaEnvelope, label: "Contact Queries", accent: "#6366F1", lightBg: "#EEF2FF", border: "#C7D2FE", badgeKey: "queries" },
        ],
    },
];

// flat list for breadcrumb lookup
const navItems = NAV_GROUPS.flatMap(g => g.items);

const Admin = () => {
    const { admin, logout } = useAdminAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadQueries, setUnreadQueries] = useState(0);
    const location = useLocation();

    // Fetch unread query count for live badge
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const { data } = await api.get("/contact");
                const unread = Array.isArray(data) ? data.filter(q => !q.isRead).length : 0;
                setUnreadQueries(unread);
            } catch { /* silent */ }
        };
        fetchUnread();
        // Refresh every 60s
        const interval = setInterval(fetchUnread, 60000);
        return () => clearInterval(interval);
    }, []);

    const currentLabel = (() => {
        const seg = location.pathname.replace(/.*\/admin\/?/, "") || ".";
        return navItems.find(n => n.to === seg || (n.to === "." && seg === "."))?.label || "Dashboard";
    })();


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



            {/* Nav — Grouped */}
            <div style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
                {NAV_GROUPS.map((group) => (
                    <div key={group.label} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.14em", padding: "0 6px 8px", textTransform: "uppercase" }}>
                            {group.label}
                        </div>
                        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {group.items.map(({ to, end, icon: Icon, label, accent, lightBg, border, badgeKey }) => {
                                const badge = badgeKey === "queries" ? unreadQueries : 0;
                                return (
                                    <NavLink
                                        key={to} to={to} end={end}
                                        onClick={() => setMobileOpen(false)}
                                        style={({ isActive }) => ({
                                            display: "flex", alignItems: "center", gap: 10,
                                            padding: "9px 10px", borderRadius: 12,
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
                                                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                                    background: isActive ? `${accent}20` : "#F8FAFC",
                                                    border: `1px solid ${isActive ? `${accent}30` : "#E2E8F0"}`,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                }}>
                                                    <Icon size={12} color={isActive ? accent : "#94A3B8"} />
                                                </div>
                                                <span style={{ flex: 1, fontSize: 12.5 }}>{label}</span>
                                                {badge > 0 && (
                                                    <span style={{
                                                        minWidth: 18, height: 18, borderRadius: 9,
                                                        background: "#EF4444", color: "#fff",
                                                        fontSize: 9, fontWeight: 800,
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        padding: "0 5px",
                                                    }}>{badge > 99 ? "99+" : badge}</span>
                                                )}
                                                {isActive && !badge && <FaChevronRight size={8} color={accent} />}
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </nav>
                    </div>
                ))}
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