import React, { useEffect, useMemo, useCallback, useRef, memo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { useCart } from "../hooks/useCart";
import { FaStar, FaRegStar, FaSearch, FaFire, FaArrowRight, FaShoppingCart, FaPencilAlt, FaBolt } from "react-icons/fa";
import { imgUrl } from "../utils/imageUrl";

// ─── Constants ───────────────────────────────────────────────────────────────
const LATEST_COUNT = 6;      // products shown on homepage
const FALLBACK_IMG = "https://via.placeholder.com/400x400?text=No+Image";

const calcDiscount = (mrp, price) => {
    const m = Number(mrp);
    const p = Number(price);
    if (!m || !p || m <= p) return null;
    const pct = Math.round(((m - p) / m) * 100);
    return pct >= 1 && pct <= 80 ? pct : null;
};

// ─── 3D Tilt Hook ──────────────────────────────────────────────────────────
// Lightweight pointer-tracking tilt — degrees stay small so it reads as
// "glass catching light", not a gimmick. Disabled on touch devices and
// respects prefers-reduced-motion automatically via the small max angle.
const useTilt = (max = 7) => {
    const ref = useRef(null);

    const onMouseMove = useCallback((e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;   // 0 → 1
        const py = (e.clientY - rect.top) / rect.height;   // 0 → 1
        const rotateY = (px - 0.5) * (max * 2);
        const rotateX = (0.5 - py) * (max * 2);
        el.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
        el.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
        el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    }, [max]);

    const onMouseLeave = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--mx", "50%");
        el.style.setProperty("--my", "50%");
    }, []);

    return { ref, onMouseMove, onMouseLeave };
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = memo(() => (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden animate-pulse flex flex-col"
        style={{ height: "100%" }}>
        <div className="flex-shrink-0 bg-stone-200" style={{ height: 200 }} />
        <div className="p-3 flex flex-col flex-1 gap-2">
            <div className="h-4 bg-stone-200 rounded w-3/4" />
            <div className="h-3 bg-stone-100 rounded w-1/2" />
            <div className="h-3 bg-stone-100 rounded w-1/3" />
            <div className="h-5 bg-stone-200 rounded w-2/5 mt-1" />
            <div className="flex gap-2 mt-auto">
                <div className="h-9 bg-stone-100 rounded-xl flex-1" />
                <div className="h-9 bg-amber-100 rounded-xl flex-1" />
            </div>
        </div>
    </div>
));
SkeletonCard.displayName = "SkeletonCard";

