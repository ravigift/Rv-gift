import React, { useEffect, useMemo, useCallback, useRef, useState, memo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { useCart } from "../hooks/useCart";
import api from "../api/axios";
import {
    FaStar, FaRegStar, FaSearch, FaFire, FaArrowRight, FaArrowLeft,
    FaShoppingCart, FaPencilAlt, FaBolt, FaGift, FaTruck, FaShieldAlt,
    FaWhatsapp, FaChevronLeft, FaChevronRight, FaHeart, FaCheckCircle,
    FaThumbsUp, FaCrown, FaGem, FaClock
} from "react-icons/fa";
import { CATEGORIES } from "../data/categories";
import ProductCard from "../components/ProductCard";

// ─── Constants ───────────────────────────────────────────────────────────────
const LATEST_COUNT = 8;

const THEME_STYLES = {
    "dark-luxury": {
        bg: "linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #1a1207 100%)",
        accent: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.15)",
        badgeBg: "rgba(245, 158, 11, 0.12)",
        badgeBorder: "rgba(245, 158, 11, 0.35)",
        btnBg: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
        btnText: "#111",
        shimmer: "linear-gradient(90deg, #f59e0b, #fcd34d, #f59e0b, #fbbf24)",
    },
    "amber-gold": {
        bg: "linear-gradient(135deg, #451a03 0%, #78350f 50%, #9a3412 100%)",
        accent: "#fde047",
        glow: "rgba(253, 224, 71, 0.18)",
        badgeBg: "rgba(253, 224, 71, 0.15)",
        badgeBorder: "rgba(253, 224, 71, 0.4)",
        btnBg: "linear-gradient(135deg, #fde047 0%, #f59e0b 100%)",
        btnText: "#451a03",
        shimmer: "linear-gradient(90deg, #fde047, #fff, #fde047, #f59e0b)",
    },
    "royal-indigo": {
        bg: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
        accent: "#818cf8",
        glow: "rgba(129, 140, 248, 0.2)",
        badgeBg: "rgba(129, 140, 248, 0.15)",
        badgeBorder: "rgba(129, 140, 248, 0.4)",
        btnBg: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
        btnText: "#0f172a",
        shimmer: "linear-gradient(90deg, #818cf8, #e0e7ff, #818cf8, #c084fc)",
    },
    "rose-romance": {
        bg: "linear-gradient(135deg, #4c0519 0%, #831843 50%, #9d174d 100%)",
        accent: "#f472b6",
        glow: "rgba(244, 114, 182, 0.2)",
        badgeBg: "rgba(244, 114, 182, 0.15)",
        badgeBorder: "rgba(244, 114, 182, 0.4)",
        btnBg: "linear-gradient(135deg, #f472b6 0%, #fb7185 100%)",
        btnText: "#4c0519",
        shimmer: "linear-gradient(90deg, #f472b6, #ffe4e6, #f472b6, #fb7185)",
    },
    "emerald-festive": {
        bg: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)",
        accent: "#34d399",
        glow: "rgba(52, 211, 153, 0.2)",
        badgeBg: "rgba(52, 211, 153, 0.15)",
        badgeBorder: "rgba(52, 211, 153, 0.4)",
        btnBg: "linear-gradient(135deg, #34d399 0%, #a7f3d0 100%)",
        btnText: "#022c22",
        shimmer: "linear-gradient(90deg, #34d399, #ecfdf5, #34d399, #6ee7b7)",
    },
};

const DEFAULT_BANNER = {
    _id: "default-fallback",
    title: "Gifts That Speak",
    highlightText: "From The Heart",
    subtitle: "Handpicked gifts for every occasion. Personalize with your own photo & touch — because every gift tells a special story.",
    badgeText: "",
    offerTag: "",
    ctaText: "Shop Now",
    ctaLink: "#products-section",
    secondaryCtaText: "Customize 🎨",
    secondaryCtaLink: "/?customizable=true",
    theme: "dark-luxury",
    image: { url: "" },
};

const TESTIMONIALS = [
    {
        name: "Pooja Verma",
        city: "Akbarpur",
        rating: 5,
        review: "Ordered a customized rotating photo lamp for my anniversary. The print quality and LED glow are absolutely stunning! Delivered on time.",
        product: "3D Rotating Photo Lamp",
    },
    {
        name: "Rahul Sharma",
        city: "Lucknow",
        rating: 5,
        review: "Best gift shop for personalized gifts! The customized magic mug and frame quality exceeded my expectations. Fast packaging.",
        product: "Personalized Magic Mug",
    },
    {
        name: "Amit Gupta",
        city: "Ambedkar Nagar",
        rating: 5,
        review: "Ordered custom T-shirts and keychains for our family event. High definition printing and super soft fabric. Highly recommended!",
        product: "Custom Printed T-Shirt",
    },
];

const TRUST_FEATURES = [
    { icon: "⚡", title: "Express Dispatch", desc: "Fast 24-48 hr dispatch across India" },
    { icon: "🎨", title: "100% Customized", desc: "Your photos & text crafted to perfection" },
    { icon: "🛡️", title: "Safe & Secure", desc: "Damage-proof packaging & verified checkout" },
    { icon: "💬", title: "WhatsApp Support", desc: "Instant assistance for custom queries" },
];

