import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../hooks/useCart";
import { imgUrl } from "../utils/imageUrl";
import { FaStar, FaRegStar, FaSearch, FaFire, FaArrowRight, FaShoppingCart } from "react-icons/fa";

/* ── Skeleton Card ── */
const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden animate-pulse">
        <div className="h-52 bg-stone-200" />
        <div className="p-4 space-y-3">
            <div className="h-4 bg-stone-200 rounded w-3/4" />
            <div className="h-3 bg-stone-100 rounded w-1/2" />
            <div className="h-6 bg-stone-200 rounded w-1/3 mt-2" />
            <div className="flex gap-2 mt-2">
                <div className="h-9 bg-stone-100 rounded-xl flex-1" />
                <div className="h-9 bg-emerald-100 rounded-xl flex-1" />
            </div>
        </div>
    </div>
);

/* ── Product Card ── */
const ProductCard = ({ product, onAddToCart, onBuyNow }) => {
    const navigate = useNavigate();
    const { cartItems } = useCart();
    const inCart = cartItems.some(i => i._id === product._id);

    // ✅ Optimized 400px card image — WebP auto format
    const imageUrl = imgUrl.card(product.images?.[0]?.url || "");
    const rating = product.rating || 0;
    const numReviews = product.numReviews || 0;
    const [imgLoaded, setImgLoaded] = useState(false);

    return (
        <div onClick={() => navigate(`/products/${product._id}`)}
            className="group bg-white rounded-2xl border border-stone-100 hover:border-amber-200 hover:shadow-2xl shadow-sm transition-all duration-300 cursor-pointer flex flex-col overflow-hidden select-none">
            <div className="relative h-52 bg-stone-50 flex items-center justify-center overflow-hidden">
                {!imgLoaded && <div className="absolute inset-0 bg-stone-100 animate-pulse" />}
                <img
                    src={imageUrl || "https://via.placeholder.com/400x400?text=No+Image"}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={400}
                    onLoad={() => setImgLoaded(true)}
                    onError={e => { e.target.src = "https://via.placeholder.com/400x400?text=No+Image"; setImgLoaded(true); }}
                    className={`w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                />
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isCustomizable && (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">✏️ Custom</span>
                    )}
                    {product.inStock === false && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Out of Stock</span>
                    )}
                </div>
                <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/5 transition-all duration-300" />
            </div>
            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-zinc-800 text-sm line-clamp-1 mb-1 group-hover:text-amber-600 transition-colors">{product.name}</h3>
                <div className="flex items-center gap-1.5 mb-2">
                    {numReviews > 0 ? (
                        <>
                            <span className={`flex items-center gap-0.5 text-white text-[11px] font-bold px-1.5 py-0.5 rounded ${rating >= 4 ? "bg-emerald-500" : rating >= 3 ? "bg-amber-400" : "bg-red-400"}`}>
                                {rating.toFixed(1)} <FaStar size={8} />
                            </span>
                            <span className="text-[11px] text-zinc-400">({numReviews})</span>
                        </>
                    ) : (
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => <FaRegStar key={s} size={10} className="text-stone-300" />)}
                            <span className="text-[10px] text-zinc-400 ml-1">No reviews</span>
                        </div>
                    )}
                </div>
                <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed mb-3">{product.description}</p>
                <div className="mt-auto">
                    <p className="text-zinc-900 text-xl font-black mb-3">₹{product.price.toLocaleString("en-IN")}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={e => { e.stopPropagation(); if (!inCart) onAddToCart(product); }}
                            disabled={inCart || product.inStock === false}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${inCart ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default" : product.inStock === false ? "bg-stone-100 text-stone-400 cursor-not-allowed" : "bg-zinc-900 text-white hover:bg-zinc-700 hover:shadow-md shadow-sm"}`}>
                            {inCart ? <>✔ In Cart</> : <><FaShoppingCart size={10} /> Add</>}
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); onBuyNow(product); }}
                            disabled={product.inStock === false}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 active:scale-95 hover:shadow-md shadow-sm shadow-amber-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ════════════════════════════════════════
   MAIN HOME
