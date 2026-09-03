import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../contexts/AuthContext";
import RelatedProductsSlider from "../components/RelatedProductsSlider";
import { imgUrl } from "../utils/imageUrl";
import Loader from "./Loader";
import {
    FaStar, FaRegStar, FaShoppingCart, FaBolt,
    FaTrash, FaCheckCircle, FaArrowLeft,
    FaUpload, FaTimes, FaPencilAlt, FaStickyNote,
    FaRuler, FaBell, FaTag, FaChevronLeft, FaChevronRight,
    FaTruck, FaShieldAlt, FaShareAlt, FaWhatsapp, FaFacebook,
    FaTwitter, FaCopy, FaCheck
} from "react-icons/fa";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FREE_DELIVERY_TEXT = "Free delivery on online orders ₹1000+";

const StarRow = ({ value, size = 13 }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(s =>
            s <= value
                ? <FaStar key={s} className="text-amber-400" size={size} />
                : <FaRegStar key={s} className="text-stone-300" size={size} />
        )}
    </div>
);

const PriceDisplay = ({ price, mrp }) => {
    const hasDiscount = mrp && Number(mrp) > Number(price);
    const discountPct = hasDiscount
        ? Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100)
        : null;

    return (
        <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight leading-none">
                ₹{Number(price).toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
                <>
                    <span className="text-lg sm:text-xl font-bold text-zinc-400 line-through leading-none">
                        ₹{Number(mrp).toLocaleString("en-IN")}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 rounded-md leading-none shadow-xs">
                        <FaTag size={9} /> {discountPct}% OFF
                    </span>
                </>
            )}
        </div>
    );
};

