import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
    FaSearch, FaShoppingCart, FaTimes,
    FaUser, FaBox, FaSignOutAlt, FaHome,
    FaChevronDown, FaArrowRight,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useAuth } from "../contexts/AuthContext";
import SearchBar from "./SearchBar";
import Logo from "../assets/logo.png.jpeg";

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const isAuthenticated = Boolean(user);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [searchOverlay, setSearchOverlay] = useState(false);
    const [searchVal, setSearchVal] = useState("");
    const userMenuRef = useRef(null);
    const searchInputRef = useRef(null);

    const cartItems = useSelector((state) => state.cart?.items || []);
    const totalItems = cartItems.reduce((sum, i) => sum + (i.quantity || 0), 0);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target))
                setUserMenuOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        document.body.style.overflow = (mobileOpen || searchOverlay) ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen, searchOverlay]);

    useEffect(() => {
        if (searchOverlay) setTimeout(() => searchInputRef.current?.focus(), 150);
        else setSearchVal("");
    }, [searchOverlay]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") { setSearchOverlay(false); setMobileOpen(false); }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    const go = (path) => { setMobileOpen(false); setUserMenuOpen(false); navigate(path); };
    const handleLogout = () => { logout(); setUserMenuOpen(false); setMobileOpen(false); navigate("/login", { replace: true }); };
    const handleSearch = (query) => { setMobileOpen(false); setSearchOverlay(false); navigate(`/?search=${encodeURIComponent(query)}`); };
    const handleOverlaySearch = (e) => { e.preventDefault(); if (searchVal.trim()) handleSearch(searchVal.trim()); };

    const POPULAR = ["Custom T-Shirt", "LED Lamp", "Photo Frame", "Gift Box", "Clock"];
    const MENU_ITEMS = [
        { icon: <FaUser size={12} />, label: "My Profile", path: "/profile" },
        { icon: <FaBox size={12} />, label: "My Orders", path: "/orders" },
    ];

    return (
        <>
            <style>{`
                .nav-font { font-family: 'DM Sans', sans-serif; }

                @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
                @keyframes slideUp  { from{transform:translateY(100%)} to{transform:translateY(0)} }
                @keyframes slideInR { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
                @keyframes dropDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

                .anim-fadein   { animation: fadeIn   0.2s ease forwards; }
                .anim-slideup  { animation: slideUp  0.32s cubic-bezier(0.32,0.72,0,1) forwards; will-change:transform; }
                .anim-slideinr { animation: slideInR 0.26s cubic-bezier(0.32,0.72,0,1) forwards; will-change:transform; }
                .anim-dropdown    { animation: dropDown  0.18s ease forwards; }

                @keyframes searchDrop {
                    from { opacity:0; transform:translateY(-10px) scaleY(0.97); }
                    to   { opacity:1; transform:translateY(0)     scaleY(1); }
                }
                .anim-searchdrop {
                    animation: searchDrop 0.24s cubic-bezier(0.22,1,0.36,1) forwards;
                    will-change: transform, opacity;
                    transform-origin: top center;
                }

                .cart-icon { transition: all 0.25s ease; }
                .cart-btn:hover .cart-icon { color:#f59e0b; transform:rotate(-12deg) scale(1.1); }

                .search-input-clean {
                    background:transparent; border:none; outline:none;
                    font-size:1.05rem; font-weight:600; color:#111; width:100%;
                    font-family:'DM Sans',sans-serif;
                }
                .search-input-clean::placeholder { color:#bbb; font-weight:500; }

                .pill-tag {
                    display:inline-flex; align-items:center; gap:4px;
                    padding:6px 12px; border-radius:99px; font-size:12px; font-weight:700;
                    background:#f5f4f2; color:#52525b; border:1.5px solid #e7e5e4;
                    cursor:pointer; transition:all 0.15s ease; white-space:nowrap;
                }
                .pill-tag:hover  { background:#fef3c7; border-color:#f59e0b; color:#b45309; }
                .pill-tag:active { transform:scale(0.95); }

                .drawer-item {
                    display:flex; align-items:center; gap:11px;
                    width:100%; padding:10px 10px; border-radius:11px;
                    font-size:13.5px; font-weight:500; color:#52525b;
                    background:none; border:none; cursor:pointer;
                    transition:background 0.15s, color 0.15s; text-align:left;
                }
                .drawer-item:hover            { background:#fffbeb; color:#b45309; }
                .drawer-item:hover .d-icon    { background:#fef3c7; color:#d97706; }
                .d-icon {
                    width:30px; height:30px; border-radius:8px;
                    background:#f4f4f3; display:flex; align-items:center;
                    justify-content:center; color:#a1a1aa; flex-shrink:0;
                    transition:background 0.15s, color 0.15s;
                }
                .drawer-item-out              { color:#f87171; }
                .drawer-item-out:hover        { background:#fff1f2; color:#dc2626; }
                .drawer-item-out:hover .d-icon-red { background:#fee2e2; color:#dc2626; }
                .d-icon-red {
                    width:30px; height:30px; border-radius:8px;
                    background:#fff1f2; display:flex; align-items:center;
                    justify-content:center; color:#f87171; flex-shrink:0;
                    transition:background 0.15s, color 0.15s;
                }

                .hb-line {
                    display:block; height:2px; border-radius:2px;
                    background:currentColor; transition:all 0.25s ease;
                }

                .close-btn {
                    width:28px; height:28px; border-radius:8px;
                    background:#f4f4f3; border:none;
                    display:flex; align-items:center; justify-content:center;
                    cursor:pointer; color:#71717a;
                    transition:background 0.15s, color 0.15s;
                }
                .close-btn:hover { background:#fecaca; color:#dc2626; }
            `}</style>

            {/* ══ SEARCH TOP DROPDOWN ══
                ✅ Bottom sheet hata diya — ab navbar ke neeche se smooth drop hota hai
                ✅ Backdrop click se close
                ✅ Keyboard: Escape se close, Enter se search
            ══ */}
            {searchOverlay && (
                <div className="nav-font md:hidden" style={{ position: "fixed", inset: 0, zIndex: 200 }}>
                    {/* Backdrop — soft blur */}
                    <div
                        className="anim-fadein absolute inset-0"
                        style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(2px)" }}
                        onClick={() => setSearchOverlay(false)}
                    />

                    {/* Dropdown panel — navbar ke bilkul neeche */}
                    <div
                        className="anim-searchdrop absolute left-0 right-0 bg-white"
                        style={{
                            top: 64,   // navbar h-16 = 64px
                            borderRadius: "0 0 20px 20px",
                            boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
                            padding: "16px 18px 20px",
                            zIndex: 10,
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FaSearch size={12} color="#d97706" />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: 14, color: "#18181b" }}>Search Products</span>
                            </div>
                            <button
                                onClick={() => setSearchOverlay(false)}
                                style={{ width: 28, height: 28, borderRadius: 8, background: "#f4f4f3", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#71717a", transition: "all 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#fecaca"}
                                onMouseLeave={e => e.currentTarget.style.background = "#f4f4f3"}
                            >
                                <FaTimes size={11} />
                            </button>
                        </div>

                        {/* Search input */}
                        <form onSubmit={handleOverlaySearch}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "10px 14px", borderRadius: 14,
                                border: "2px solid #e7e5e4", background: "#fafaf9",
                                transition: "border-color 0.2s",
                            }}
                                onFocus={e => e.currentTarget.style.borderColor = "#f59e0b"}
                                onBlur={e => e.currentTarget.style.borderColor = "#e7e5e4"}
                            >
                                <FaSearch size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchVal}
                                    onChange={e => setSearchVal(e.target.value)}
                                    placeholder="Search gifts, printing, watches..."
                                    className="search-input-clean"
                                    style={{ fontSize: "0.95rem" }}
                                />
                                {searchVal && (
                                    <button type="button" onClick={() => setSearchVal("")}
                                        style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", padding: 0, display: "flex" }}>
                                        <FaTimes size={11} />
                                    </button>
                                )}
                            </div>

                            {/* Search button */}
                            <button type="submit"
                                style={{
                                    width: "100%", marginTop: 10, padding: "12px 0",
                                    borderRadius: 12, border: "none", cursor: "pointer",
                                    fontWeight: 800, fontSize: 14,
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                    background: searchVal.trim()
                                        ? "linear-gradient(135deg,#f59e0b,#fbbf24)"
                                        : "#f1f0ee",
                                    color: searchVal.trim() ? "#111" : "#a8a29e",
                                    boxShadow: searchVal.trim() ? "0 6px 18px rgba(245,158,11,0.3)" : "none",
                                    transition: "all 0.2s",
                                }}>
                                <FaSearch size={11} />
                                Search
                                {searchVal.trim() && <FaArrowRight size={10} />}
                            </button>
                        </form>

                        {/* Popular searches */}
                        <div style={{ marginTop: 16 }}>
                            <p style={{ fontSize: 10, fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                                Popular Searches
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                                {POPULAR.map(tag => (
                                    <button key={tag} onClick={() => handleSearch(tag)} className="pill-tag">
                                        🔍 {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════
                MOBILE DRAWER
                ✅ top: 64px     — just below navbar
                ✅ maxHeight: 55vh — half screen, not full
                ✅ ✕ button inside header row
                ✅ backdrop click also closes
            ══════════════════════════════════════════ */}
            {mobileOpen && (
                <div className="md:hidden nav-font" style={{ position: "fixed", inset: 0, zIndex: 150 }}>
                    {/* Backdrop */}
                    <div
                        className="anim-fadein absolute inset-0"
                        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}
                        onClick={() => setMobileOpen(false)}
                    />

                    {/* Drawer panel */}
                    <div
                        className="anim-slideinr absolute right-0 bg-white shadow-2xl overflow-y-auto"
                        style={{
                            top: 64,
                            maxHeight: "55vh",   // ✅ half screen
                            width: "72%",
                            maxWidth: 280,
                            willChange: "transform",
                            borderRadius: "0 0 0 20px",
                        }}
                    >
                        {/* ── Drawer header with ✕ ── */}
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "10px 12px 8px",
                            borderBottom: "1px solid #f4f4f3",
                            position: "sticky", top: 0, background: "#fff", zIndex: 1,
                        }}>
                            <span style={{
                                fontSize: 10, fontWeight: 800, color: "#a1a1aa",
                                textTransform: "uppercase", letterSpacing: "0.12em",
                            }}>
                                Menu
                            </span>
                            {/* ✅ Close button */}
                            <button className="close-btn" onClick={() => setMobileOpen(false)}>
                                <FaTimes size={11} />
                            </button>
                        </div>

                        <div style={{ padding: "8px 10px 16px" }}>

                            {/* User profile card */}
                            {isAuthenticated && (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "10px 12px", borderRadius: 12, marginBottom: 6,
                                    background: "linear-gradient(135deg,#fffbeb,#fff7ed)",
                                    border: "1px solid #fde68a",
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                                        background: "linear-gradient(135deg,#f59e0b,#d97706)",
                                        color: "#fff", display: "flex", alignItems: "center",
                                        justifyContent: "center", fontWeight: 900, fontSize: 14,
                                        boxShadow: "0 2px 8px rgba(245,158,11,0.3)",
                                    }}>
                                        {user?.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontWeight: 700, fontSize: 13, color: "#1c1917", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {user?.name}
                                        </p>
                                        <p style={{ fontSize: 10, color: "#a8a29e", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {user?.email}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Nav links */}
                            {[
                                { icon: <FaHome size={12} />, label: "Home", path: "/" },
                                { icon: <FaShoppingCart size={12} />, label: `Cart${totalItems > 0 ? ` (${totalItems})` : ""}`, path: "/cart" },
                            ].map(({ icon, label, path }) => (
                                <button key={path} onClick={() => go(path)} className="drawer-item">
                                    <span className="d-icon">{icon}</span>
                                    {label}
                                </button>
                            ))}

                            {/* Account section */}
                            {isAuthenticated ? (
                                <>
                                    <div style={{ padding: "8px 10px 3px" }}>
                                        <p style={{ fontSize: 10, fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                                            Account
                                        </p>
                                    </div>
                                    {MENU_ITEMS.map(({ icon, label, path }) => (
                                        <button key={path} onClick={() => go(path)} className="drawer-item">
                                            <span className="d-icon">{icon}</span>
                                            {label}
                                        </button>
                                    ))}
                                    <div style={{ borderTop: "1px solid #f4f4f3", margin: "6px 0 3px" }} />
                                    <button onClick={handleLogout} className="drawer-item drawer-item-out">
                                        <span className="d-icon-red"><FaSignOutAlt size={11} /></span>
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <div style={{ display: "flex", gap: 8, paddingTop: 10 }}>
                                    <button onClick={() => go("/login")} style={{
                                        flex: 1, padding: "10px 0", borderRadius: 10,
                                        border: "1px solid #e5e7eb", fontSize: 13, fontWeight: 600,
                                        color: "#52525b", background: "#fff", cursor: "pointer",
                                    }}>Login</button>
                                    <button onClick={() => go("/register")} style={{
                                        flex: 1, padding: "10px 0", borderRadius: 10,
                                        fontSize: 13, fontWeight: 700, color: "#fff",
                                        background: "linear-gradient(135deg,#f59e0b,#fbbf24)",
                                        border: "none", cursor: "pointer",
                                        boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
                                    }}>Register</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ NAVBAR ══ */}
            <nav className={`nav-font sticky top-0 z-[100] transition-all duration-300 ${scrolled
                    ? "bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-lg shadow-zinc-900/[0.06]"
                    : "bg-white border-b border-stone-100"
                }`}>
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">

                    {/* LOGO */}
                    <button onClick={() => go("/")} className="flex items-center gap-2.5 shrink-0 group cursor-pointer">
                        <img src={Logo} alt="RV Gifts"
                            className="h-10 w-10 object-contain rounded-xl group-hover:scale-105 transition-transform duration-200" />
                        <span className="font-black text-[17px] text-zinc-800 whitespace-nowrap tracking-tight">
                            RV<span className="text-amber-500">Gifts</span>
                        </span>
                    </button>

                    {/* DESKTOP SEARCH */}
                    <div className="hidden md:flex flex-1 max-w-lg mx-4">
                        <SearchBar onSearch={handleSearch} />
                    </div>

                    {/* DESKTOP ACTIONS */}
                    <div className="hidden md:flex items-center gap-2 ml-auto">
                        <button onClick={() => go("/cart")}
                            className="cart-btn relative cursor-pointer p-2.5 rounded-xl hover:bg-amber-50 transition-all duration-200 group">
                            <FaShoppingCart size={17} className="cart-icon text-zinc-500" />
                            {totalItems > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[9px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-black shadow-sm">
                                    {totalItems > 9 ? "9+" : totalItems}
                                </span>
                            )}
                        </button>

                        <div className="w-px h-6 bg-stone-200 mx-1" />

                        {isAuthenticated ? (
                            <div className="relative" ref={userMenuRef}>
                                <button onClick={() => setUserMenuOpen(prev => !prev)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-all duration-200 cursor-pointer group">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
                                        {user?.name?.[0]?.toUpperCase()}
                                    </div>
                                    <span className="max-w-[90px] truncate text-sm font-semibold text-zinc-700">
                                        {user?.name?.split(" ")[0]}
                                    </span>
                                    <FaChevronDown size={9} className={`text-zinc-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                                </button>

                                {userMenuOpen && (
                                    <div className="anim-dropdown absolute right-0 mt-2.5 w-60 bg-white border border-stone-100 rounded-2xl shadow-2xl shadow-zinc-900/10 overflow-hidden z-50">
                                        <div className="px-4 py-3.5 border-b border-stone-100"
                                            style={{ background: "linear-gradient(135deg,#fffbeb,#fff7ed)" }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                                                    {user?.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-zinc-800 text-sm truncate">{user?.name}</p>
                                                    <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="py-1.5">
                                            {MENU_ITEMS.map(({ icon, label, path }) => (
                                                <button key={path} onClick={() => go(path)}
                                                    className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-zinc-600 hover:bg-amber-50 hover:text-amber-700 transition-all duration-150 cursor-pointer group/item">
                                                    <span className="w-7 h-7 rounded-lg bg-stone-100 group-hover/item:bg-amber-100 flex items-center justify-center text-zinc-400 group-hover/item:text-amber-600 transition-all">
                                                        {icon}
                                                    </span>
                                                    <span className="font-medium">{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="border-t border-stone-100 p-1.5">
                                            <button onClick={handleLogout}
                                                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-150 font-semibold cursor-pointer">
                                                <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                                                    <FaSignOutAlt size={11} />
                                                </span>
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-2 text-sm font-semibold">
                                <button onClick={() => go("/login")}
                                    className="px-4 py-2 rounded-xl border border-stone-200 text-zinc-600 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 cursor-pointer">
                                    Login
                                </button>
                                <button onClick={() => go("/register")}
                                    className="px-4 py-2 rounded-xl text-white font-bold cursor-pointer active:scale-95 hover:shadow-md hover:shadow-amber-200 transition-all duration-200"
                                    style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)" }}>
                                    Register
                                </button>
                            </div>
                        )}
                    </div>

                    {/* MOBILE: search + cart + hamburger */}
                    <div className="md:hidden ml-auto flex items-center gap-1">
                        <button onClick={() => setSearchOverlay(true)}
                            className="p-2.5 rounded-xl hover:bg-amber-50 transition-all duration-200 cursor-pointer text-zinc-500 hover:text-amber-500">
                            <FaSearch size={16} />
                        </button>
                        <button onClick={() => go("/cart")}
                            className="cart-btn relative cursor-pointer p-2.5 rounded-xl hover:bg-amber-50 transition-all duration-200">
                            <FaShoppingCart size={16} className="cart-icon text-zinc-500" />
                            {totalItems > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[9px] min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center font-black shadow-sm">
                                    {totalItems > 9 ? "9+" : totalItems}
                                </span>
                            )}
                        </button>

                        {/* Animated hamburger → X */}
                        <button
                            onClick={() => setMobileOpen(s => !s)}
                            className="p-2.5 rounded-xl hover:bg-stone-100 transition-all duration-200 cursor-pointer text-zinc-600"
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        >
                            <div style={{ width: 18, height: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <span className="hb-line" style={{ transform: mobileOpen ? "translateY(6px) rotate(45deg)" : "none" }} />
                                <span className="hb-line" style={{ opacity: mobileOpen ? 0 : 1, transform: mobileOpen ? "scaleX(0)" : "none" }} />
                                <span className="hb-line" style={{ transform: mobileOpen ? "translateY(-6px) rotate(-45deg)" : "none" }} />
                            </div>
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navbar;