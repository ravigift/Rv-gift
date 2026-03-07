import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../hooks/useCart";
import { FaStar, FaRegStar, FaSearch, FaFire, FaGift, FaArrowRight, FaTruck, FaShieldAlt, FaHeadset, FaShoppingCart } from "react-icons/fa";

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
    const imageUrl = product.images?.[0]?.url || "https://via.placeholder.com/400x400?text=No+Image";
    const rating = product.rating || 0;
    const numReviews = product.numReviews || 0;
    const [imgLoaded, setImgLoaded] = useState(false);

    return (
        <div onClick={() => navigate(`/products/${product._id}`)}
            className="group bg-white rounded-2xl border border-stone-100 hover:border-amber-200 hover:shadow-2xl shadow-sm transition-all duration-300 cursor-pointer flex flex-col overflow-hidden">

            {/* Image */}
            <div className="relative h-52 bg-stone-50 flex items-center justify-center overflow-hidden">
                {!imgLoaded && <div className="absolute inset-0 bg-stone-100 animate-pulse" />}
                <img src={imageUrl} alt={product.name}
                    onLoad={() => setImgLoaded(true)}
                    onError={e => { e.target.src = "https://via.placeholder.com/400x400?text=No+Image"; setImgLoaded(true); }}
                    className={`w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`} />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isCustomizable && (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            ✏️ Custom
                        </span>
                    )}
                    {product.inStock === false && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Out of Stock
                        </span>
                    )}
                </div>

                {/* Quick add overlay on hover */}
                <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/5 transition-all duration-300" />
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-zinc-800 text-sm line-clamp-1 mb-1 group-hover:text-amber-600 transition-colors">
                    {product.name}
                </h3>

                {/* Rating */}
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
                    <p className="text-zinc-900 text-xl font-black mb-3">
                        ₹{product.price.toLocaleString("en-IN")}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={e => { e.stopPropagation(); if (!inCart) onAddToCart(product); }}
                            disabled={inCart || product.inStock === false}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${inCart
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                    : product.inStock === false
                                        ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                                        : "bg-zinc-900 text-white hover:bg-zinc-700 shadow-sm"
                                }`}>
                            {inCart ? <>✔ In Cart</> : <><FaShoppingCart size={10} /> Add</>}
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); onBuyNow(product); }}
                            disabled={product.inStock === false}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-sm shadow-amber-100 transition-all disabled:opacity-50">
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Main Home ── */
const Home = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get("search") || "";
    const activeCategory = searchParams.get("category") || "";
    const { addItem } = useCart();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [allProducts, setAllProducts] = useState([]);

    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];

    useEffect(() => {
        api.get("/products").then(({ data }) => setAllProducts(data)).catch(() => { });
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError("");
                const params = {};
                if (searchQuery) params.search = searchQuery;
                if (activeCategory) params.category = activeCategory;
                const { data } = await api.get("/products", { params });
                setProducts(data);
            } catch (err) {
                setError("Failed to load products. Please check your connection.");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [searchQuery, activeCategory]);

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
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
                .hero-font { font-family: 'Playfair Display', serif; }
                .body-font { font-family: 'DM Sans', sans-serif; }
                @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                .float { animation: float 4s ease-in-out infinite; }
                .shimmer-text {
                    background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b, #fbbf24);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 3s linear infinite;
                }
                .fade-up { animation: fadeUp 0.5s ease forwards; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}</style>

            {/* HERO */}
            {!searchQuery && !activeCategory && (
                <div className="body-font relative w-full overflow-hidden bg-zinc-950" style={{ minHeight: "440px" }}>
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: `radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f59e0b 0%, transparent 40%), radial-gradient(circle at 60% 80%, #f59e0b 0%, transparent 30%)` }} />
                    <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-amber-500/20" />
                    <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full border border-amber-500/10" />
                    <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full border border-amber-500/10" />

                    <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="flex-1 text-center md:text-left fade-up">
                                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 mb-5">
                                    <FaGift size={11} className="text-amber-400" />
                                    <span className="text-amber-400 text-xs font-bold tracking-widest uppercase">Premium Gift Store</span>
                                </div>
                                <h1 className="hero-font text-4xl md:text-6xl font-black text-white leading-tight mb-4">
                                    Gifts That{" "}<span className="shimmer-text">Speak</span><br />From The Heart
                                </h1>
                                <p className="text-zinc-400 text-sm md:text-base mb-8 max-w-md leading-relaxed">
                                    Handpicked gifts for every occasion & loved ones. Customize with your personal touch.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                                    <button onClick={() => document.getElementById("products-section").scrollIntoView({ behavior: "smooth" })}
                                        className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-black px-8 py-3.5 rounded-2xl text-sm transition-all active:scale-95 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50">
                                        Shop Now <FaArrowRight size={12} />
                                    </button>
                                    <button onClick={() => setCategory("custom-tshirt")}
                                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition-all border border-white/20 hover:border-white/40">
                                        Customize 🎨
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 items-center md:items-end">
                                <div className="flex gap-3">
                                    {[
                                        { val: `${allProducts.length}+`, label: "Products" },
                                        { val: `${categories.length}+`, label: "Categories" },
                                        { val: "FREE", label: "Delivery ₹499+" },
                                    ].map(({ val, label }) => (
                                        <div key={label} className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur rounded-2xl px-5 py-4 text-center transition-colors">
                                            <p className="font-black text-amber-400 text-2xl">{val}</p>
                                            <p className="text-zinc-400 text-xs mt-0.5">{label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    {[
                                        { icon: "✏️", text: "Custom Gifts" },
                                        { icon: "🎁", text: "Gift Wrapping" },
                                        { icon: "⚡", text: "Fast Delivery" },
                                    ].map(({ icon, text }, i) => (
                                        <div key={text}
                                            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 rounded-xl px-3 py-2 text-center float cursor-default transition-all"
                                            style={{ animationDelay: `${i * 0.5}s` }}>
                                            <p className="text-lg">{icon}</p>
                                            <p className="text-zinc-400 text-[10px] font-medium mt-0.5 whitespace-nowrap">{text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0">
                        <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 40L60 33C120 27 240 13 360 10C480 7 600 13 720 18C840 23 960 27 1080 25C1200 23 1320 13 1380 8L1440 3V40H0Z" fill="#f1f0ef" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Trust Bar */}
            {!searchQuery && !activeCategory && (
                <div className="body-font bg-white border-b border-stone-100">
                    <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-center gap-8 overflow-x-auto scrollbar-hide">
                        {[
                            { icon: <FaTruck className="text-amber-500" size={13} />, text: "Free delivery above ₹499" },
                            { icon: <FaShieldAlt className="text-emerald-500" size={13} />, text: "100% Secure Orders" },
                            { icon: <span className="text-sm">✏️</span>, text: "Custom Printing Available" },
                            { icon: <FaHeadset className="text-blue-500" size={13} />, text: "WhatsApp Support" },
                        ].map(({ icon, text }) => (
                            <div key={text} className="flex items-center gap-2 shrink-0 hover:text-amber-600 transition-colors group cursor-default">
                                {icon}
                                <span className="text-xs font-semibold text-zinc-600 group-hover:text-amber-600 transition-colors">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Products Section */}
            <div id="products-section" className="body-font max-w-7xl mx-auto px-4 py-8">

                {/* Category Pills */}
                {categories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                        <button onClick={() => setCategory("")}
                            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 ${!activeCategory ? "bg-zinc-900 text-white border-zinc-900 shadow-sm" : "bg-white text-zinc-600 border-stone-200 hover:border-zinc-400 hover:bg-stone-50"}`}>
                            All
                        </button>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setCategory(cat)}
                                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 whitespace-nowrap ${activeCategory === cat ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200" : "bg-white text-zinc-600 border-stone-200 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50"}`}>
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
                            className="text-xs text-amber-600 font-bold hover:text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all">
                            Clear ✕
                        </button>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
                        <p className="text-red-500 font-bold mb-3">⚠️ {error}</p>
                        <button onClick={() => window.location.reload()}
                            className="bg-zinc-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors">
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
                            className="text-amber-600 font-bold hover:text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-5 py-2 rounded-xl text-sm transition-all">
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