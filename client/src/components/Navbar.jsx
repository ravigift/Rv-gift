import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
    FaSearch, FaShoppingCart, FaTimes, FaBars,
    FaUser, FaBox, FaSignOutAlt, FaHome,
    FaMapMarkerAlt, FaChevronDown, FaArrowRight,
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
        if (searchOverlay) {
            setTimeout(() => searchInputRef.current?.focus(), 150);
        } else {
            setSearchVal("");
        }
    }, [searchOverlay]);

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") setSearchOverlay(false); };
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
        { icon: <FaMapMarkerAlt size={12} />, label: "Saved Addresses", path: "/profile/addresses" },
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                .nav-font { font-family: 'DM Sans', sans-serif; }

                @keyframes fadeIn      { from{opacity:0} to{opacity:1} }
                @keyframes slideUp     { from{transform:translateY(100%)} to{transform:translateY(0)} }
                @keyframes slideInR    { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
                @keyframes dropDown    { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

                .anim-fadein   { animation: fadeIn 0.2s ease forwards; }
                .anim-slideup  { animation: slideUp 0.3s cubic-bezier(0.32,0.72,0,1) forwards; }
                .anim-slideinr { animation: slideInR 0.25s ease forwards; }
                .anim-dropdown { animation: dropDown 0.18s ease forwards; }

                .cart-icon { transition: all 0.25s ease; }
                .cart-btn:hover .cart-icon { color: #f59e0b; transform: rotate(-12deg) scale(1.1); }

                .search-input-clean {
                    background: transparent;
                    border: none; outline: none;
                    font-size: 1.05rem; font-weight: 600;
                    color: #111; width: 100%;
                    font-family: 'DM Sans', sans-serif;
                }
                .search-input-clean::placeholder { color: #bbb; font-weight: 500; }

                .pill-tag {
                    display: inline-flex; align-items: center; gap: 4px;
                    padding: 6px 12px; border-radius: 99px;
                    font-size: 12px; font-weight: 700;
                    background: #f5f4f2; color: #52525b;
                    border: 1.5px solid #e7e5e4;
                    cursor: pointer; transition: all 0.15s ease;
                    white-space: nowrap;
                }
                .pill-tag:hover { background: #fef3c7; border-color: #f59e0b; color: #b45309; }
                .pill-tag:active { transform: scale(0.95); }
            `}</style>

            {/* ── MOBILE SEARCH — Bottom Sheet ── */}
            {searchOverlay && (
                <div className="nav-font md:hidden fixed inset-0 z-[100] flex flex-col justify-end">

                    {/* Backdrop */}
                    <div className="anim-fadein absolute inset-0 bg-black/50"
                        onClick={() => setSearchOverlay(false)} />

                    {/* Bottom Sheet */}
                    <div className="anim-slideup relative bg-white rounded-t-3xl shadow-2xl z-10"
                        style={{ maxHeight: "85vh" }}>

                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-stone-200" />
                        </div>

                        <div className="px-5 pt-2 pb-6">

                            {/* Title */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-black text-zinc-800">Search Products</h2>
                                <button onClick={() => setSearchOverlay(false)}
                                    className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-zinc-500 hover:bg-stone-200 transition-colors cursor-pointer">
                                    <FaTimes size={12} />
                                </button>
                            </div>

                            {/* Search Input */}
                            <form onSubmit={handleOverlaySearch}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-stone-200 focus-within:border-amber-400 transition-colors"
                                    style={{ background: "#fafaf9" }}>
                                    <FaSearch size={15} className="text-amber-500 shrink-0" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchVal}
                                        onChange={e => setSearchVal(e.target.value)}
                                        placeholder="Search gifts, printing..."
                                        className="search-input-clean"
                                    />
                                    {searchVal && (
                                        <button type="button" onClick={() => setSearchVal("")}
                                            className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer shrink-0">
                                            <FaTimes size={12} />
                                        </button>
                                    )}
                                </div>

                                {/* Search Button */}
                                <button type="submit"
                                    className="w-full mt-3 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                                    style={{
                                        background: searchVal.trim() ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "#f1f0ee",
                                        color: searchVal.trim() ? "#111" : "#a8a29e",
                                        boxShadow: searchVal.trim() ? "0 6px 20px rgba(245,158,11,0.3)" : "none"
                                    }}>
                                    <FaSearch size={11} />
                                    Search
                                    {searchVal.trim() && <FaArrowRight size={10} />}
                                </button>
                            </form>

                            {/* Popular Searches */}
                            <div className="mt-5">
                                <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-3">Popular Searches</p>
                                <div className="flex flex-wrap gap-2">
                                    {POPULAR.map(tag => (
                                        <button key={tag} onClick={() => handleSearch(tag)} className="pill-tag">
                                            🔍 {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── NAVBAR ── */}
            <nav className={`nav-font sticky top-0 z-50 transition-all duration-300 ${scrolled
                    ? "bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-lg shadow-zinc-900/[0.06]"
                    : "bg-white border-b border-stone-100"
                }`}>
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">

                    {/* LOGO */}
                    <button onClick={() => go("/")}
                        className="flex items-center gap-2.5 shrink-0 group cursor-pointer">
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
                                    <span className="max-w-[90px] truncate text-sm font-semibold text-zinc-700">{user?.name?.split(" ")[0]}</span>
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
                                                <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center"><FaSignOutAlt size={11} /></span>
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
                        <button onClick={() => setMobileOpen(s => !s)}
                            className="p-2.5 rounded-xl hover:bg-stone-100 transition-all duration-200 cursor-pointer text-zinc-600">
                            {mobileOpen ? <FaTimes size={17} /> : <FaBars size={17} />}
                        </button>
                    </div>
                </div>

                {/* MOBILE DRAWER */}
                {mobileOpen && (
                    <>
                        <div className="anim-fadein md:hidden fixed inset-0 top-16 bg-black/30 z-40 backdrop-blur-sm"
                            onClick={() => setMobileOpen(false)} />
                        <div className="anim-slideinr nav-font md:hidden fixed top-16 right-0 bottom-0 w-[78%] max-w-xs bg-white z-50 shadow-2xl overflow-y-auto">
                            <div className="p-4 space-y-1">
                                {isAuthenticated && (
                                    <div className="flex items-center gap-3 px-3 py-3 rounded-2xl mb-3"
                                        style={{ background: "linear-gradient(135deg,#fffbeb,#fff7ed)", border: "1px solid #fde68a" }}>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-black shadow-sm">
                                            {user?.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-zinc-800 text-sm truncate">{user?.name}</p>
                                            <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                )}
                                {[
                                    { icon: <FaHome size={13} />, label: "Home", path: "/" },
                                    { icon: <FaShoppingCart size={13} />, label: `Cart${totalItems > 0 ? ` (${totalItems})` : ""}`, path: "/cart" },
                                ].map(({ icon, label, path }) => (
                                    <button key={path} onClick={() => go(path)}
                                        className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-amber-50 hover:text-amber-700 text-zinc-600 text-sm font-medium transition-all cursor-pointer group">
                                        <span className="w-7 h-7 rounded-lg bg-stone-100 group-hover:bg-amber-100 flex items-center justify-center text-zinc-400 group-hover:text-amber-600 transition-all">{icon}</span>
                                        {label}
                                    </button>
                                ))}
                                {isAuthenticated ? (
                                    <>
                                        <div className="pt-2 pb-1">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-3 mb-1">Account</p>
                                        </div>
                                        {MENU_ITEMS.map(({ icon, label, path }) => (
                                            <button key={path} onClick={() => go(path)}
                                                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-amber-50 hover:text-amber-700 text-zinc-600 text-sm font-medium transition-all cursor-pointer group">
                                                <span className="w-7 h-7 rounded-lg bg-stone-100 group-hover:bg-amber-100 flex items-center justify-center text-zinc-400 group-hover:text-amber-600 transition-all">{icon}</span>
                                                {label}
                                            </button>
                                        ))}
                                        <div className="border-t border-stone-100 mt-2 pt-2">
                                            <button onClick={handleLogout}
                                                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 text-sm font-semibold transition-all cursor-pointer group">
                                                <span className="w-7 h-7 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-all"><FaSignOutAlt size={12} /></span>
                                                Sign out
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex gap-2 pt-3">
                                        <button onClick={() => go("/login")}
                                            className="flex-1 py-3 rounded-xl border border-stone-200 text-sm font-semibold text-zinc-600 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer">
                                            Login
                                        </button>
                                        <button onClick={() => go("/register")}
                                            className="flex-1 py-3 rounded-xl text-white text-sm font-bold cursor-pointer active:scale-95 transition-all"
                                            style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)" }}>
                                            Register
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </nav>
        </>
    );
};

export default Navbar;