const HOW_IT_WORKS = [
    {
        step: "01",
        icon: "🎁",
        title: "Pick Your Gift",
        desc: "Choose from photo lamps, mugs, custom frames, t-shirts, cushions & 20+ categories.",
    },
    {
        step: "02",
        icon: "✨",
        title: "Add Photo & Text",
        desc: "Upload your favorite photos, names, or special dates during checkout with live preview.",
    },
    {
        step: "03",
        icon: "🚀",
        title: "Delivered With Love",
        desc: "We craft your order with laser-sharp quality and deliver safely to your doorstep.",
    },
];


// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = memo(() => (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-stone-200/70 overflow-hidden animate-pulse flex flex-col h-full shadow-xs">
        <div className="bg-stone-200/70 w-full aspect-square max-h-36 sm:max-h-48" />
        <div className="p-2 sm:p-3 flex flex-col flex-1 gap-1.5 sm:gap-2">
            <div className="flex justify-between items-center">
                <div className="h-2.5 bg-stone-100 rounded w-1/4" />
                <div className="h-2.5 bg-stone-100 rounded w-1/5" />
            </div>
            <div className="h-3.5 bg-stone-200/70 rounded w-4/5 mt-0.5" />
            <div className="h-3 bg-stone-100 rounded w-1/2" />
            <div className="h-4 bg-stone-200/80 rounded w-2/5 mt-auto pt-1" />
            <div className="flex gap-1.5 mt-1">
                <div className="h-7 sm:h-8 bg-stone-100 rounded-lg flex-1" />
                <div className="h-7 sm:h-8 bg-amber-100 rounded-lg flex-1" />
            </div>
        </div>
    </div>
));
SkeletonCard.displayName = "SkeletonCard";

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

    // ── Dynamic Banners State ──
    const [banners, setBanners] = useState([]);
    const [loadingBanners, setLoadingBanners] = useState(true);
    const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const bannerTimerRef = useRef(null);

    // ── Dynamic "How It Works" section ──
    const [howItWorks, setHowItWorks] = useState({
        eyebrow: "EASY 3-STEP PROCESS",
        heading: "How Custom Printing & Gifting Works",
        subheading: "Personalized gifts created in minutes, delivered right at your doorstep.",
        steps: HOW_IT_WORKS,
    });

    // Fetch dynamic banners + home content from API
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                setLoadingBanners(true);
                const res = await api.get("/banners");
                if (res.data?.success && res.data.banners?.length > 0) {
                    setBanners(res.data.banners);
                } else {
                    setBanners([]);
                }
            } catch (err) {
                // No banners configured / endpoint not deployed yet → use the built-in default silently
                if (err?.response?.status !== 404) console.warn("Hero banners unavailable:", err.message);
                setBanners([]);
            } finally {
                setLoadingBanners(false);
            }
        };

        const fetchHomeContent = async () => {
            try {
                const { data } = await api.get("/site/how-it-works");
                if (data?.data) {
                    setHowItWorks((prev) => ({
                        eyebrow: data.data.eyebrow || prev.eyebrow,
                        heading: data.data.heading || prev.heading,
                        subheading: data.data.subheading || prev.subheading,
                        steps: Array.isArray(data.data.steps) && data.data.steps.length
                            ? data.data.steps.map((s, i) => ({
                                icon: s.icon || "✨",
                                step: s.label || String(i + 1).padStart(2, "0"),
                                title: s.title || "",
                                desc: s.desc || "",
                            }))
                            : prev.steps,
                    }));
                }
            } catch {
                /* keep defaults */
            }
        };

        fetchBanners();
        fetchHomeContent();
    }, []);

    // Auto-slide carousel for multiple banners
    const activeBannersList = banners.length > 0 ? banners : [DEFAULT_BANNER];

    useEffect(() => {
        if (activeBannersList.length <= 1 || isHovered) return;

        bannerTimerRef.current = setInterval(() => {
            setCurrentBannerIdx((prev) => (prev + 1) % activeBannersList.length);
        }, 5500);

        return () => {
            if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
        };
    }, [activeBannersList.length, isHovered]);

    const activeBanner = activeBannersList[currentBannerIdx] || activeBannersList[0];
    const activeTheme = THEME_STYLES[activeBanner.theme] || THEME_STYLES["dark-luxury"];

    const nextBanner = () => {
        setCurrentBannerIdx((prev) => (prev + 1) % activeBannersList.length);
    };

    const prevBanner = () => {
        setCurrentBannerIdx((prev) => (prev - 1 + activeBannersList.length) % activeBannersList.length);
    };

    // ── SEO ──
    useEffect(() => {
        document.title = "RV Gift & Printing | Personalized Gifts, Printing & Custom Keepsakes - Akbarpur";
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute("content",
            "Shop personalized gifts, custom printing, 3D photo lamps, mugs, and special celebration gifts at RV Gift & Printing, Akbarpur. Express delivery across India."
        );
    }, []);

    // Fetch products once
    useEffect(() => {
        if (status === "idle") dispatch(fetchProducts());
    }, [dispatch, status]);

    // ── Categories & counts ──
    const categories = useMemo(() =>
        [...new Set(allProducts.map(p => p.category).filter(Boolean))],
        [allProducts]
    );

    // Category counts from a dedicated aggregation endpoint (scales past the
    // product-list cap). Falls back to deriving from the loaded products.
    const [categoryCounts, setCategoryCounts] = useState(null);
    useEffect(() => {
        let cancelled = false;
        api.get("/products/categories")
            .then(({ data }) => { if (!cancelled && Array.isArray(data)) setCategoryCounts(data); })
            .catch(() => { /* fall back to product-derived */ });
        return () => { cancelled = true; };
    }, []);

    // "Shop by Category" showcase — ONLY categories that actually have live
    // products, using the nice names/icons, most-stocked first.
    const categoryCards = useMemo(() => {
        const counts = new Map();
        if (categoryCounts) {
            for (const r of categoryCounts) counts.set(String(r.value).toLowerCase(), r.count);
        } else {
            for (const p of allProducts) {
                const c = p.category?.toLowerCase();
                if (c) counts.set(c, (counts.get(c) || 0) + 1);
            }
        }
        if (counts.size === 0) return [];
        return CATEGORIES
            .map(cat => ({ ...cat, count: counts.get(cat.value.toLowerCase()) || 0 }))
            .filter(cat => cat.count > 0)
            .sort((a, b) => b.count - a.count);
    }, [allProducts, categoryCounts]);

    const customizableCount = useMemo(
        () => allProducts.filter(p => p.isCustomizable).length,
        [allProducts]
    );

    const isFiltered = Boolean(searchQuery || activeCategory || showCustomizable);

    const filteredProducts = useMemo(() => {
        if (!isFiltered) return allProducts;
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

    const latestProducts = useMemo(() => {
        const sorted = [...allProducts].sort((a, b) => {
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (ta !== tb) return tb - ta;
            return (b._id || "").localeCompare(a._id || "");
        });
        return sorted.slice(0, LATEST_COUNT);
    }, [allProducts]);

    const displayProducts = isFiltered ? filteredProducts : latestProducts;

    // Always scroll to top whenever query params or filters change (prevents jumping to bottom when hero collapses)
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [location.search]);

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
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [searchQuery, setSearchParams]);

    const setCustomizableFilter = useCallback(() => {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        params.customizable = "true";
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [searchQuery, setSearchParams]);

    const clearFilters = useCallback(() => {
        setSearchParams({});
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [setSearchParams]);

    // Prefer the curated display name; fall back to a title-cased slug
    const formatCat = useCallback((cat) => {
        const known = CATEGORIES.find(c => c.value.toLowerCase() === String(cat).toLowerCase());
        return known?.name || String(cat).replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }, []);

    const isAllActive = !activeCategory && !showCustomizable;

    const handleCtaClick = (link) => {
        if (!link) return;
        if (link.startsWith("#")) {
            const target = document.querySelector(link);
            if (target) target.scrollIntoView({ behavior: "smooth" });
        } else if (link.startsWith("http")) {
            window.open(link, "_blank");
        } else {
            navigate(link);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 selection:bg-amber-400 selection:text-zinc-900 overflow-x-hidden w-full max-w-full">
            <style>{`
                .hero-font { font-family: 'Playfair Display', serif; }
                .body-font { font-family: 'DM Sans', sans-serif; }

                @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
                @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
                @keyframes fadeRight { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
                @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                @keyframes pulseGlow { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }

                .dynamic-shimmer {
                    background: ${activeTheme.shimmer};
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: shimmer 3s linear infinite;
                    will-change: background-position;
                }

                .hero-anim-1 { animation: fadeUp .55s ease .05s both; }
                .hero-anim-2 { animation: fadeUp .55s ease .15s both; }
                .hero-anim-3 { animation: fadeUp .55s ease .25s both; }
                .hero-anim-4 { animation: fadeUp .55s ease .35s both; }
                .stats-anim { animation: fadeRight .6s ease .2s both; }
                .float-1 { animation: float 3.6s ease-in-out infinite; }
                .float-2 { animation: float 3.6s ease-in-out .6s infinite; }
                .float-3 { animation: float 3.6s ease-in-out 1.2s infinite; }

                .glass-card {
                    background: rgba(255,255,255,.07);
                    border: 1px solid rgba(255,255,255,.15);
                    backdrop-filter: blur(12px);
                    box-shadow: 0 1px 0 rgba(255,255,255,.12) inset, 0 12px 30px rgba(0,0,0,.25);
                    transition: all .25s ease;
                }
                .glass-card:hover {
                    transform: translateY(-4px);
                    background: rgba(255,255,255,.12);
                    border-color: rgba(245,158,11,.4);
                    box-shadow: 0 16px 36px rgba(0,0,0,.35);
                }

                .pill-3d {
                    position: relative;
                    overflow: hidden;
                    transition: transform .2s ease, box-shadow .2s ease;
                }
                .pill-3d:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,.08); }
                .pill-3d:active { transform: translateY(0) scale(.97); }

                .product-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    align-items: stretch;
                }
                @media(min-width:640px) { .product-grid{ grid-template-columns: repeat(2, 1fr); gap: 14px; } }
                @media(min-width:768px) { .product-grid{ grid-template-columns: repeat(3, 1fr); gap: 16px; } }
                @media(min-width:1024px){ .product-grid{ grid-template-columns: repeat(4, 1fr); gap: 18px; } }

                .btn-glow:hover {
                    box-shadow: 0 8px 25px rgba(245,158,11,.45);
                }
            `}</style>

            {/* ════════════════════════════════════════════════════════════════
                1. DYNAMIC HERO SECTION (When no filters active)
            ════════════════════════════════════════════════════════════════ */}
            {/* ════════════════════════════════════════════════════════════════
                1. DYNAMIC FULL-BLEED HERO SECTION (Urbexon Style)
            ════════════════════════════════════════════════════════════════ */}
            {/* ════════════════════════════════════════════════════════════════
                1. DYNAMIC FULL-BLEED HERO SECTION (Urbexon Style)
            ════════════════════════════════════════════════════════════════ */}
            {!isFiltered && (
                <div
                    className={`relative w-full overflow-hidden body-font select-none transition-all duration-700 ${activeBanner.bannerType === "image-only" && activeBanner.image?.url ? "cursor-pointer" : ""} min-h-[380px] sm:min-h-[460px] md:min-h-[540px] flex items-center`}
                    style={{
                        background: activeTheme.bg,
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={() => {
                        if (activeBanner.bannerType === "image-only" && activeBanner.image?.url) {
                            handleCtaClick(activeBanner.ctaLink || "#products-section");
                        }
                    }}
                >
                    {/* CASE A: PURE ORIGINAL IMAGE ONLY (0 Dark Shadow / 0 Overlay) */}
                    {activeBanner.bannerType === "image-only" && activeBanner.image?.url ? (
                        <div className="absolute inset-0 z-0 overflow-hidden">
                            <img
                                src={activeBanner.image.url}
                                alt={activeBanner.title || "RV Gift Banner"}
                                className="w-full h-full object-cover object-center transition-transform duration-1000 hover:scale-[1.02]"
                            />
                        </div>
                    ) : (
                        /* CASE B: IMAGE WITH TEXT & THEME OVERLAY OR GRADIENT THEME */
                        <>
                            {activeBanner.image?.url ? (
                                <div className="absolute inset-0 z-0 overflow-hidden">
                                    <img
                                        src={activeBanner.image.url}
                                        alt={activeBanner.title}
                                        className="w-full h-full object-cover object-center transition-all duration-1000"
                                    />
                                    {/* Overlay according to admin setting */}
                                    {activeBanner.overlayStyle === "dark" && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/75 to-zinc-950/20 z-[1]" />
                                    )}
                                    {activeBanner.overlayStyle === "subtle" && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent z-[1]" />
                                    )}
                                    {/* If overlayStyle === "none" -> NO dark shadow is applied */}
                                </div>
                            ) : (
                                /* Default Atmospheric Glow Blobs when no custom image */
                                <>
                                    <div
                                        className="absolute top-[-100px] right-[-100px] w-[550px] h-[550px] rounded-full pointer-events-none opacity-40 blur-3xl transition-all duration-700 z-0"
                                        style={{ background: activeTheme.glow }}
                                    />
                                    <div
                                        className="absolute bottom-[-80px] left-[5%] w-[400px] h-[400px] rounded-full pointer-events-none opacity-30 blur-2xl transition-all duration-700 z-0"
                                        style={{ background: activeTheme.glow }}
                                    />
                                    <div
                                        className="absolute inset-0 pointer-events-none opacity-[.04] z-0"
                                        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}
                                    />
                                </>
                            )}
                        </>
                    )}

                    {/* FOREGROUND CONTENT (Only rendered when in text-overlay mode or fallback) */}
                    {activeBanner.bannerType !== "image-only" && (
                        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 py-12 md:py-20">
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-10">

                                {/* Left Text & CTAs */}
                                <div className="flex-1 max-w-2xl text-center lg:text-left">

                                    {/* Top Badge & Offer Tag */}
                                    {(activeBanner.badgeText || activeBanner.offerTag) && (
                                        <div className="hero-anim-1 flex items-center justify-center lg:justify-start gap-2.5 mb-5 flex-wrap">
                                            {activeBanner.badgeText && (
                                                <div
                                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md"
                                                    style={{
                                                        background: activeTheme.badgeBg,
                                                        border: `1px solid ${activeTheme.badgeBorder}`,
                                                    }}
                                                >
                                                    <span
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ background: activeBanner.accentColor || activeTheme.accent, boxShadow: `0 0 8px ${activeBanner.accentColor || activeTheme.accent}` }}
                                                    />
                                                    <span
                                                        className="text-[11px] font-black tracking-wider uppercase"
                                                        style={{ color: activeBanner.accentColor || activeTheme.accent }}
                                                    >
                                                        {activeBanner.badgeText}
                                                    </span>
                                                </div>
                                            )}

                                            {activeBanner.offerTag && (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 backdrop-blur-md border border-red-400/30 text-red-300 text-[11px] font-bold shadow-lg">
                                                    <span>🔥</span>
                                                    <span>{activeBanner.offerTag}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Main Heading */}
                                    <h1
                                        className="hero-font hero-anim-2 text-3xl sm:text-4xl md:text-5xl lg:text-[3.6rem] font-black leading-[1.12] mb-4 tracking-tight"
                                        style={{
                                            color: activeBanner.textColor || "#ffffff",
                                            textShadow: activeBanner.textColor === "#ffffff" || !activeBanner.textColor ? "0 2px 10px rgba(0,0,0,0.7)" : "0 1px 4px rgba(255,255,255,0.8)",
                                        }}
                                    >
                                        {activeBanner.title}{" "}
                                        {activeBanner.highlightText && (
                                            <span
                                                className="italic font-bold"
                                                style={{ color: activeBanner.accentColor || activeTheme.accent }}
                                            >
                                                {activeBanner.highlightText}
                                            </span>
                                        )}
                                    </h1>

                                    {/* Subtitle Description */}
                                    {activeBanner.subtitle && (
                                        <p
                                            className="hero-anim-3 text-sm sm:text-[15px] md:text-base mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium"
                                            style={{
                                                color: activeBanner.textColor === "#0f172a" ? "#334155" : (activeBanner.textColor ? `${activeBanner.textColor}EE` : "#e4e4e7"),
                                                textShadow: activeBanner.textColor === "#ffffff" || !activeBanner.textColor ? "0 1px 6px rgba(0,0,0,0.7)" : "none",
                                            }}
                                        >
                                            {activeBanner.subtitle}
                                        </p>
                                    )}

                                    {/* Action Buttons */}
                                    {(activeBanner.ctaText || activeBanner.secondaryCtaText) && (
                                        <div className="hero-anim-4 flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start">
                                            {activeBanner.ctaText && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCtaClick(activeBanner.ctaLink || "#products-section");
                                                    }}
                                                    className="btn-glow flex items-center justify-center gap-2.5 font-black px-7 py-3.5 rounded-2xl text-sm cursor-pointer active:scale-95 transition-all duration-200"
                                                    style={{
                                                        background: activeBanner.accentColor ? `linear-gradient(135deg, ${activeBanner.accentColor}, ${activeBanner.accentColor}DD)` : activeTheme.btnBg,
                                                        color: activeBanner.accentColor ? "#111827" : activeTheme.btnText,
                                                        boxShadow: `0 8px 24px ${activeTheme.glow}, 0 2px 6px rgba(0,0,0,0.3)`,
                                                    }}
                                                >
                                                    <span>{activeBanner.ctaText}</span>
                                                    <FaArrowRight size={11} />
                                                </button>
                                            )}

                                            {activeBanner.secondaryCtaText && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCtaClick(activeBanner.secondaryCtaLink || "/?customizable=true");
                                                    }}
                                                    className="glass-card flex items-center justify-center gap-2 font-bold px-7 py-3.5 rounded-2xl text-sm cursor-pointer active:scale-95 transition-all duration-200 hover:border-amber-400/50 backdrop-blur-md"
                                                    style={{
                                                        color: activeBanner.textColor || "#ffffff",
                                                        background: activeBanner.textColor === "#0f172a" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.4)",
                                                        border: `1px solid ${activeBanner.textColor === "#0f172a" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)"}`,
                                                    }}
                                                >
                                                    {activeBanner.secondaryCtaText}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Right Section: Only shown if NO custom image is present, using 100% dynamic DB stats */}
                                {!activeBanner.image?.url && (
                                    <div className="stats-anim flex flex-col items-center lg:items-end shrink-0 z-10 w-full lg:w-auto">
                                        <div className="flex flex-col gap-3.5 items-center lg:items-end">
                                            <div className="flex gap-3">
                                                {[
                                                    { val: `${allProducts.length}+`, label: "Products Live", icon: "🎁" },
                                                    { val: `${categories.length}`, label: "Categories", icon: "🗂️" },
                                                    { val: `${customizableCount}+`, label: "Customizable", icon: "✨" },
                                                ].map(({ val, label, icon }) => (
                                                    <div key={label} className="glass-card rounded-2xl px-5 py-4 text-center cursor-default backdrop-blur-md">
                                                        <p className="text-xl mb-1">{icon}</p>
                                                        <p className="font-black text-amber-400 text-2xl leading-none">{val}</p>
                                                        <p className="text-zinc-400 text-[11px] mt-1 font-medium">{label}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Live Top Categories Chips from DB */}
                                            {categoryCards.length > 0 && (
                                                <div className="flex gap-2.5 flex-wrap justify-center lg:justify-end">
                                                    {categoryCards.slice(0, 3).map((cat, idx) => (
                                                        <div
                                                            key={cat.value}
                                                            onClick={() => setCategory(cat.value)}
                                                            className={`glass-card float-${idx + 1} rounded-xl px-3.5 py-2.5 text-center cursor-pointer hover:border-amber-400 transition-all backdrop-blur-md`}
                                                        >
                                                            <p className="text-xl">{cat.icon}</p>
                                                            <p className="text-zinc-300 text-[10px] font-bold mt-0.5 whitespace-nowrap">{cat.name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    )}

                    {/* CAROUSEL CONTROLS (If multiple banners exist) */}
                    {activeBannersList.length > 1 && (
                        <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-between px-6 max-w-7xl mx-auto pointer-events-none">
                            {/* Navigation Indicators */}
                            <div className="flex items-center gap-2 pointer-events-auto bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                {activeBannersList.map((b, idx) => (
                                    <button
                                        key={b._id || idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentBannerIdx(idx);
                                        }}
                                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${currentBannerIdx === idx ? "w-8 bg-amber-400" : "w-2 bg-white/40 hover:bg-white/70"}`}
                                        aria-label={`Go to slide ${idx + 1}`}
                                    />
                                ))}
                            </div>

                            {/* Arrow controls */}
                            <div className="flex items-center gap-2 pointer-events-auto">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        prevBanner();
                                    }}
                                    className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-white hover:text-amber-400 cursor-pointer active:scale-90 transition-all backdrop-blur-md"
                                    aria-label="Previous Banner"
                                >
                                    <FaChevronLeft size={12} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        nextBanner();
                                    }}
                                    className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-white hover:text-amber-400 cursor-pointer active:scale-90 transition-all backdrop-blur-md"
                                    aria-label="Next Banner"
                                >
                                    <FaChevronRight size={12} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                2. SHOP BY OCCASION / CATEGORY SHOWCASE
                Only shows categories that currently have products in stock/live.
            ════════════════════════════════════════════════════════════════ */}
            {!isFiltered && !loading && categoryCards.length > 0 && (
                <div className="max-w-7xl mx-auto px-3 sm:px-6 my-5 sm:my-7">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-amber-500">🎁</span>
                                <h2 className="text-xl sm:text-2xl font-black text-zinc-900">
                                    Shop by Category & Occasion
                                </h2>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">
                                Find the perfect handcrafted gift for birthdays, anniversaries & celebrations.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
                        {categoryCards.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setCategory(cat.value)}
                                aria-label={`${cat.name} — ${cat.count} product${cat.count > 1 ? "s" : ""}`}
                                className="pill-3d p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center gap-1.5 sm:gap-2 text-center transition-all duration-200 cursor-pointer active:scale-95 group bg-white border-stone-200 hover:border-amber-400 hover:bg-amber-50/40"
                            >
                                <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-200">
                                    {cat.icon}
                                </span>
                                <span className="text-[11px] font-bold leading-tight line-clamp-2 text-zinc-700 group-hover:text-amber-700">
                                    {cat.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                4. HOW CUSTOMIZATION WORKS (Refactored Clean Light UI)
            ════════════════════════════════════════════════════════════════ */}
            {!isFiltered && howItWorks.steps.length > 0 && (
                <div className="max-w-7xl mx-auto px-3 sm:px-6 mb-6 sm:mb-8">
                    <div className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 bg-gradient-to-b from-amber-50/60 via-white to-orange-50/30 border border-amber-200/60 shadow-xl shadow-amber-900/5 overflow-hidden">
                        {/* Soft Ambient Background Glows */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-300/15 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-300/15 rounded-full blur-3xl pointer-events-none" />
                        <div
                            className="absolute inset-0 opacity-[0.025] pointer-events-none"
                            style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "24px 24px" }}
                        />

                        {/* Header */}
                        <div className="relative z-10 max-w-2xl mb-6 sm:mb-8 text-center sm:text-left">
                            {howItWorks.eyebrow && (
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-300/60 text-[11px] font-black uppercase tracking-wider mb-2.5 shadow-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                    {howItWorks.eyebrow}
                                </span>
                            )}
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 tracking-tight leading-tight">
                                {howItWorks.heading}
                            </h2>
                            {howItWorks.subheading && (
                                <p className="text-zinc-600 text-xs sm:text-sm mt-1.5 leading-relaxed">
                                    {howItWorks.subheading}
                                </p>
                            )}
                        </div>

                        {/* 3 Step Flow Grid */}
                        <div className={`grid grid-cols-1 gap-4 sm:gap-6 relative z-10 ${howItWorks.steps.length >= 3 ? "md:grid-cols-3" : howItWorks.steps.length === 2 ? "md:grid-cols-2" : ""}`}>
                            {howItWorks.steps.map((step, idx) => (
                                <div
                                    key={idx}
                                    className="group relative bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-amber-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                                >
                                    {/* Top Step Row */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4 sm:mb-5">
                                            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-center text-2xl sm:text-3xl shadow-xs group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                                                {step.icon}
                                            </div>
                                            <span className="px-2.5 sm:px-3 py-1 rounded-full bg-zinc-900 text-amber-400 text-xs font-black tracking-wider shadow-sm">
                                                STEP {step.step}
                                            </span>
                                        </div>

                                        <h3 className="text-base sm:text-lg font-black text-zinc-900 mb-1.5 group-hover:text-amber-600 transition-colors">
                                            {step.title}
                                        </h3>
                                        <p className="text-zinc-600 text-xs sm:text-[13px] leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </div>

                                    {/* Bottom Step Indicator Accent Bar */}
                                    <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold text-zinc-400 group-hover:text-amber-600 transition-colors">
                                        <span>Phase 0{idx + 1}</span>
                                        <span className="group-hover:translate-x-1 transition-transform">➔</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Trust Note */}
                        <div className="relative z-10 mt-6 pt-5 border-t border-amber-200/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                            <div className="flex items-center gap-2 text-xs text-zinc-600 font-medium">
                                <span className="text-base">✨</span>
                                <span>Free preview & instant mockups generated automatically before checkout</span>
                            </div>
                            <a
                                href="https://wa.me/919792015091?text=Hi%20RV%20Gift,%20I%20want%20to%20know%20more%20about%20custom%20orders"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all"
                            >
                                <span>💬</span> WhatsApp Design Help
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                5. MAIN PRODUCTS SECTION
            ════════════════════════════════════════════════════════════════ */}
            <div id="products-section" className="body-font max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">

                {/* Category Filter Pills */}
                {categories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2.5 mb-4 scrollbar-hide">
                        <button
                            onClick={clearFilters}
                            className={`pill-3d shrink-0 px-4 py-2 rounded-full text-xs font-bold border cursor-pointer ${isAllActive ? "bg-zinc-900 text-white border-zinc-900 shadow-sm" : "bg-white text-zinc-600 border-stone-200 hover:border-zinc-400 hover:bg-stone-50"}`}
                        >
                            All Products
                        </button>
                        {customizableCount > 0 && (
                            <button
                                onClick={setCustomizableFilter}
                                className={`pill-3d shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border cursor-pointer whitespace-nowrap ${showCustomizable ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200" : "bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50"}`}
                            >
                                ✏️ Customizable Only
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${showCustomizable ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                                    {customizableCount}
                                </span>
                            </button>
                        )}
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`pill-3d shrink-0 px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap cursor-pointer ${activeCategory === cat ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200" : "bg-white text-zinc-600 border-stone-200 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50"}`}
                            >
                                {formatCat(cat)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Section Title Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 flex items-center gap-2">
                            {searchQuery ? (
                                <><FaSearch size={16} className="text-amber-500" /> Results for "{searchQuery}"</>
                            ) : showCustomizable ? (
                                <><FaPencilAlt size={16} className="text-emerald-500" /> Customizable Gifts Collection</>
                            ) : activeCategory ? (
                                <><FaFire size={16} className="text-amber-500" /> {formatCat(activeCategory)}</>
                            ) : (
                                <><FaFire size={16} className="text-amber-500" /> Trending & Latest Gifts</>
                            )}
                        </h2>
                        {!loading && (
                            <p className="text-zinc-500 text-xs mt-0.5">
                                {isFiltered
                                    ? <>{displayProducts.length} gift{displayProducts.length !== 1 ? "s" : ""} found</>
                                    : <>Showing {displayProducts.length} of {allProducts.length} handcrafted products</>
                                }
                                {showCustomizable && (
                                    <span className="ml-1 text-emerald-600 font-semibold">· Personalize with your photos!</span>
                                )}
                            </p>
                        )}
                    </div>

                    {isFiltered && (
                        <button
                            onClick={clearFilters}
                            className="text-xs text-amber-700 font-bold hover:text-amber-800 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95"
                        >
                            Clear Filters ✕
                        </button>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
                        <p className="text-red-600 font-bold mb-3">⚠️ {error}</p>
                        <button
                            onClick={() => dispatch(fetchProducts())}
                            className="bg-zinc-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors duration-200 cursor-pointer active:scale-95"
                        >
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
                    <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-stone-300">
                        <p className="text-5xl mb-3">{showCustomizable ? "✏️" : "🎁"}</p>
                        <p className="text-zinc-700 font-bold mb-1">No products found</p>
                        <p className="text-zinc-400 text-sm mb-5">
                            {showCustomizable
                                ? "No customizable products found in this selection"
                                : "Try exploring other categories or search terms"}
                        </p>
                        <button
                            onClick={clearFilters}
                            className="text-amber-600 font-bold hover:text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-5 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer active:scale-95"
                        >
                            Browse All Products
                        </button>
                    </div>
                )}

                {/* Product Grid */}
                {!loading && !error && displayProducts.length > 0 && (
                    <>
                        <div className="product-grid">
                            {displayProducts.map((product, idx) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    index={idx}
                                    onAddToCart={handleAddToCart}
                                    onBuyNow={handleBuyNow}
                                />
                            ))}
                        </div>

                        {/* View All CTA */}
                        {!isFiltered && allProducts.length > LATEST_COUNT && (
                            <div className="flex flex-col items-center mt-8 sm:mt-10 gap-2.5">
                                <p className="text-zinc-400 text-xs sm:text-sm">
                                    Showing {LATEST_COUNT} of <span className="font-bold text-zinc-700">{allProducts.length}</span> products
                                </p>
                                <button
                                    onClick={() => navigate("/products")}
                                    className="btn-glow group flex items-center gap-2.5 px-7 sm:px-8 py-3.5 rounded-2xl font-black text-sm transition-all duration-200 cursor-pointer active:scale-95 text-zinc-950"
                                    style={{
                                        background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
                                        boxShadow: "0 4px 20px rgba(245, 158, 11, 0.35)",
                                    }}
                                >
                                    <span>Explore Complete Store ({allProducts.length} Gifts)</span>
                                    <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-200" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ════════════════════════════════════════════════════════════════
                6. CORPORATE & BULK ORDERS SHOWCASE BANNER
            ════════════════════════════════════════════════════════════════ */}
            {!isFiltered && (
                <div className="max-w-7xl mx-auto px-3 sm:px-6 my-6 sm:my-8">
                    <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-12 bg-gradient-to-r from-zinc-900 via-zinc-950 to-stone-900 text-white overflow-hidden shadow-xl border border-stone-800">
                        <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
                            <div className="max-w-2xl text-center lg:text-left">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-black uppercase tracking-wider mb-2.5">
                                    🏢 CORPORATE & BULK ORDERS
                                </span>
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
                                    Custom Printing For Companies, Events & Celebrations
                                </h3>
                                <p className="text-zinc-400 text-xs sm:text-sm mt-2 leading-relaxed">
                                    Need 50+ custom mugs, branded t-shirts, diaries, or festival gift hampers for your team or clients? We provide wholesale pricing with official GST invoices and doorstep delivery across India.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                                <a
                                    href="https://wa.me/919919502128?text=Hello%20RV%20Gift,%20I%20need%20a%20bulk%20order%20quote%20for%20corporate%20gifting!"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <FaWhatsapp size={16} /> Get Wholesale Quote
                                </a>
                                <button
                                    onClick={() => navigate("/contact")}
                                    className="px-5 sm:px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all backdrop-blur-md cursor-pointer"
                                >
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                7. TRUST & QUALITY PROMISE STRIP
            ════════════════════════════════════════════════════════════════ */}
            {!isFiltered && (
                <div className="max-w-7xl mx-auto px-3 sm:px-6 mb-6 sm:mb-8">
                    <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-xs p-4 sm:p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
                        {TRUST_FEATURES.map((item, idx) => (
                            <div key={idx} className={`flex items-center gap-3 sm:gap-4 ${idx > 0 ? "pt-3 sm:pt-0 sm:pl-6" : ""}`}>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-xs">
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className="text-xs sm:text-sm font-black text-zinc-900 leading-tight">
                                        {item.title}
                                    </h4>
                                    <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                8. CUSTOMER REVIEWS & TESTIMONIALS
            ════════════════════════════════════════════════════════════════ */}
            {!isFiltered && (
                <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 mb-6 sm:mb-8">
                    <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
                        <span className="text-amber-600 text-xs font-black tracking-wider uppercase mb-1 inline-block">
                            TESTIMONIALS & REVIEWS
                        </span>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-900">
                            Loved by Happy Customers
                        </h2>
                        <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">
                            Real experiences and reviews from customers who celebrated with RV Gift.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        {TESTIMONIALS.map((t, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-1 text-amber-400 mb-2.5">
                                        {[...Array(t.rating)].map((_, i) => (
                                            <FaStar key={i} size={12} />
                                        ))}
                                    </div>
                                    <p className="text-zinc-700 text-xs sm:text-sm leading-relaxed mb-3 italic">
                                        "{t.review}"
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-bold text-zinc-900">{t.name}</h4>
                                        <p className="text-[10px] text-zinc-400">{t.city} · <span className="text-emerald-600 font-semibold">Verified Buyer</span></p>
                                    </div>
                                    <span className="text-[10px] bg-stone-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">
                                        {t.product}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                9. FREQUENTLY ASKED QUESTIONS (FAQ Accordion)
            ════════════════════════════════════════════════════════════════ */}
            {!isFiltered && (
                <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-2 pb-6 sm:pb-8 mb-0">
                    <div className="text-center mb-5 sm:mb-6">
                        <span className="text-amber-600 text-xs font-black tracking-wider uppercase mb-1 inline-block">
                            GOT QUESTIONS?
                        </span>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-900">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">
                            Everything you need to know about customizing, ordering, and delivery.
                        </p>
                    </div>

                    <div className="space-y-2.5 sm:space-y-3">
                        {[
                            {
                                q: "How do I upload and customize my photos for gifts?",
                                a: "You can upload your photos, custom texts, or dates directly on the product page during checkout. Alternatively, you can also send your order ID along with high-res photos to our WhatsApp (+91 99195 02128).",
                            },
                            {
                                q: "Will I get a preview before the product is printed and dispatched?",
                                a: "Yes! For all personalized and photo print items, our design team prepares a digital 3D mockup and shares it with you on WhatsApp for approval before final laser printing.",
                            },
                            {
                                q: "How long does dispatch and delivery take across India?",
                                a: "Customized orders are crafted and dispatched within 24 to 48 hours. Express doorstep delivery typically takes 3-5 business days across all major pin codes in India.",
                            },
                            {
                                q: "Is Cash on Delivery (COD) available?",
                                a: "Yes, we support both Cash on Delivery (COD) and 100% secure Online Payments (UPI, Cards, NetBanking).",
                            },
                            {
                                q: "What if my gift arrives damaged during transit?",
                                a: "All our products are packed in 4-layer damage-proof corrugated boxes. In the rare event of transit damage, simply send us an unboxing photo/video within 48 hours, and we will send a free replacement immediately!",
                            },
                        ].map((faq, i) => (
                            <details
                                key={i}
                                className="group bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs transition-all duration-200 open:border-amber-400 open:shadow-md cursor-pointer"
                            >
                                <summary className="font-bold text-xs sm:text-sm text-zinc-900 flex items-center justify-between list-none select-none">
                                    <span>{faq.q}</span>
                                    <span className="text-amber-500 font-black text-base group-open:rotate-180 transition-transform duration-200 shrink-0 ml-3">
                                        ▾
                                    </span>
                                </summary>
                                <p className="text-zinc-600 text-xs sm:text-sm mt-2.5 pt-2.5 border-t border-stone-100 leading-relaxed">
                                    {faq.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(Home);