// ─── Compact Product Card (home-page specific) ────────────────────────────────
const HomeProductCard = memo(({ product, onAddToCart, onBuyNow }) => {
    const navigate = useNavigate();
    const { cartItems } = useCart();
    const inCart = cartItems.some(i => i._id === product._id);
    const { ref: tiltRef, onMouseMove, onMouseLeave } = useTilt(6);

    const [imgLoaded, setImgLoaded] = React.useState(false);
    const [imgError, setImgError] = React.useState(false);

    const imageUrl = imgError
        ? FALLBACK_IMG
        : imgUrl.card(product?.images?.[0]?.url || product?.image || "");

    const rating = product.rating || 0;
    const numReviews = product.numReviews || 0;
    const discountPct = calcDiscount(product.mrp, product.price);
    const hasDiscount = discountPct !== null;
    const isOutOfStock = product.inStock === false ||
        (product.stock != null && Number(product.stock) === 0);

    const productUrl = `/products/${product.slug || product._id}`;

    const handleAddToCart = useCallback((e) => {
        e.stopPropagation();
        if (inCart || isOutOfStock) return;
        onAddToCart(product);
    }, [inCart, isOutOfStock, onAddToCart, product]);

    const handleBuyNow = useCallback((e) => {
        e.stopPropagation();
        if (isOutOfStock) return;
        onBuyNow(product);
    }, [isOutOfStock, onBuyNow, product]);

    return (
        <div
            ref={tiltRef}
            onClick={() => navigate(productUrl)}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className="product-card-3d group bg-white rounded-2xl border border-stone-100 cursor-pointer flex flex-col select-none"
            style={{ height: "100%" }}
        >
            {/* Glass shine sweep — follows cursor via --mx/--my */}
            <div className="card-shine" aria-hidden="true" />

            {/* IMAGE — fixed 220px, white bg, image fills fully */}
            <div
                className="relative flex-shrink-0 overflow-hidden"
                style={{
                    height: 220,
                    background: "#fff",
                    borderBottom: "1px solid #f5f5f4",
                }}
            >
                {/* Skeleton shimmer until image loads */}
                {!imgLoaded && (
                    <div className="absolute inset-0 animate-pulse"
                        style={{ background: "linear-gradient(110deg,#f5f5f4 30%,#fafaf9 50%,#f5f5f4 70%)", backgroundSize: "200% 100%" }} />
                )}

                {/* Product image — white bg, contain, no crop, no blur */}
                <img
                    src={imageUrl}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    width={600}
                    height={600}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => { setImgError(true); setImgLoaded(true); }}
                    className="product-img-zoom"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        objectPosition: "center",
                        padding: "12px",
                        opacity: imgLoaded ? 1 : 0,
                        transition: "transform 0.4s ease, opacity 0.3s ease",
                        filter: isOutOfStock ? "grayscale(60%)" : "none",
                        zIndex: 1,
                    }}
                />

                {/* Badges — top left */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                    {product.isCustomizable && !isOutOfStock && (
                        <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow"
                            style={{ backdropFilter: "blur(4px)" }}>
                            ✏️ Custom
                        </span>
                    )}
                    {isOutOfStock && (
                        <span className="text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow"
                            style={{ background: "rgba(24,24,27,0.82)", backdropFilter: "blur(6px)" }}>
                            SOLD OUT
                        </span>
                    )}
                </div>

                {/* Discount badge — top right */}
                {hasDiscount && !isOutOfStock && (
                    <div className="absolute top-2.5 right-2.5 z-10">
                        <span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                            {discountPct}% off
                        </span>
                    </div>
                )}
            </div>

            {/* CONTENT — flex column, each section fixed height */}
            <div className="flex flex-col flex-1 p-3" style={{ transform: "translateZ(20px)" }}>

                {/* Title: 2-line clamp */}
                <h3
                    className="font-bold text-zinc-800 text-[13px] leading-snug group-hover:text-amber-600 transition-colors mb-2"
                    style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: "2.6em",
                    }}
                >
                    {product.name}
                </h3>

                {/* Stars — fixed height */}
                <div style={{ height: 20, display: "flex", alignItems: "center", marginBottom: 6, flexShrink: 0 }}>
                    {numReviews > 0 ? (
                        <>
                            <span className={`flex items-center gap-0.5 text-white text-[10px] font-black px-1.5 py-0.5 rounded ${rating >= 4 ? "bg-emerald-500" : rating >= 3 ? "bg-amber-400" : "bg-red-400"}`}>
                                {rating.toFixed(1)} <FaStar size={7} />
                            </span>
                            <span className="text-[10px] text-zinc-400 ml-1.5">({numReviews})</span>
                        </>
                    ) : (
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => <FaRegStar key={s} size={9} className="text-stone-200" />)}
                            <span className="text-[9px] text-zinc-300 ml-1">No reviews</span>
                        </div>
                    )}
                </div>

                {/* Price — fixed height */}
                <div style={{ minHeight: 44, marginBottom: 10, flexShrink: 0 }}>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className={`text-xl font-black leading-none ${isOutOfStock ? "text-zinc-400" : "text-zinc-900"}`}>
                            ₹{Number(product.price).toLocaleString("en-IN")}
                        </span>
                        {hasDiscount && !isOutOfStock && (
                            <span className="text-xs font-medium text-zinc-400 line-through leading-none">
                                ₹{Number(product.mrp).toLocaleString("en-IN")}
                            </span>
                        )}
                    </div>
                    {hasDiscount && !isOutOfStock ? (
                        <p className="text-[10px] text-green-600 font-bold mt-0.5">
                            Save ₹{(Number(product.mrp) - Number(product.price)).toLocaleString("en-IN")}
                        </p>
                    ) : (
                        <p className="text-[10px] text-transparent select-none mt-0.5">–</p>
                    )}
                </div>

                {/* Buttons — always at bottom */}
                <div className="flex gap-2 mt-auto">
                    <button
                        onClick={handleAddToCart}
                        disabled={inCart || isOutOfStock}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer
                            ${inCart
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                                : isOutOfStock
                                    ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                                    : "bg-zinc-900 text-white hover:bg-zinc-700 hover:shadow-md shadow-sm"
                            }`}
                    >
                        {inCart ? <>✔ In Cart</> : <><FaShoppingCart size={10} /> Add</>}
                    </button>
                    <button
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 active:scale-95 hover:shadow-md shadow-sm shadow-amber-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                    >
                        <FaBolt size={9} /> Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
});
HomeProductCard.displayName = "HomeProductCard";

// ─── Main Home Component ───────────────────────────────────────────────────────
const Home = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();

    const searchQuery = searchParams.get("search") || "";
    const activeCategory = searchParams.get("category") || "";
    const showCustomizable = searchParams.get("customizable") === "true";
    const { addItem } = useCart();

    const allProducts = useSelector(state => state.products.items);
    const status = useSelector(state => state.products.status);
    const reduxError = useSelector(state => state.products.error);

    const loading = status === "loading" || status === "idle";
    const error = reduxError || "";

    // ── SEO ──
    useEffect(() => {
        document.title = "RV Gift & Printing | Gifts, Printing & Customization - Akbarpur, Ambedkar Nagar";
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute("content",
            "Shop personalized gifts, custom printing, and Special Gifts for Every Celebration at RV Gift & Printing, Akbarpur. Fast delivery across India."
        );
    }, []);

    // Fetch products once
    useEffect(() => {
        if (status === "idle") dispatch(fetchProducts());
    }, [dispatch, status]);

    // ── Derived data (memoized) ──
    const categories = useMemo(() =>
        [...new Set(allProducts.map(p => p.category).filter(Boolean))],
        [allProducts]
    );

    const customizableCount = useMemo(
        () => allProducts.filter(p => p.isCustomizable).length,
        [allProducts]
    );

    // When filters are active: full filtered list (all products page behaviour)
    // When NO filter: only latest LATEST_COUNT for homepage
    const isFiltered = Boolean(searchQuery || activeCategory || showCustomizable);

    const filteredProducts = useMemo(() => {
        if (!isFiltered) return allProducts; // filtering below
        let list = allProducts;
        if (showCustomizable) {
            list = list.filter(p => p.isCustomizable === true);
        } else if (activeCategory) {
            list = list.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
        }
        if (searchQuery.trim().length >= 2) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.tags?.some(t => t.toLowerCase().includes(q))
            );
        }
        return list;
    }, [allProducts, searchQuery, activeCategory, showCustomizable, isFiltered]);

    // Latest N products for homepage (sorted newest first, assuming _id is ObjectId or createdAt exists)
    const latestProducts = useMemo(() => {
        const sorted = [...allProducts].sort((a, b) => {
            // prefer createdAt, fallback to _id string comparison (ObjectId = time-sortable)
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (ta !== tb) return tb - ta;
            return (b._id || "").localeCompare(a._id || "");
        });
        return sorted.slice(0, LATEST_COUNT);
    }, [allProducts]);

    // What to show in the grid
    const displayProducts = isFiltered ? filteredProducts : latestProducts;

    // ── Handlers ──
    const handleAddToCart = useCallback((product) => addItem(product), [addItem]);
    const handleBuyNow = useCallback((product) => {
        navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1 } } });
    }, [navigate]);

    const setCategory = useCallback((cat) => {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (cat) params.category = cat;
        setSearchParams(params);
    }, [searchQuery, setSearchParams]);

    const setCustomizableFilter = useCallback(() => {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        params.customizable = "true";
        setSearchParams(params);
    }, [searchQuery, setSearchParams]);

    const clearFilters = useCallback(() => setSearchParams({}), [setSearchParams]);

    const formatCat = useCallback(
        (cat) => cat.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        []
    );

    const isAllActive = !activeCategory && !showCustomizable;

    return (
        <div className="min-h-screen bg-stone-100">
            <style>{`
                .hero-font { font-family: 'Playfair Display', serif; }
                .body-font { font-family: 'DM Sans', sans-serif; }

                @keyframes shimmer      { 0%{background-position:-200% center}100%{background-position:200% center} }
                @keyframes fadeUp       { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
                @keyframes fadeRight    { from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)} }
                @keyframes float        { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }
                @keyframes pulse-ring   { 0%{transform:scale(.95);box-shadow:0 0 0 0 rgba(245,158,11,.4)}70%{transform:scale(1);box-shadow:0 0 0 10px rgba(245,158,11,0)}100%{transform:scale(.95);box-shadow:0 0 0 0 rgba(245,158,11,0)} }
                @keyframes gradientMove { 0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%} }

                .shimmer-text {
                    background: linear-gradient(90deg,#f59e0b,#fcd34d,#f59e0b,#fbbf24);
                    background-size:200% auto;
                    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                    background-clip:text;
                    animation:shimmer 3s linear infinite;
                    will-change:background-position;
                }
                .hero-anim-1{animation:fadeUp .6s ease .1s both}
                .hero-anim-2{animation:fadeUp .6s ease .25s both}
                .hero-anim-3{animation:fadeUp .6s ease .4s both}
                .hero-anim-4{animation:fadeUp .6s ease .55s both}
                .stats-anim {animation:fadeRight .6s ease .3s both}
                .float-1{animation:float 3.5s ease-in-out infinite;will-change:transform}
                .float-2{animation:float 3.5s ease-in-out .5s infinite;will-change:transform}
                .float-3{animation:float 3.5s ease-in-out 1s infinite;will-change:transform}
                .pulse-btn{animation:pulse-ring 2s ease-in-out infinite}
                .animated-bg{
                    background:linear-gradient(135deg,#0a0f1a,#111827,#0f172a,#1a1207);
                    background-size:300% 300%;
                    animation:gradientMove 12s ease infinite;
                    will-change:background-position;
                }

                /* ── Glass cards (hero stat tiles + floating chips) ──
                   Real depth: layered shadow + inner highlight + border glow,
                   with a gentle lift + brighten on hover so they feel like
                   panes of glass catching light, not flat boxes. */
                .glass-card{
                    background:rgba(255,255,255,.05);
                    border:1px solid rgba(255,255,255,.1);
                    backdrop-filter:blur(10px);
                    box-shadow:
                        0 1px 0 rgba(255,255,255,.08) inset,
                        0 8px 24px rgba(0,0,0,.28);
                    transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease, border-color .3s ease, background .3s ease;
                }
                .glass-card:hover{
                    transform: translateY(-4px);
                    background:rgba(255,255,255,.08);
                    border-color: rgba(245,158,11,.35);
                    box-shadow:
                        0 1px 0 rgba(255,255,255,.12) inset,
                        0 16px 36px rgba(0,0,0,.34),
                        0 0 0 1px rgba(245,158,11,.12);
                }
                .gold-border{border:1px solid rgba(245,158,11,.3);background:rgba(245,158,11,.06)}
                .scrollbar-hide::-webkit-scrollbar{display:none}
                .btn-hover{transition:all .2s ease}
                .btn-hover:hover{transform:translateY(-2px)}
                .btn-hover:active{transform:scale(.97)}

                /* ── Category pills — lift + glass sheen on hover ── */
                .pill-3d{
                    position:relative;
                    overflow:hidden;
                    transition: transform .22s cubic-bezier(.2,.8,.2,1), box-shadow .22s ease;
                }
                .pill-3d::after{
                    content:"";
                    position:absolute; inset:0;
                    background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.55) 48%,transparent 66%);
                    transform:translateX(-120%);
                    transition:transform .55s ease;
                    pointer-events:none;
                }
                .pill-3d:hover{ transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,.10); }
                .pill-3d:hover::after{ transform:translateX(120%); }
                .pill-3d:active{ transform:translateY(0) scale(.97); }

                /* Product grid: items stretch to equal height */
                /* PRODUCT IMAGE ZOOM */
                .product-img-zoom { transform: scale(1); transition: transform .4s ease; }
                .group:hover .product-img-zoom { transform: scale(1.06); }

                .product-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    align-items: stretch;
                    perspective: 1200px;
                }
                @media(min-width:640px)  { .product-grid{grid-template-columns:repeat(2,1fr);gap:14px} }
                @media(min-width:768px)  { .product-grid{grid-template-columns:repeat(3,1fr);gap:16px} }
                @media(min-width:1024px) { .product-grid{grid-template-columns:repeat(4,1fr);gap:16px} }

                /* ── 3D tilt glass product cards ──
                   --rx/--ry/--mx/--my are set by JS on pointer move.
                   Idle state is a flat, light shadow; on hover it lifts on the
                   Z axis, tilts to follow the cursor, and gains a soft amber
                   glow + glass shine sweep — the page's signature interaction. */
                .product-card-3d{
                    position:relative;
                    overflow:hidden;
                    --rx:0deg; --ry:0deg; --mx:50%; --my:50%;
                    transform-style:preserve-3d;
                    transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry)) translateZ(0);
                    box-shadow: 0 1px 4px rgba(0,0,0,.06);
                    transition: transform .12s ease-out, box-shadow .35s ease, border-color .35s ease;
                    will-change: transform;
                }
                .product-card-3d:hover{
                    box-shadow:
                        0 22px 40px -12px rgba(24,24,27,.22),
                        0 6px 16px rgba(245,158,11,.16);
                    border-color:#fcd34d;
                }
                .card-shine{
                    position:absolute; inset:0; z-index:5; pointer-events:none;
                    opacity:0;
                    transition: opacity .35s ease;
                    background: radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,.55), rgba(255,255,255,0) 42%);
                    mix-blend-mode: overlay;
                }
                .product-card-3d:hover .card-shine{ opacity:1; }

                @media (prefers-reduced-motion: reduce){
                    .product-card-3d{ transform:none !important; }
                    .glass-card:hover{ transform:none; }
                    .pill-3d:hover{ transform:none; }
                }
            `}</style>

            {/* ── HERO (only on unfiltered homepage) ── */}
            {!isFiltered && (
                <div className="body-font animated-bg relative w-full overflow-hidden" style={{ minHeight: 500 }}>
                    {/* Decorative blobs — pointer-events:none so they don't affect interaction */}
                    <div className="absolute top-[-80px] right-[-80px] w-[500px] h-[500px] rounded-full pointer-events-none"
                        style={{ background: "radial-gradient(circle,rgba(245,158,11,.12) 0%,transparent 65%)" }} />
                    <div className="absolute bottom-[-60px] left-[10%] w-[350px] h-[350px] rounded-full pointer-events-none"
                        style={{ background: "radial-gradient(circle,rgba(245,158,11,.06) 0%,transparent 65%)" }} />
                    <div className="absolute inset-0 pointer-events-none opacity-[.035]"
                        style={{ backgroundImage: "radial-gradient(circle,#f59e0b 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
                    <div className="absolute top-0 right-[28%] w-px h-full pointer-events-none"
                        style={{ background: "linear-gradient(to bottom,transparent,rgba(245,158,11,.15),transparent)" }} />

                    <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                            <div className="flex-1 max-w-xl text-center md:text-left">
                                <div className="hero-anim-1 inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full gold-border">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-btn" />
                                    <span className="text-amber-400 text-[11px] font-black tracking-[.18em] uppercase">Premium Gift Store</span>
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
                                        onClick={() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })}
                                        className="btn-hover group/btn flex items-center justify-center gap-2.5 font-black px-8 py-3.5 rounded-2xl text-sm cursor-pointer"
                                        style={{ background: "linear-gradient(135deg,#f59e0b 0%,#fbbf24 100%)", color: "#111", boxShadow: "0 8px 28px rgba(245,158,11,.4),0 2px 8px rgba(0,0,0,.3)" }}>
                                        Shop Now
                                        <FaArrowRight size={11} className="group-hover/btn:translate-x-1 transition-transform duration-200" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCustomizableFilter();
                                            setTimeout(() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" }), 100);
                                        }}
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
                                        <div key={label} className="glass-card rounded-2xl px-5 py-4 text-center cursor-default">
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
                                        <div key={text} className={`glass-card ${cls} rounded-xl px-3 py-2.5 text-center cursor-default`}>
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
                        <button onClick={clearFilters}
                            className={`pill-3d shrink-0 px-4 py-2 rounded-full text-xs font-bold border cursor-pointer ${isAllActive ? "bg-zinc-900 text-white border-zinc-900 shadow-sm" : "bg-white text-zinc-600 border-stone-200 hover:border-zinc-400 hover:bg-stone-50"}`}>
                            All
                        </button>
                        {customizableCount > 0 && (
                            <button onClick={setCustomizableFilter}
                                className={`pill-3d shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border cursor-pointer whitespace-nowrap ${showCustomizable ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200" : "bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50"}`}>
                                ✏️ Customizable
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${showCustomizable ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                                    {customizableCount}
                                </span>
                            </button>
                        )}
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setCategory(cat)}
                                className={`pill-3d shrink-0 px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap cursor-pointer ${activeCategory === cat ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200" : "bg-white text-zinc-600 border-stone-200 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50"}`}>
                                {formatCat(cat)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                            {searchQuery ? (
                                <><FaSearch size={16} className="text-amber-500" /> Results for "{searchQuery}"</>
                            ) : showCustomizable ? (
                                <><FaPencilAlt size={16} className="text-emerald-500" /> Customizable Products</>
                            ) : activeCategory ? (
                                <><FaFire size={16} className="text-amber-500" /> {formatCat(activeCategory)}</>
                            ) : (
                                <><FaFire size={16} className="text-amber-500" /> Latest Products</>
                            )}
                        </h2>
                        {!loading && (
                            <p className="text-zinc-400 text-xs mt-0.5">
                                {isFiltered
                                    ? <>{displayProducts.length} product{displayProducts.length !== 1 ? "s" : ""} found</>
                                    : <>Showing {displayProducts.length} of {allProducts.length} products</>
                                }
                                {showCustomizable && (
                                    <span className="ml-1 text-emerald-500 font-semibold">· Personalize these!</span>
                                )}
                            </p>
                        )}
                    </div>
                    {isFiltered && (
                        <button onClick={clearFilters}
                            className="text-xs text-amber-600 font-bold hover:text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95">
                            Clear ✕
                        </button>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
                        <p className="text-red-500 font-bold mb-3">⚠️ {error}</p>
                        <button
                            onClick={() => dispatch(fetchProducts())}
                            className="bg-zinc-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors duration-200 cursor-pointer active:scale-95">
                            Retry
                        </button>
                    </div>
                )}

                {/* Skeleton Loading */}
                {loading && (
                    <div className="product-grid">
                        {Array.from({ length: LATEST_COUNT }, (_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && displayProducts.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-300">
                        <p className="text-5xl mb-3">{showCustomizable ? "✏️" : "🎁"}</p>
                        <p className="text-zinc-600 font-bold mb-1">No products found</p>
                        <p className="text-zinc-400 text-sm mb-5">
                            {showCustomizable
                                ? "No customizable products available right now"
                                : "Try a different search or category"}
                        </p>
                        <button onClick={clearFilters}
                            className="text-amber-600 font-bold hover:text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-5 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer active:scale-95">
                            Browse All Products
                        </button>
                    </div>
                )}

                {/* Product Grid */}
                {!loading && !error && displayProducts.length > 0 && (
                    <>
                        <div className="product-grid">
                            {displayProducts.map(product => (
                                <HomeProductCard
                                    key={product._id}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                    onBuyNow={handleBuyNow}
                                />
                            ))}
                        </div>

                        {/* ── View All CTA (only on unfiltered homepage) ── */}
                        {!isFiltered && allProducts.length > LATEST_COUNT && (
                            <div className="flex flex-col items-center mt-10 gap-3">
                                <p className="text-zinc-400 text-sm">
                                    Showing {LATEST_COUNT} of <span className="font-bold text-zinc-600">{allProducts.length}</span> products
                                </p>
                                <button
                                    onClick={() => navigate("/products")}
                                    className="group flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-black text-sm transition-all duration-200 cursor-pointer active:scale-95 hover:shadow-lg"
                                    style={{
                                        background: "linear-gradient(135deg,#f59e0b 0%,#fbbf24 100%)",
                                        color: "#111",
                                        boxShadow: "0 4px 20px rgba(245,158,11,.35)"
                                    }}
                                >
                                    View All Products
                                    <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-200" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default memo(Home);