════════════════════════════════════════ */
const Home = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get("search") || "";
    const activeCategory = searchParams.get("category") || "";
    const { addItem } = useCart();

    // ✅ Single source of truth — fetch ALL products ONCE
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // Only fetch if not already loaded
        if (allProducts.length > 0) return;
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError("");
                const { data } = await api.get("/products");
                setAllProducts(data);
            } catch {
                setError("Failed to load products. Please check your connection.");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []); // ✅ Empty deps — fetch once, never again

    // ✅ Client-side filtering — no extra API calls
    const products = useMemo(() => {
        let filtered = allProducts;

        if (activeCategory) {
            filtered = filtered.filter(p =>
                p.category?.toLowerCase() === activeCategory.toLowerCase()
            );
        }

        if (searchQuery && searchQuery.trim().length >= 2) {
            const q = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.tags?.some(t => t.toLowerCase().includes(q))
            );
        }

        return filtered;
    }, [allProducts, searchQuery, activeCategory]);

    // ✅ Categories derived from allProducts — no extra call
    const categories = useMemo(() =>
        [...new Set(allProducts.map(p => p.category).filter(Boolean))],
        [allProducts]
    );

    const handleAddToCart = useCallback((product) => addItem(product), [addItem]);
    const handleBuyNow = useCallback((product) => {
        navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1 } } });
    }, [navigate]);

    const setCategory = (cat) => {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (cat) params.category = cat;
        setSearchParams(params);
    };

    const clearFilters = () => setSearchParams({});
    const formatCat = (cat) => cat.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="min-h-screen bg-stone-100">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
                .hero-font { font-family: 'Playfair Display', serif; }
                .body-font { font-family: 'DM Sans', sans-serif; }
                @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
                @keyframes pulse-ring { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245,158,11,0.4); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(245,158,11,0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245,158,11,0); } }
                @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .shimmer-text { background: linear-gradient(90deg, #f59e0b, #fcd34d, #f59e0b, #fbbf24); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 3s linear infinite; }
                .hero-anim-1 { animation: fadeUp 0.6s ease 0.1s both; }
                .hero-anim-2 { animation: fadeUp 0.6s ease 0.25s both; }
                .hero-anim-3 { animation: fadeUp 0.6s ease 0.4s both; }
                .hero-anim-4 { animation: fadeUp 0.6s ease 0.55s both; }
                .stats-anim { animation: fadeRight 0.6s ease 0.3s both; }
                .float-1 { animation: float 3.5s ease-in-out infinite; }
                .float-2 { animation: float 3.5s ease-in-out 0.5s infinite; }
                .float-3 { animation: float 3.5s ease-in-out 1s infinite; }
                .pulse-btn { animation: pulse-ring 2s ease-in-out infinite; }
                .animated-bg { background: linear-gradient(135deg, #0a0f1a, #111827, #0f172a, #1a1207); background-size: 300% 300%; animation: gradientMove 12s ease infinite; }
                .glass-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); backdrop-filter: blur(8px); }
                .gold-border { border: 1px solid rgba(245,158,11,0.3); background: rgba(245,158,11,0.06); }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .btn-hover { transition: all 0.2s ease; }
                .btn-hover:hover { transform: translateY(-2px); }
                .btn-hover:active { transform: scale(0.97); }
            `}</style>

            {/* ── HERO ── */}
            {!searchQuery && !activeCategory && (
                <div className="body-font animated-bg relative w-full overflow-hidden" style={{ minHeight: "500px" }}>
                    <div className="absolute top-[-80px] right-[-80px] w-[500px] h-[500px] rounded-full pointer-events-none"
                        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 65%)" }} />
                    <div className="absolute bottom-[-60px] left-[10%] w-[350px] h-[350px] rounded-full pointer-events-none"
                        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 65%)" }} />
                    <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
                        style={{ backgroundImage: "radial-gradient(circle, #f59e0b 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
                    <div className="absolute top-0 right-[28%] w-px h-full pointer-events-none"
                        style={{ background: "linear-gradient(to bottom, transparent, rgba(245,158,11,0.15), transparent)" }} />

                    <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                            <div className="flex-1 max-w-xl text-center md:text-left">
                                <div className="hero-anim-1 inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full gold-border">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-btn" />
                                    <span className="text-amber-400 text-[11px] font-black tracking-[0.18em] uppercase">Premium Gift Store</span>
                                </div>
                                <h1 className="hero-font hero-anim-2 text-[2.6rem] md:text-[3.6rem] font-black text-white leading-[1.08] mb-5 tracking-tight">
                                    Gifts That{" "}
                                    <span className="shimmer-text italic">Speak</span>
                                    <br />
                                    <span className="text-zinc-300">From The Heart</span>
                                </h1>
                                <p className="hero-anim-3 text-zinc-400 text-sm md:text-[15px] mb-8 leading-[1.75] max-w-sm mx-auto md:mx-0">
                                    Handpicked gifts for every occasion. Personalize with your own touch — because every gift tells a story.
                                </p>
                                <div className="hero-anim-4 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                                    <button
                                        onClick={() => document.getElementById("products-section").scrollIntoView({ behavior: "smooth" })}
                                        className="btn-hover group/btn flex items-center justify-center gap-2.5 font-black px-8 py-3.5 rounded-2xl text-sm cursor-pointer"
                                        style={{ background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)", color: "#111", boxShadow: "0 8px 28px rgba(245,158,11,0.4), 0 2px 8px rgba(0,0,0,0.3)" }}>
                                        Shop Now
                                        <FaArrowRight size={11} className="group-hover/btn:translate-x-1 transition-transform duration-200" />
                                    </button>
                                    <button
                                        onClick={() => setCategory("custom-tshirt")}
                                        className="btn-hover flex items-center justify-center gap-2 font-bold px-8 py-3.5 rounded-2xl text-sm text-white cursor-pointer glass-card hover:border-amber-500/40 transition-all duration-200">
                                        Customize 🎨
                                    </button>
                                </div>
                            </div>

                            <div className="stats-anim flex flex-col gap-3 items-center md:items-end shrink-0">
                                <div className="flex gap-3">
                                    {[
                                        { val: `${allProducts.length}+`, label: "Products", icon: "🎁" },
                                        { val: `${categories.length}+`, label: "Categories", icon: "🗂️" },
                                    ].map(({ val, label, icon }) => (
                                        <div key={label} className="glass-card rounded-2xl px-5 py-4 text-center hover:scale-105 transition-transform duration-200 cursor-default">
                                            <p className="text-lg mb-1">{icon}</p>
                                            <p className="font-black text-amber-400 text-2xl leading-none">{val}</p>
                                            <p className="text-zinc-500 text-[11px] mt-1 font-medium">{label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2.5">
                                    {[
                                        { icon: "✏️", text: "Custom Gifts", cls: "float-1" },
                                        { icon: "🎁", text: "Gift Wrapping", cls: "float-2" },
                                        { icon: "⚡", text: "Fast Delivery", cls: "float-3" },
                                    ].map(({ icon, text, cls }) => (
                                        <div key={text} className={`glass-card ${cls} rounded-xl px-3 py-2.5 text-center cursor-default hover:border-amber-500/30 transition-colors duration-200`}>
                                            <p className="text-xl">{icon}</p>
                                            <p className="text-zinc-400 text-[10px] font-semibold mt-0.5 whitespace-nowrap">{text}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="gold-border rounded-xl px-4 py-2 flex items-center gap-2 cursor-default">
                                    <span className="text-amber-400 text-xs">✦</span>
                                    <span className="text-amber-300/80 text-[11px] font-semibold tracking-wide">Pan-India Delivery</span>
                                    <span className="text-amber-400 text-xs">✦</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                        <svg viewBox="0 0 1440 50" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                            <path d="M0 50L80 42C160 34 320 18 480 13C640 8 800 14 960 20C1120 26 1280 32 1360 35L1440 38V50H0Z" fill="#f1f0ef" />
                        </svg>
                    </div>
                </div>
            )}

            {/* ── Products Section ── */}
            <div id="products-section" className="body-font max-w-7xl mx-auto px-4 py-8">

                {/* Category Pills */}
                {categories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                        <button onClick={() => setCategory("")}
                            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 cursor-pointer active:scale-95 ${!activeCategory ? "bg-zinc-900 text-white border-zinc-900 shadow-sm" : "bg-white text-zinc-600 border-stone-200 hover:border-zinc-400 hover:bg-stone-50"}`}>
                            All
                        </button>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setCategory(cat)}
                                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95 ${activeCategory === cat ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200" : "bg-white text-zinc-600 border-stone-200 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50"}`}>
                                {formatCat(cat)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                            {searchQuery ? (
                                <><FaSearch size={16} className="text-amber-500" /> Results for "{searchQuery}"</>
                            ) : activeCategory ? (
                                <><FaFire size={16} className="text-amber-500" /> {formatCat(activeCategory)}</>
                            ) : (
                                <><FaFire size={16} className="text-amber-500" /> All Products</>
                            )}
                        </h2>
                        {!loading && (
                            <p className="text-zinc-400 text-xs mt-0.5">
                                {products.length} product{products.length !== 1 ? "s" : ""} found
                            </p>
                        )}
                    </div>
                    {(searchQuery || activeCategory) && (
                        <button onClick={clearFilters}
                            className="text-xs text-amber-600 font-bold hover:text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95">
                            Clear ✕
                        </button>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
                        <p className="text-red-500 font-bold mb-3">⚠️ {error}</p>
                        <button onClick={() => { setAllProducts([]); setError(""); }}
                            className="bg-zinc-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors duration-200 cursor-pointer active:scale-95">
                            Retry
                        </button>
                    </div>
                )}

                {/* Skeleton */}
                {loading && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && products.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-300">
                        <p className="text-5xl mb-3">🎁</p>
                        <p className="text-zinc-600 font-bold mb-1">No products found</p>
                        <p className="text-zinc-400 text-sm mb-5">Try a different search or category</p>
                        <button onClick={clearFilters}
                            className="text-amber-600 font-bold hover:text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-5 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer active:scale-95">
                            Browse All Products
                        </button>
                    </div>
                )}

                {/* Grid */}
                {!loading && !error && products.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map(product => (
                            <ProductCard key={product._id} product={product}
                                onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;