const getMrp = (product) => {
    const n = Number(product?.mrp);
    return n > 0 ? n : null;
};

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addItem, cartItems } = useCart();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [activeImg, setActiveImg] = useState(0);
    const [imgZoomed, setImgZoomed] = useState(false);
    const [addedFlash, setAddedFlash] = useState(false);
    const [actionError, setActionError] = useState("");
    const [shareOpen, setShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const [customText, setCustomText] = useState("");
    const [customNote, setCustomNote] = useState("");
    const [customImagePreview, setCustomImagePreview] = useState("");
    const [customImageUrl, setCustomImageUrl] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);

    const [canReview, setCanReview] = useState(false);
    const [reviewGateChecked, setReviewGateChecked] = useState(false);
    const [myRating, setMyRating] = useState(0);
    const [myComment, setMyComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [highlightsOpen, setHighlightsOpen] = useState(true);

    const [notifyEmail, setNotifyEmail] = useState("");
    const [notifySubmitting, setNotifySubmitting] = useState(false);
    const [notifySuccess, setNotifySuccess] = useState(false);
    const [notifyError, setNotifyError] = useState("");
    const [showNotifyInput, setShowNotifyInput] = useState(false);

    const previewUrlRef = useRef("");

    const cartItem = cartItems.find(i => i._id === product?._id);
    const inCart = Boolean(cartItem);
    const showInCart = inCart && !product?.isCustomizable;

    const handleShare = async () => {
        const shareData = {
            title: product?.name ? `${product.name} | RV Gifts` : "RV Gifts",
            text: `Check out ${product?.name || "this customized gift"} on RV Gifts:`,
            url: window.location.href,
        };
        if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
            try {
                await navigator.share(shareData);
                return;
            } catch { }
        }
        setShareOpen(true);
    };

    const handleCopyLink = () => {
        try {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    const fetchReviews = async (productId) => {
        try {
            const { data } = await api.get(`/reviews/${productId}`);
            setReviews(Array.isArray(data) ? data : []);
        } catch { }
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");
        setProduct(null);
        (async () => {
            try {
                const [{ data: prod }, { data: related }] = await Promise.all([
                    api.get(`/products/${id}`),
                    api.get(`/products/${id}/related`),
                ]);
                if (cancelled) return;
                setProduct(prod);
                setRelatedProducts(Array.isArray(related) ? related : []);
                fetchReviews(prod._id);
            } catch {
                if (!cancelled) setError("Failed to load product");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    useEffect(() => {
        if (!user || !product?._id) { setCanReview(false); setReviewGateChecked(true); return; }
        let cancelled = false;
        (async () => {
            try {
                const { data } = await api.get(`/orders/can-review/${product._id}`);
                if (!cancelled) { setCanReview(data.canReview); setReviewGateChecked(true); }
            } catch {
                if (!cancelled) { setCanReview(false); setReviewGateChecked(true); }
            }
        })();
        return () => { cancelled = true; };
    }, [user, product?._id]);

    const handleCustomImageChange = async (e) => {
        const file = e.target.files[0];
        e.target.value = ""; // allow re-picking the same file after an error
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setActionError("Please choose an image file (JPG, PNG, WEBP or HEIC).");
            return;
        }
        if (file.size > 15 * 1024 * 1024) {
            setActionError("Image is too large — please use a file under 15 MB.");
            return;
        }

        setActionError("");
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const localUrl = URL.createObjectURL(file);
        previewUrlRef.current = localUrl;
        setCustomImagePreview(localUrl);

        const formData = new FormData();
        formData.append("image", file);
        try {
            setUploadingImage(true);
            const { data } = await api.post("/uploads/custom-image", formData);
            if (!data?.url) throw new Error("no-url");
            setCustomImageUrl(data.url);
        } catch (err) {
            setActionError(
                err?.response?.data?.message ||
                "Couldn't upload that photo. Please try a different image."
            );
            URL.revokeObjectURL(localUrl);
            previewUrlRef.current = "";
            setCustomImagePreview("");
            setCustomImageUrl("");
        } finally {
            setUploadingImage(false);
        }
    };

    const removeCustomImage = () => {
        if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = ""; }
        setCustomImagePreview("");
        setCustomImageUrl("");
    };

    const getCustomization = () => {
        if (!product?.isCustomizable) return null;
        const c = {};
        if (customText.trim()) c.text = customText.trim();
        if (customImageUrl) c.imageUrl = customImageUrl;
        if (customNote.trim()) c.note = customNote.trim();
        return Object.keys(c).length > 0 ? c : null;
    };

    const optionLabel = product?.sizeLabel?.trim() || "Size";
    const needsSize = product?.sizes?.length > 0 && !selectedSize;

    const handleAddToCart = () => {
        if (needsSize) { setActionError(`Please select a ${optionLabel.toLowerCase()} first`); return; }
        if (showInCart) { navigate("/cart"); return; }
        setActionError("");
        addItem({ ...product, selectedSize, customization: getCustomization() }, quantity);
        setAddedFlash(true);
        setTimeout(() => setAddedFlash(false), 2000);
    };

    const handleBuyNow = () => {
        if (needsSize) { setActionError(`Please select a ${optionLabel.toLowerCase()} first`); return; }
        setActionError("");
        navigate("/checkout", { state: { buyNowItem: { ...product, quantity, selectedSize, customization: getCustomization() } } });
    };

    const handleNotifyMe = async () => {
        const email = notifyEmail.trim();
        if (!EMAIL_RE.test(email)) { setNotifyError("Please enter a valid email address"); return; }
        try {
            setNotifySubmitting(true);
            await api.post(`/products/${product._id}/notify`, { email });
            setNotifySuccess(true);
        } catch (err) {
            setNotifyError(err.response?.data?.message || "Something went wrong.");
        } finally {
            setNotifySubmitting(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (myRating === 0) return setReviewError("Please select a star rating");
        try {
            setSubmitting(true);
            setReviewError("");
            await api.post(`/reviews/${product._id}`, { rating: myRating, comment: myComment });
            setReviewSuccess(true);
            await fetchReviews(product._id);
        } catch (err) {
            setReviewError(err.response?.data?.message || "Review failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        try {
            await api.delete(`/reviews/${reviewId}`);
            await fetchReviews(product._id);
        } catch { }
    };

    if (loading) return (
        <div className="min-h-[80vh] flex items-center justify-center bg-stone-50">
            <Loader size="lg" text="Loading product details..." subtext="Getting customization options..." />
        </div>
    );

    if (!product || error) return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-stone-50 px-4 gap-4 text-center">
            <span className="text-5xl">🎁</span>
            <h2 className="text-xl font-black text-zinc-800">{error || "Product not found"}</h2>
            <p className="text-xs text-zinc-400 max-w-sm">The product you are looking for might have been moved or is currently unavailable.</p>
            <button onClick={() => navigate("/products")} className="px-6 py-2.5 bg-amber-500 text-zinc-950 font-black rounded-xl text-sm hover:bg-amber-400 transition-all cursor-pointer">
                Browse Products
            </button>
        </div>
    );

    const images = Array.isArray(product.images) ? product.images.filter(im => im?.url) : [];
    const safeActive = Math.min(activeImg, Math.max(0, images.length - 1));
    const activeUrl = images[safeActive]?.url || "";
    const heroImageUrl = activeUrl ? imgUrl.detail(activeUrl) : "";
    const zoomImageUrl = activeUrl ? imgUrl.zoom(activeUrl) : "";

    const goImg = (dir) => {
        if (images.length < 2) return;
        setActiveImg((safeActive + dir + images.length) % images.length);
    };

    const highlightEntries = product.highlights
        ? (product.highlights instanceof Map ? [...product.highlights.entries()] : Object.entries(product.highlights))
        : [];

    const numReviews = product.numReviews || 0;
    const avgRating = product.rating || 0;
    const hasRating = numReviews > 0 && avgRating > 0;
    const ratingBars = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        pct: reviews.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
    }));

    const mrpValue = getMrp(product);
    const hasDiscount = mrpValue && mrpValue > Number(product.price);
    const savedAmount = hasDiscount ? mrpValue - Number(product.price) : 0;
    const discountPct = hasDiscount ? Math.round((savedAmount / mrpValue) * 100) : null;

    return (
        <div className="min-h-screen bg-stone-100/60 pb-12 sm:pb-16 overflow-x-hidden w-full max-w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
                .fade-up { animation: fadeUp 0.3s ease forwards; }
                .img-zoom { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .img-zoom:hover { transform: scale(1.03); }
                @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
                .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
            `}</style>

            {/* ── TOP NAV BAR & BREADCRUMBS ── */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm text-zinc-600 hover:text-amber-600 font-bold transition-colors cursor-pointer group"
                >
                    <span className="w-8 h-8 rounded-xl bg-white border border-stone-200 shadow-xs flex items-center justify-center group-hover:border-amber-400 group-hover:bg-amber-50 transition-all">
                        <FaArrowLeft size={11} />
                    </span>
                    <span>Back</span>
                </button>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 overflow-hidden text-ellipsis whitespace-nowrap">
                        <Link to="/" className="hover:text-zinc-700 transition-colors">Home</Link>
                        <span>/</span>
                        <Link to="/products" className="hover:text-zinc-700 transition-colors">Products</Link>
                        {product.category && (
                            <>
                                <span>/</span>
                                <span className="text-zinc-600 font-bold capitalize truncate max-w-[150px]">{product.category.replace(/-/g, " ")}</span>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-amber-50 hover:border-amber-400 text-zinc-700 hover:text-amber-700 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        title="Share Product"
                    >
                        <FaShareAlt className="text-amber-500" size={11} />
                        <span>Share</span>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-3 sm:px-6 space-y-4 fade-up w-full">
                {/* ══ MAIN PRODUCT CARD ══ */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                        {/* ── IMAGE GALLERY (CLEAN FULL FIT) ── */}
                        <div className="lg:col-span-6 xl:col-span-5 p-3 sm:p-6 lg:border-r border-stone-100 flex flex-col justify-between">
                            <div className="relative w-full aspect-square max-h-[380px] sm:max-h-[440px] md:max-h-[500px] rounded-2xl bg-white border border-stone-200/70 flex items-center justify-center overflow-hidden select-none group">
                                {heroImageUrl ? (
                                    <>
                                        <div
                                            className="w-full h-full flex items-center justify-center cursor-zoom-in"
                                            onClick={() => setImgZoomed(true)}
                                            role="button"
                                            tabIndex={0}
                                            aria-label="Click to zoom image"
                                            onKeyDown={e => e.key === "Enter" && setImgZoomed(true)}
                                        >
                                            <img
                                                key={activeUrl}
                                                src={heroImageUrl}
                                                alt={`${product.name} — view ${safeActive + 1}`}
                                                loading="eager"
                                                decoding="async"
                                                className="w-full h-full object-cover img-zoom"
                                            />
                                        </div>
                                        {images.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => goImg(-1)}
                                                    aria-label="Previous image"
                                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-zinc-700 shadow-md border border-stone-200 flex items-center justify-center transition-all cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                                                >
                                                    <FaChevronLeft size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => goImg(1)}
                                                    aria-label="Next image"
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-zinc-700 shadow-md border border-stone-200 flex items-center justify-center transition-all cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                                                >
                                                    <FaChevronRight size={12} />
                                                </button>
                                                <div className="absolute bottom-3 right-3 z-20 bg-zinc-900/75 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                                                    {safeActive + 1} / {images.length}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-7xl">🎁</span>
                                )}
                                <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1.5 pointer-events-none">
                                    {hasDiscount && discountPct && (
                                        <span className="bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-xs">
                                            {discountPct}% OFF
                                        </span>
                                    )}
                                    {product.isCustomizable && (
                                        <span className="bg-zinc-900/85 backdrop-blur-xs text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 border border-amber-400/30">
                                            ✨ Custom Name/Photo
                                        </span>
                                    )}
                                    {!product.inStock && (
                                        <span className="bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-xs">
                                            Sold Out
                                        </span>
                                    )}
                                </div>
                            </div>
                            {images.length > 1 && (
                                <div className="flex gap-2.5 mt-3.5 overflow-x-auto pb-1 scrollbar-none">
                                    {images.map((im, i) => (
                                        <button
                                            key={im.public_id || im.url || i}
                                            type="button"
                                            onClick={() => setActiveImg(i)}
                                            aria-label={`View image ${i + 1}`}
                                            className={`shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded-xl border-2 overflow-hidden bg-white transition-all cursor-pointer p-0.5 flex items-center justify-center ${
                                                i === safeActive
                                                    ? "border-amber-500 ring-3 ring-amber-400/20 bg-amber-50/20 shadow-xs"
                                                    : "border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100"
                                            }`}
                                        >
                                            <img
                                                src={imgUrl.thumbnail(im.url)}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs text-zinc-500">
                                <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50/80"><FaTruck className="text-amber-500 shrink-0" size={14} /><span className="font-semibold text-zinc-700 leading-tight">Pan-India Express</span></div>
                                <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50/80"><FaShieldAlt className="text-emerald-500 shrink-0" size={14} /><span className="font-semibold text-zinc-700 leading-tight">100% Quality Checked</span></div>
                            </div>
                        </div>

                        {/* ── PRODUCT DETAILS & ACTIONS ── */}
                        <div className="lg:col-span-6 xl:col-span-7 p-4 sm:p-7 lg:p-8 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                                    {product.category && <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-md">{product.category.replace(/-/g, " ")}</span>}
                                    <div className="flex items-center gap-1.5 text-xs font-bold">
                                        {product.inStock ? (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
                                                <span className="text-emerald-700">In Stock</span>
                                                {product.stock > 0 && product.stock <= 10 && <span className="text-[11px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-extrabold border border-amber-300">⚡ Only {product.stock} left!</span>}
                                            </>
                                        ) : (<><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-red-600">Out of Stock</span></>)}
                                    </div>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight leading-snug mb-2">{product.name}</h1>
                                <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                                    {hasRating ? (
                                        <div className="flex items-center gap-2 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200/70">
                                            <span className="text-xs font-black text-zinc-900">{avgRating.toFixed(1)}</span>
                                            <StarRow value={Math.round(avgRating)} size={11} />
                                            <span className="text-[11px] text-zinc-400 font-bold">({numReviews})</span>
                                        </div>
                                    ) : (<span className="text-xs text-zinc-400 font-medium">No ratings yet</span>)}
                                    <span className="text-xs text-zinc-400 font-medium">|</span>
                                    <span className="text-xs text-zinc-500 font-semibold">SKU: {product._id.slice(-6).toUpperCase()}</span>
                                </div>
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-stone-50 via-amber-50/20 to-stone-50 border border-stone-200/70 mb-4">
                                    <PriceDisplay price={product.price} mrp={mrpValue} />
                                    <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-stone-200/50">
                                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md">{FREE_DELIVERY_TEXT}</span>
                                        {hasDiscount && savedAmount > 0 && <span className="text-xs text-zinc-700 font-semibold">You save <strong className="text-emerald-700 font-black">₹{savedAmount.toLocaleString("en-IN")}</strong></span>}
                                    </div>
                                </div>
                                {product.description && <div className="mb-5"><p className="text-zinc-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">{product.description}</p></div>}
                                {product.sizes?.length > 0 && (
                                    <div className="mb-5 p-3.5 rounded-2xl bg-stone-50/60 border border-stone-200/60">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1.5"><FaRuler size={11} className="text-amber-500" />Select {optionLabel}</span>
                                            {selectedSize && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Selected: {selectedSize}</span>}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {product.sizes.map(size => (
                                                <button key={size} type="button" onClick={() => { setSelectedSize(size); setActionError(""); }} className={`min-w-[48px] h-10 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${selectedSize === size ? "bg-zinc-950 text-white shadow-md shadow-zinc-950/20 ring-2 ring-zinc-950" : "bg-white text-zinc-700 border border-stone-200 hover:border-amber-400 hover:text-amber-600"}`}>{size}</button>
                                            ))}
                                        </div>
                                        {!selectedSize && <p className="text-[11px] text-amber-600 mt-1.5 font-bold">⚠️ Please select a {optionLabel.toLowerCase()} before placing order</p>}
                                    </div>
                                )}
                                {product.isCustomizable && (
                                    <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-yellow-50/60 border-1.5 border-amber-300/80 shadow-xs space-y-3">
                                        <div className="flex items-center justify-between"><span className="font-black text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">✨ Personalization Studio</span><span className="text-[10px] font-extrabold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded-full">Free Mockup</span></div>
                                        <div>
                                            <label className="text-[11px] font-bold text-zinc-700 mb-1 flex items-center gap-1 block"><FaPencilAlt size={9} className="text-amber-600" /> Name / Custom Text to Print</label>
                                            <input type="text" value={customText} onChange={e => setCustomText(e.target.value)} className="w-full px-3.5 py-2.5 border border-amber-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-zinc-700 mb-1 flex items-center gap-1 block"><FaUpload size={9} className="text-amber-600" /> Upload Photo or Logo</label>
                                            {!customImagePreview ? (
                                                <label className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-dashed border-amber-300 rounded-xl cursor-pointer hover:border-amber-500 hover:bg-white/80 transition-all bg-white/50">{uploadingImage ? <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <><FaUpload className="text-amber-500" size={13} /><span className="text-xs text-amber-800 font-bold">Click to select image file</span></>}<input type="file" accept="image/*" onChange={handleCustomImageChange} className="hidden" /></label>
                                            ) : (
                                                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-amber-200"><div className="relative"><img src={customImagePreview} alt="custom preview" className="h-14 w-14 object-cover rounded-lg border border-amber-300" /><button type="button" onClick={removeCustomImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-xs"><FaTimes size={9} /></button></div><div className="text-xs"><p className="font-bold text-zinc-800">Photo Attached ✅</p><p className="text-[11px] text-zinc-400">Our designer will optimize resolution</p></div></div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-zinc-700 mb-1 flex items-center gap-1 block"><FaStickyNote size={9} className="text-amber-600" /> Notes / Placement Instructions</label>
                                            <textarea value={customNote} onChange={e => setCustomNote(e.target.value)} rows={2} className="w-full px-3.5 py-2 border border-amber-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none" />
                                        </div>
                                    </div>
                                )}
                                {actionError && <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 flex items-center gap-2"><span>⚠️</span> {actionError}</div>}
                            </div>
                            {/* ── DYNAMIC IN-CARD ACTION BUTTONS (VISIBLE ON ALL SCREENS) ── */}
                            <div className="mt-5 pt-4 border-t border-stone-200/80 space-y-3">
                                {product.inStock ? (
                                    <>
                                        {/* Dynamic Quantity Selector */}
                                        <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Quantity:</span>
                                                <div className="flex items-center bg-white border border-stone-300 rounded-xl overflow-hidden shadow-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                        disabled={quantity <= 1}
                                                        className="w-8 h-8 flex items-center justify-center font-black text-zinc-700 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm cursor-pointer"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-8 text-center font-black text-xs sm:text-sm text-zinc-900 select-none">
                                                        {quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuantity(q => Math.min(product?.stock || 99, q + 1))}
                                                        disabled={product?.stock ? quantity >= product.stock : false}
                                                        className="w-8 h-8 flex items-center justify-center font-black text-zinc-700 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm cursor-pointer"
                                                        aria-label="Increase quantity"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-zinc-400 block uppercase leading-tight">Total Price</span>
                                                <span className="text-sm sm:text-base font-black text-zinc-950 leading-tight">
                                                    ₹{(Number(product.price) * quantity).toLocaleString("en-IN")}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Main Dynamic Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                                            <button
                                                type="button"
                                                onClick={handleAddToCart}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.98] ${
                                                    showInCart
                                                        ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-300 hover:bg-emerald-100"
                                                        : addedFlash
                                                        ? "bg-emerald-600 text-white shadow-emerald-200 shadow-md animate-pulse"
                                                        : "bg-zinc-950 text-white hover:bg-zinc-800"
                                                }`}
                                            >
                                                <FaShoppingCart size={13} className={addedFlash ? "animate-bounce" : ""} />
                                                <span>
                                                    {showInCart
                                                        ? `In Cart (${cartItem?.quantity || 1}) — View Cart →`
                                                        : addedFlash
                                                        ? "Added Successfully! 🎉"
                                                        : `Add to Cart ${quantity > 1 ? `(${quantity})` : ""}`}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleBuyNow}
                                                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm text-zinc-950 transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-md shadow-amber-300/60 hover:shadow-amber-400 hover:scale-[1.01]"
                                                style={{
                                                    background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
                                                }}
                                            >
                                                <FaBolt size={13} className="text-zinc-950 animate-pulse" />
                                                <span>Buy Now • ₹{(Number(product.price) * quantity).toLocaleString("en-IN")}</span>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        {notifySuccess ? (
                                            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                                                <FaCheckCircle className="text-emerald-600 shrink-0" size={20} />
                                                <div>
                                                    <p className="text-sm font-black text-emerald-800">You're on the priority alert list!</p>
                                                    <p className="text-xs text-emerald-600">We'll email you immediately once restocked.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                                                <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-xs">
                                                    <FaBell size={12} className="text-amber-600" />
                                                    Get Notified When Available
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="email"
                                                        value={notifyEmail}
                                                        onChange={e => { setNotifyEmail(e.target.value); setNotifyError(""); }}
                                                        placeholder=""
                                                        className="flex-1 px-3 py-2 border border-amber-300 rounded-xl text-xs bg-white focus:outline-none"
                                                    />
                                                    <button
                                                        onClick={handleNotifyMe}
                                                        disabled={notifySubmitting}
                                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-xl text-xs cursor-pointer"
                                                    >
                                                        {notifySubmitting ? "..." : "Notify Me"}
                                                    </button>
                                                </div>
                                                {notifyError && <p className="text-xs text-red-500 mt-1">{notifyError}</p>}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ PRODUCT HIGHLIGHTS & SPECS ══ */}
                {highlightEntries.length > 0 && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
                        <button
                            onClick={() => setHighlightsOpen(o => !o)}
                            className="w-full flex items-center justify-between px-4 sm:px-7 py-4 hover:bg-stone-50 transition-colors cursor-pointer"
                        >
                            <h2 className="font-black text-zinc-900 text-base sm:text-lg flex items-center gap-2.5">
                                <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
                                Product Specifications & Highlights
                            </h2>
                            <span
                                className="text-zinc-400 text-base font-bold transition-transform duration-200"
                                style={{ transform: highlightsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                            >
                                ▾
                            </span>
                        </button>
                        {highlightsOpen && (
                            <div className="px-4 sm:px-7 pb-6 pt-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 border-t border-stone-100 pt-4">
                                    {highlightEntries.map(([key, value]) => (
                                        <div key={key} className="flex items-start justify-between py-2 border-b border-stone-100 text-xs sm:text-sm">
                                            <span className="text-zinc-400 font-medium">{key}</span>
                                            <span className="font-bold text-zinc-800 text-right">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ RATINGS & REVIEWS SECTION ══ */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-xs p-4 sm:p-7 overflow-hidden">
                    <h2 className="font-black text-zinc-900 text-lg sm:text-xl mb-5 flex items-center gap-2.5">
                        <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
                        Customer Ratings & Reviews
                    </h2>

                    {reviews.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-6 mb-6 p-4 sm:p-6 bg-stone-50 rounded-2xl border border-stone-200/70">
                            <div className="text-center sm:border-r border-stone-200/70 sm:pr-8 shrink-0 flex flex-col items-center justify-center">
                                <p className="text-4xl sm:text-5xl font-black text-zinc-950 leading-none">{avgRating.toFixed(1)}</p>
                                <div className="my-2">
                                    <StarRow value={Math.round(avgRating)} size={14} />
                                </div>
                                <p className="text-xs text-zinc-400 font-bold">{reviews.length} Verified Reviews</p>
                            </div>
                            <div className="flex-1 space-y-1.5 justify-center flex flex-col">
                                {ratingBars.map(({ star, count, pct }) => (
                                    <div key={star} className="flex items-center gap-2.5 text-xs">
                                        <span className="text-zinc-600 font-bold w-4 shrink-0">{star}★</span>
                                        <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-zinc-400 font-medium w-6 text-right shrink-0">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Write Review Gated Area */}
                    {!user ? (
                        <button
                            onClick={() => navigate("/login")}
                            className="mb-6 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs"
                        >
                            Login to Write a Review
                        </button>
                    ) : !reviewGateChecked ? (
                        <div className="mb-6 h-10 w-44 bg-stone-100 rounded-xl animate-pulse" />
                    ) : canReview ? (
                        <form onSubmit={handleSubmitReview} className="mb-6 bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200">
                            <p className="text-sm font-black text-zinc-900 mb-2">Rate & Review Product</p>
                            <div className="flex gap-1.5 mb-3">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setMyRating(s)}
                                        className="text-2xl cursor-pointer hover:scale-110 transition-transform active:scale-95"
                                    >
                                        {s <= myRating ? <FaStar className="text-amber-400" /> : <FaRegStar className="text-stone-300" />}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={myComment}
                                onChange={e => setMyComment(e.target.value)}
                                rows={3}
                                maxLength={2000}
                                placeholder=""
                                className="w-full border border-stone-200 rounded-xl p-3 text-xs sm:text-sm mb-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none transition-all"
                            />
                            {reviewError && <p className="text-red-500 text-xs mb-2 font-bold">⚠️ {reviewError}</p>}
                            {reviewSuccess && (
                                <p className="text-emerald-600 text-xs mb-2 flex items-center gap-1 font-bold">
                                    <FaCheckCircle /> Review posted successfully!
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl font-black text-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer shadow-xs"
                            >
                                {submitting ? "Submitting..." : "Submit Review"}
                            </button>
                        </form>
                    ) : (
                        <div className="mb-6 flex items-start gap-3 bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-xs text-zinc-500">
                            <span className="text-base">🛍️</span>
                            <span>Only verified customers who purchased this item can leave a review after order delivery.</span>
                        </div>
                    )}

                    {/* Review List */}
                    {reviews.length === 0 ? (
                        <div className="text-center py-8 bg-stone-50/70 rounded-2xl border border-dashed border-stone-200">
                            <p className="text-2xl mb-1.5">⭐</p>
                            <p className="text-zinc-600 font-bold text-xs">No reviews yet for this product</p>
                            <p className="text-zinc-400 text-[11px] mt-0.5">Be the first to share your experience!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reviews.map(r => {
                                const isOwn = user && (r.user === user._id || r.user?._id === user._id);
                                return (
                                    <div key={r._id} className="bg-stone-50/70 rounded-2xl border border-stone-100 p-4 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                                                    {r.name?.[0]?.toUpperCase() || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-900 text-xs">{r.name}</p>
                                                    <StarRow value={r.rating} size={10} />
                                                </div>
                                            </div>
                                            {isOwn && (
                                                <button
                                                    onClick={() => handleDeleteReview(r._id)}
                                                    className="text-stone-300 hover:text-red-500 transition-colors cursor-pointer p-1"
                                                >
                                                    <FaTrash size={11} />
                                                </button>
                                            )}
                                        </div>
                                        {r.comment && <p className="text-xs text-zinc-600 mt-2 leading-relaxed">{r.comment}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ══ RELATED PRODUCTS SLIDER ══ */}
                {relatedProducts.length > 0 && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-xs p-4 sm:p-7 overflow-hidden">
                        <h2 className="font-black text-zinc-900 text-lg sm:text-xl mb-4 flex items-center gap-2.5">
                            <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
                            Similar & Recommended Gifts
                        </h2>
                        <RelatedProductsSlider products={relatedProducts} />
                    </div>
                )}
            </div>

            {/* ══ PRODUCT SHARE MODAL (PRODUCTION READY) ══ */}
            {shareOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs fade-up"
                    onClick={() => setShareOpen(false)}
                >
                    <div
                        className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                            <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <FaShareAlt size={13} />
                                </span>
                                <div>
                                    <h3 className="font-black text-zinc-900 text-sm sm:text-base leading-none">Share this Gift</h3>
                                    <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Share with family and friends</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShareOpen(false)}
                                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-zinc-600 flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="Close share modal"
                            >
                                <FaTimes size={13} />
                            </button>
                        </div>

                        {/* Mini Product Preview */}
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200/80 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                                <img src={heroImageUrl} alt={product.name} className="max-h-full max-w-full object-contain" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs text-zinc-800 truncate">{product.name}</p>
                                <p className="font-black text-xs text-zinc-950">₹{Number(product.price).toLocaleString("en-IN")}</p>
                            </div>
                        </div>

                        {/* Social Share Buttons */}
                        <div className="grid grid-cols-3 gap-2.5 mb-4">
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${product.name} on RV Gifts! Price: ₹${product.price} \n${window.location.href}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-black text-xs transition-all active:scale-95"
                            >
                                <span className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                    <FaWhatsapp size={18} />
                                </span>
                                <span>WhatsApp</span>
                            </a>

                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-black text-xs transition-all active:scale-95"
                            >
                                <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                    <FaFacebook size={18} />
                                </span>
                                <span>Facebook</span>
                            </a>

                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${product.name} on RV Gifts!`)}&url=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-black text-xs transition-all active:scale-95"
                            >
                                <span className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-xs">
                                    <FaTwitter size={16} />
                                </span>
                                <span>Twitter</span>
                            </a>
                        </div>

                        {/* Copy Link Input Bar */}
                        <div className="flex items-center gap-2 p-1.5 pl-3 bg-stone-50 border border-stone-200 rounded-2xl">
                            <span className="text-xs text-zinc-500 font-mono truncate flex-1">{window.location.href}</span>
                            <button
                                type="button"
                                onClick={handleCopyLink}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                    copied
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-xs active:scale-95"
                                }`}
                            >
                                {copied ? <><FaCheck size={11} /> Copied!</> : <><FaCopy size={11} /> Copy Link</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ IMAGE FULLSCREEN LIGHTBOX ══ */}
            {imgZoomed && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-xs" onClick={() => setImgZoomed(false)}>
                    <img src={zoomImageUrl} alt={product.name} loading="eager" decoding="async" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
                    {images.length > 1 && (
                        <>
                            <button onClick={e => { e.stopPropagation(); goImg(-1); }} aria-label="Previous image" className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all cursor-pointer"><FaChevronLeft size={16} /></button>
                            <button onClick={e => { e.stopPropagation(); goImg(1); }} aria-label="Next image" className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all cursor-pointer"><FaChevronRight size={16} /></button>
                        </>
                    )}
                    <button onClick={() => setImgZoomed(false)} aria-label="Close" className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all cursor-pointer"><FaTimes size={16} /></button>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
