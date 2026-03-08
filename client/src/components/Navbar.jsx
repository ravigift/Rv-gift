import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
    FaSearch, FaShoppingCart, FaTimes, FaBars,
    FaUser, FaBox, FaSignOutAlt, FaHome,
    FaMapMarkerAlt, FaHeart, FaChevronDown,
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
    const userMenuRef = useRef(null);

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

    const go = (path) => { setMobileOpen(false); setUserMenuOpen(false); navigate(path); };

    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
        setMobileOpen(false);
        navigate("/login", { replace: true });
    };

    const handleSearch = (query) => {
        setMobileOpen(false);
        navigate(`/?search=${encodeURIComponent(query)}`);
    };

    const MENU_ITEMS = [
        { icon: <FaUser size={13} />, label: "My Profile", path: "/profile" },
        { icon: <FaBox size={13} />, label: "My Orders", path: "/orders" },
        { icon: <FaHeart size={13} />, label: "Wishlist", path: "/wishlist" },
        { icon: <FaMapMarkerAlt size={13} />, label: "Saved Addresses", path: "/profile/addresses" },
    ];

    return (
        <nav className={`sticky top-0 z-50 bg-white border-b transition-all duration-300 ${scrolled ? "shadow-lg shadow-zinc-900/5" : ""}`}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
                .nav-font { font-family: 'DM Sans', sans-serif; }
                .nav-item-hover {
                    position: relative;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .nav-item-hover::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 0;
                    height: 2px;
                    background: #f59e0b;
                    border-radius: 99px;
                    transition: width 0.2s ease;
                }
                .nav-item-hover:hover::after { width: 100%; }
                .nav-item-hover:hover { color: #d97706; }
            `}</style>

            <div className="nav-font max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">

                {/* LOGO */}
                <button onClick={() => go("/")}
                    className="flex items-center gap-2 hover:opacity-80 transition-all duration-200 cursor-pointer shrink-0 group">
                    <img src={Logo} alt="RV Gifts"
                        className="h-9 w-9 object-contain group-hover:scale-105 transition-transform duration-200" />
                    <span className="font-bold text-lg text-zinc-800 group-hover:text-amber-600 transition-colors duration-200">
                        RV<span className="text-amber-500">Gifts</span>
                    </span>
                </button>

                {/* DESKTOP SEARCH */}
                <div className="hidden md:flex flex-1 max-w-xl">
                    <SearchBar onSearch={handleSearch} />
                </div>

                {/* DESKTOP ACTIONS */}
                <div className="hidden md:flex items-center gap-5 ml-auto">

                    {/* CART */}
                    <button onClick={() => go("/cart")}
                        className="relative cursor-pointer group p-2 rounded-xl hover:bg-amber-50 transition-all duration-200">
                        <FaShoppingCart size={18} className="text-zinc-600 group-hover:text-amber-500 transition-colors duration-200" />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm">
                                {totalItems}
                            </span>
                        )}
                    </button>

                    {/* AUTH */}
                    {isAuthenticated ? (
                        <div className="relative" ref={userMenuRef}>
                            <button onClick={() => setUserMenuOpen(prev => !prev)}
                                className="flex items-center gap-2 font-semibold px-3 py-2 rounded-xl hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all duration-200 cursor-pointer group">
                                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black group-hover:bg-amber-600 transition-colors duration-200 shadow-sm">
                                    {user?.name?.[0]?.toUpperCase()}
                                </div>
                                <span className="max-w-[100px] truncate text-sm text-zinc-700 group-hover:text-amber-600 transition-colors duration-200">
                                    {user?.name?.split(" ")[0]}
                                </span>
                                <FaChevronDown size={10} className={`text-zinc-400 group-hover:text-amber-500 transition-all duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                            </button>

                            {/* DROPDOWN */}
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-2xl shadow-2xl shadow-zinc-900/10 overflow-hidden z-50"
                                    style={{ animation: "fadeDown 0.15s ease forwards" }}>
                                    <style>{`@keyframes fadeDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }`}</style>

                                    {/* Header */}
                                    <div className="px-4 py-3 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-100">
                                        <p className="text-xs text-zinc-400 font-medium">Signed in as</p>
                                        <p className="font-bold text-zinc-800 text-sm truncate">{user?.name}</p>
                                        <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-1">
                                        {MENU_ITEMS.map(({ icon, label, path }) => (
                                            <button key={path} onClick={() => go(path)}
                                                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-zinc-600 hover:bg-amber-50 hover:text-amber-700 transition-all duration-150 cursor-pointer group/item">
                                                <span className="text-zinc-400 group-hover/item:text-amber-500 transition-colors duration-150">{icon}</span>
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Logout */}
                                    <div className="border-t border-stone-100">
                                        <button onClick={handleLogout}
                                            className="w-full px-4 py-3 flex items-center gap-3 text-sm text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-150 font-semibold cursor-pointer">
                                            <FaSignOutAlt size={13} /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-2 text-sm font-semibold">
                            <NavLink to="/login"
                                className="px-4 py-2 rounded-xl border border-stone-200 text-zinc-600 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 cursor-pointer">
                                Login
                            </NavLink>
                            <NavLink to="/register"
                                className="px-4 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md hover:shadow-amber-200 active:scale-95 transition-all duration-200 cursor-pointer">
                                Register
                            </NavLink>
                        </div>
                    )}
                </div>

                {/* MOBILE TOGGLE */}
                <button className="md:hidden ml-auto p-2 rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-all duration-200 cursor-pointer"
                    onClick={() => setMobileOpen(s => !s)}>
                    {mobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                </button>
            </div>

            {/* MOBILE MENU */}
            {mobileOpen && (
                <div className="nav-font md:hidden border-t bg-white px-4 py-4 space-y-1"
                    style={{ animation: "fadeDown 0.2s ease forwards" }}>
                    <div className="mb-3">
                        <SearchBar onSearch={handleSearch} />
                    </div>

                    {isAuthenticated && (
                        <div className="flex items-center gap-3 px-3 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl mb-2 border border-amber-100">
                            <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-black shadow-sm">
                                {user?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-zinc-800 text-sm">{user?.name}</p>
                                <p className="text-xs text-zinc-400">{user?.email}</p>
                            </div>
                        </div>
                    )}

                    {[
                        { icon: <FaHome size={14} />, label: "Home", path: "/" },
                        { icon: <FaShoppingCart size={14} />, label: `Cart${totalItems > 0 ? ` (${totalItems})` : ""}`, path: "/cart" },
                    ].map(({ icon, label, path }) => (
                        <button key={path} onClick={() => go(path)}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-amber-50 hover:text-amber-700 text-zinc-600 text-sm font-medium transition-all duration-150 cursor-pointer group">
                            <span className="text-zinc-400 group-hover:text-amber-500 transition-colors">{icon}</span>
                            {label}
                        </button>
                    ))}

                    {isAuthenticated ? (
                        <>
                            {MENU_ITEMS.map(({ icon, label, path }) => (
                                <button key={path} onClick={() => go(path)}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-amber-50 hover:text-amber-700 text-zinc-600 text-sm font-medium transition-all duration-150 cursor-pointer group">
                                    <span className="text-zinc-400 group-hover:text-amber-500 transition-colors">{icon}</span>
                                    {label}
                                </button>
                            ))}
                            <div className="border-t border-stone-100 pt-1 mt-1">
                                <button onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 text-sm font-semibold transition-all duration-150 cursor-pointer">
                                    <FaSignOutAlt size={14} /> Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => go("/login")}
                                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-zinc-600 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 cursor-pointer">
                                Login
                            </button>
                            <button onClick={() => go("/register")}
                                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 active:scale-95 transition-all duration-200 cursor-pointer">
                                Register
                            </button>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;