import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../contexts/AuthContext";
import RelatedProductsSlider from "../components/RelatedProductsSlider";
import { imgUrl } from "../utils/imageUrl";
import {
    FaStar, FaRegStar, FaShoppingCart, FaBolt,
    FaTrash, FaCheckCircle, FaArrowLeft,
    FaUpload, FaTimes, FaPencilAlt, FaStickyNote,
    FaRuler, FaBell, FaTag,
} from "react-icons/fa";

const StarRow = ({ value }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s =>
            s <= value
                ? <FaStar key={s} className="text-amber-400" size={13} />
                : <FaRegStar key={s} className="text-stone-300" size={13} />
        )}
    </div>
);

// ✅ Safely extract MRP — supports mrp, originalPrice, comparePrice, compareAtPrice
const getMrp = (product) => {
    const val = product?.mrp ?? product?.originalPrice ?? product?.comparePrice ?? product?.compareAtPrice ?? null;
    if (val === null || val === undefined || val === "") return null;
    const n = Number(val);
    return n > 0 ? n : null;
};

// ✅ Price display component
const PriceDisplay = ({ price, mrp }) => {
    const hasDiscount = mrp && Number(mrp) > Number(price);
    const discountPct = hasDiscount
        ? Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100)
        : null;

    return (
        <div className="flex flex-wrap items-end gap-3 mb-1">
            <span className="text-4xl font-black text-zinc-900 leading-none">
                ₹{Number(price).toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
                <>
                    <span className="text-xl font-semibold text-zinc-400 line-through leading-none mb-0.5">
                        ₹{Number(mrp).toLocaleString("en-IN")}
                    </span>
                    <span className="flex items-center gap-1 bg-green-500 text-white text-xs font-black px-2.5 py-1 rounded-lg leading-none mb-0.5">
                        <FaTag size={9} /> {discountPct}% off
                    </span>
                </>
            )}
        </div>
    );
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
    const [imgZoomed, setImgZoomed] = useState(false);
    const [addedFlash, setAddedFlash] = useState(false);

    const [customText, setCustomText] = useState("");
    const [customNote, setCustomNote] = useState("");
    const [customImagePreview, setCustomImagePreview] = useState("");
    const [customImageUrl, setCustomImageUrl] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);

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

    const inCart = cartItems.some(i => i._id === id);

    const fetchReviews = async () => {
        try {
            const { data } = await api.get(`/reviews/${id}`);
            setReviews(data);
        } catch { }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [{ data: prod }, { data: related }] = await Promise.all([
                    api.get(`/products/${id}`),
                    api.get(`/products/${id}/related`),
                ]);
                // ✅ Debug log — browser console mein dekho kya field naam aa raha hai
                console.log("[ProductDetails] price fields:", {
                    price: prod.price,
                    mrp: prod.mrp,
                    originalPrice: prod.originalPrice,
                    comparePrice: prod.comparePrice,
                });
                setProduct(prod);
                setRelatedProducts(related);
                await fetchReviews();
            } catch {
                setError("Failed to load product");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (!user || reviews.length === 0) return;
        const mine = reviews.find(r => r.user === user._id || r.user?._id === user._id);
        if (mine) { setMyRating(mine.rating); setMyComment(mine.comment || ""); }
    }, [reviews, user]);

    useEffect(() => {
        if (user?.email) setNotifyEmail(user.email);
    }, [user]);

    const handleCustomImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size / (1024 * 1024) > 5) return alert("Image must be under 5MB");
        setCustomImagePreview(URL.createObjectURL(file));
        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append("image", file);
            const { data } = await api.post("/uploads/custom-image", formData);
            setCustomImageUrl(data.url);
        } catch {
            alert("Image upload failed. Try again.");
            setCustomImagePreview("");
        } finally {
            setUploadingImage(false);
        }
    };

    const removeCustomImage = () => { setCustomImagePreview(""); setCustomImageUrl(""); };
    const getCustomization = () => ({ text: customText.trim(), imageUrl: customImageUrl, note: customNote.trim() });

    const handleAddToCart = () => {
        if (product.sizes?.length > 0 && !selectedSize) return alert("Please select a size first!");
        addItem({ ...product, selectedSize, customization: getCustomization() });
        setAddedFlash(true);
        setTimeout(() => setAddedFlash(false), 1500);
    };

    const handleBuyNow = () => {
        if (product.sizes?.length > 0 && !selectedSize) return alert("Please select a size first!");
        navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1, selectedSize, customization: getCustomization() } } });
    };

    const handleNotifyMe = async () => {
        if (!notifyEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) {
            setNotifyError("Please enter a valid email address");
            return;
        }
        try {
            setNotifySubmitting(true);
            setNotifyError("");
            const key = `notify_${id}`;
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            if (!existing.includes(notifyEmail.trim())) {
                existing.push(notifyEmail.trim());
                localStorage.setItem(key, JSON.stringify(existing));
            }
            setNotifySuccess(true);
            setShowNotifyInput(false);
        } catch {
            setNotifyError("Something went wrong. Try again.");
        } finally {
            setNotifySubmitting(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (myRating === 0) return setReviewError("Please select a rating");
        try {
            setSubmitting(true);
            setReviewError("");
            await api.post(`/reviews/${id}`, { rating: myRating, comment: myComment });
            setReviewSuccess(true);
            await fetchReviews();
            const { data } = await api.get(`/products/${id}`);
            setProduct(data);
            setTimeout(() => setReviewSuccess(false), 2500);
        } catch (err) {
            setReviewError(err.response?.data?.message || "Review failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        try {
            await api.delete(`/reviews/${reviewId}`);
            await fetchReviews();
            setMyRating(0); setMyComment("");
        } catch { }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-zinc-400 text-sm font-medium">Loading product...</p>
            </div>
        </div>
    );

    if (!product || error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-3">
            <p className="text-5xl">😕</p>
            <p className="text-zinc-600 font-bold">{error || "Product not found"}</p>
            <button onClick={() => navigate("/")} className="px-5 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all cursor-pointer">
                Go Home
            </button>
        </div>
    );

    const heroImageUrl = imgUrl.detail(product.images?.[0]?.url || "");
    const zoomImageUrl = imgUrl.zoom(product.images?.[0]?.url || "");

    const highlightEntries = product.highlights
        ? (product.highlights instanceof Map ? [...product.highlights.entries()] : Object.entries(product.highlights))
        : [];

    const avgRating = product.rating || 0;
    const ratingBars = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        pct: reviews.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
    }));

    // ✅ Safely get MRP
    const mrpValue = getMrp(product);
    const hasDiscount = mrpValue && mrpValue > Number(product.price);
    const savedAmount = hasDiscount ? mrpValue - Number(product.price) : 0;
    const discountPct = hasDiscount ? Math.round((savedAmount / mrpValue) * 100) : null;

    return (
        <div className="min-h-screen bg-stone-100 py-6 px-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                .fade-up { animation: fadeUp 0.35s ease forwards; }
                .img-zoom { transition: transform 0.4s ease; }
                .img-zoom:hover { transform: scale(1.06); }
                @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
                .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
                @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
                .slide-down { animation: slideDown 0.2s ease forwards; }
            `}</style>

            <div className="max-w-6xl mx-auto space-y-4 fade-up">

                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-amber-600 font-semibold transition-colors cursor-pointer group">
                    <span className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center group-hover:border-amber-300 group-hover:bg-amber-50 transition-all">
                        <FaArrowLeft size={11} />
                    </span>
                    Back
                </button>

                <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-0">

                        {/* ── IMAGE ── */}
                        <div className="relative bg-gradient-to-br from-stone-50 via-white to-amber-50/20 flex items-center justify-center overflow-hidden"
                            style={{ minHeight: "420px" }}>
                            {heroImageUrl ? (
                                <div className="w-full h-full flex items-center justify-center p-8 overflow-hidden cursor-zoom-in"
                                    onClick={() => setImgZoomed(true)}>
                                    <img
                                        src={heroImageUrl}
                                        alt={product.name}
                                        loading="eager"
                                        decoding="async"
                                        width={800}
                                        height={800}
                                        className="max-h-80 w-full object-contain img-zoom drop-shadow-lg"
                                    />
                                </div>
                            ) : (
                                <span className="text-7xl">🎁</span>
                            )}
                            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                                {product.isCustomizable && (
                                    <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                                        ✏️ Customizable
                                    </span>
                                )}
                                {!product.inStock && (
                                    <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                                        Sold Out
                                    </span>
                                )}
                                {hasDiscount && discountPct && (
                                    <span className="bg-green-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm">
                                        {discountPct}% OFF
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ── INFO ── */}
                        <div className="flex flex-col p-6 md:p-8 border-t md:border-t-0 md:border-l border-stone-100">

                            {product.category && (
                                <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-2">
                                    {product.category.replace(/-/g, " ")}
                                </span>
                            )}

                            <h1 className="text-2xl font-black text-zinc-900 leading-tight mb-3">{product.name}</h1>

                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                <span className={`flex items-center gap-1 text-white text-xs px-2.5 py-1 rounded-lg font-black ${avgRating >= 4 ? "bg-emerald-500" : avgRating >= 3 ? "bg-amber-400" : "bg-zinc-400"}`}>
                                    {avgRating.toFixed(1)} <FaStar size={9} />
                                </span>
                                <span className="text-sm text-zinc-400 font-medium">{product.numReviews || 0} ratings</span>
                                <span className="text-zinc-200">|</span>
                                <span className="text-xs text-zinc-400">{reviews.length} reviews</span>
                            </div>

                            {/* ✅ Price section */}
                            <div className="mb-3 pb-4 border-b border-stone-100">
                                <PriceDisplay price={product.price} mrp={mrpValue} />
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                        Free Delivery ₹499+
                                    </span>
                                    {hasDiscount && savedAmount > 0 && (
                                        <span className="text-xs text-green-700 font-bold bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                            You save ₹{savedAmount.toLocaleString("en-IN")}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Stock Indicator */}
                            <div className="flex items-center gap-2 mb-4">
                                {product.inStock ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
                                        <span className="text-sm font-bold text-emerald-600">In Stock</span>
                                        {product.stock > 0 && product.stock <= 10 && (
                                            <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                                ⚡ Only {product.stock} left!
                                            </span>
                                        )}
                                        {product.stock > 10 && (
                                            <span className="text-xs text-zinc-400 font-medium">({product.stock} units available)</span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-sm font-bold text-red-500">Out of Stock</span>
                                    </>
                                )}
                            </div>

                            {product.description && (
                                <p className="text-zinc-500 text-sm leading-relaxed mb-4">{product.description}</p>
                            )}

                            {product.sizes?.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-bold text-zinc-700 mb-2 flex items-center gap-1.5">
                                        <FaRuler size={11} className="text-zinc-400" />
                                        Select Size
                                        {selectedSize && <span className="text-amber-600 font-black">— {selectedSize}</span>}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {product.sizes.map(size => (
                                            <button key={size} onClick={() => setSelectedSize(size)}
                                                className={`min-w-[44px] h-10 px-3 rounded-xl text-sm font-bold border transition-all cursor-pointer active:scale-95 ${selectedSize === size ? "bg-zinc-900 text-white border-zinc-900 shadow-sm" : "bg-white text-zinc-600 border-stone-200 hover:border-amber-400 hover:text-amber-600"}`}>
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                    {!selectedSize && <p className="text-xs text-amber-600 mt-1.5 font-medium">⚠️ Please select a size</p>}
                                </div>
                            )}

                            {product.isCustomizable && (
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-4 space-y-3">
                                    <p className="font-black text-amber-800 text-sm flex items-center gap-1.5">✏️ Customize Your Order</p>
                                    <div>
                                        <label className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1 block">
                                            <FaPencilAlt size={9} /> Name / Message to Print
                                        </label>
                                        <input type="text" value={customText} onChange={e => setCustomText(e.target.value)}
                                            placeholder="e.g. Happy Birthday Rahul! 🎂"
                                            className="w-full px-3 py-2.5 border border-amber-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1 block">
                                            <FaUpload size={9} /> Upload Photo / Design
                                        </label>
                                        {!customImagePreview ? (
                                            <label className="flex items-center justify-center gap-2 w-full h-20 border-2 border-dashed border-amber-300 rounded-xl cursor-pointer hover:border-amber-500 hover:bg-white/60 transition-all">
                                                {uploadingImage
                                                    ? <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                                    : <><FaUpload className="text-amber-400" /><span className="text-sm text-amber-600 font-semibold">Click to upload</span></>
                                                }
                                                <input type="file" accept="image/*" onChange={handleCustomImageChange} className="hidden" />
                                            </label>
                                        ) : (
                                            <div className="relative inline-block">
                                                <img src={customImagePreview} alt="custom" loading="lazy" decoding="async"
                                                    className="h-20 w-20 object-cover rounded-xl border-2 border-amber-300" />
                                                <button onClick={removeCustomImage} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer">
                                                    <FaTimes size={9} />
                                                </button>
                                                {customImageUrl && <span className="absolute bottom-1 left-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">✓</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1 block">
                                            <FaStickyNote size={9} /> Special Instructions
                                        </label>
                                        <textarea value={customNote} onChange={e => setCustomNote(e.target.value)}
                                            placeholder="e.g. White background, bold font..." rows={2}
                                            className="w-full px-3 py-2.5 border border-amber-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all resize-none" />
                                    </div>
                                </div>
                            )}

                            {product.inStock ? (
                                <div className="flex gap-3 mt-auto">
                                    <button onClick={handleAddToCart}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 cursor-pointer shadow-sm ${inCart ? "bg-emerald-50 text-emerald-600 border-2 border-emerald-200" : addedFlash ? "bg-emerald-500 text-white" : "bg-zinc-900 text-white hover:bg-zinc-800"}`}>
                                        <FaShoppingCart size={13} />
                                        {inCart ? "In Cart ✔" : addedFlash ? "Added!" : "Add to Cart"}
                                    </button>
                                    <button onClick={handleBuyNow}
                                        className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 cursor-pointer shadow-md shadow-amber-200">
                                        <FaBolt size={13} /> Buy Now
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-auto space-y-3">
                                    <div className="flex gap-3">
                                        <button disabled className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm bg-stone-100 text-stone-400 cursor-not-allowed">
                                            <FaShoppingCart size={13} /> Add to Cart
                                        </button>
                                        <button disabled className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm bg-stone-100 text-stone-400 cursor-not-allowed">
                                            <FaBolt size={13} /> Buy Now
                                        </button>
                                    </div>
                                    {notifySuccess ? (
                                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                                            <FaCheckCircle className="text-emerald-500 shrink-0" size={18} />
                                            <div>
                                                <p className="text-sm font-black text-emerald-700">You're on the list! 🎉</p>
                                                <p className="text-xs text-emerald-600 mt-0.5">We'll notify <span className="font-bold">{notifyEmail}</span> when back in stock.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                                                    <FaBell size={14} className="text-violet-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-violet-800">Notify Me When Available</p>
                                                    <p className="text-xs text-violet-500">Get an email when this is back in stock</p>
                                                </div>
                                            </div>
                                            {showNotifyInput ? (
                                                <div className="slide-down space-y-2">
                                                    <div className="flex gap-2">
                                                        <input type="email" value={notifyEmail}
                                                            onChange={e => { setNotifyEmail(e.target.value); setNotifyError(""); }}
                                                            placeholder="your@email.com"
                                                            className="flex-1 px-3 py-2.5 border border-violet-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all" />
                                                        <button onClick={handleNotifyMe} disabled={notifySubmitting}
                                                            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-60 cursor-pointer whitespace-nowrap">
                                                            {notifySubmitting ? "..." : "Notify Me"}
                                                        </button>
                                                    </div>
                                                    {notifyError && <p className="text-xs text-red-500 font-medium">{notifyError}</p>}
                                                </div>
                                            ) : (
                                                <button onClick={() => setShowNotifyInput(true)}
                                                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2">
                                                    <FaBell size={12} /> Notify Me When Back
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 mt-4 flex-wrap">
                                {["🔒 Secure", "🚚 Fast Delivery", "💬 WhatsApp Support"].map(t => (
                                    <span key={t} className="text-[11px] text-zinc-400 font-medium">{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {highlightEntries.length > 0 && (
                    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                        <button onClick={() => setHighlightsOpen(o => !o)}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors cursor-pointer">
                            <h2 className="font-black text-zinc-900 text-base flex items-center gap-2">
                                <span className="w-1 h-4 bg-amber-500 rounded-full" />Product Highlights
                            </h2>
                            <span className="text-zinc-400 text-lg" style={{ transform: highlightsOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block", transition: "transform 0.2s" }}>∨</span>
                        </button>
                        {highlightsOpen && (
                            <div className="px-6 pb-5">
                                <div className="grid grid-cols-2 gap-0 border-t border-stone-100">
                                    {highlightEntries.map(([key, value], i) => (
                                        <div key={key} className={`py-3 ${i % 2 === 0 ? "pr-6 border-r border-stone-100" : "pl-6"} border-b border-stone-100`}>
                                            <p className="text-xs text-zinc-400 mb-0.5">{key}</p>
                                            <p className="text-sm font-bold text-zinc-800">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
                    <h2 className="font-black text-zinc-900 text-lg mb-5 flex items-center gap-2">
                        <span className="w-1 h-5 bg-amber-500 rounded-full" />Ratings & Reviews
                    </h2>
                    {reviews.length > 0 && (
                        <div className="flex gap-6 mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                            <div className="text-center shrink-0">
                                <p className="text-5xl font-black text-zinc-900">{avgRating.toFixed(1)}</p>
                                <StarRow value={Math.round(avgRating)} />
                                <p className="text-xs text-zinc-400 mt-1">{reviews.length} reviews</p>
                            </div>
                            <div className="flex-1 space-y-1.5">
                                {ratingBars.map(({ star, count, pct }) => (
                                    <div key={star} className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-500 w-4 shrink-0">{star}</span>
                                        <FaStar size={9} className="text-amber-400 shrink-0" />
                                        <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs text-zinc-400 w-5 shrink-0">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {user ? (
                        <form onSubmit={handleSubmitReview} className="mb-6 bg-stone-50 rounded-2xl p-4 border border-stone-100">
                            <p className="text-sm font-black text-zinc-700 mb-3">Write a Review</p>
                            <div className="flex gap-1 mb-3">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button key={s} type="button" onClick={() => setMyRating(s)}
                                        className="text-2xl cursor-pointer hover:scale-110 transition-transform active:scale-95">
                                        {s <= myRating ? <FaStar className="text-amber-400" /> : <FaRegStar className="text-stone-300" />}
                                    </button>
                                ))}
                            </div>
                            <textarea value={myComment} onChange={e => setMyComment(e.target.value)}
                                rows={3} placeholder="Share your experience with this product..."
                                className="w-full border border-stone-200 rounded-xl p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none transition-all" />
                            {reviewError && <p className="text-red-500 text-xs mb-2 bg-red-50 px-3 py-1.5 rounded-lg">{reviewError}</p>}
                            {reviewSuccess && (
                                <p className="text-emerald-600 text-xs mb-2 flex items-center gap-1 font-bold">
                                    <FaCheckCircle /> Review submitted successfully!
                                </p>
                            )}
                            <button type="submit" disabled={submitting}
                                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm shadow-amber-200">
                                {submitting ? "Submitting..." : "Submit Review"}
                            </button>
                        </form>
                    ) : (
                        <button onClick={() => navigate("/login")}
                            className="mb-6 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all cursor-pointer active:scale-95 shadow-sm shadow-amber-200">
                            Login to Write a Review
                        </button>
                    )}
                    {reviews.length === 0 ? (
                        <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                            <p className="text-3xl mb-2">⭐</p>
                            <p className="text-zinc-500 font-bold text-sm">No reviews yet</p>
                            <p className="text-zinc-400 text-xs mt-1">Be the first to review this product!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reviews.map(r => {
                                const isOwn = user && (r.user === user._id || r.user?._id === user._id);
                                return (
                                    <div key={r._id} className="bg-stone-50 rounded-2xl border border-stone-100 p-4 hover:border-amber-100 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3">
                                                <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-sm">
                                                    {r.name?.[0]?.toUpperCase() || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-800 text-sm">{r.name}</p>
                                                    <StarRow value={r.rating} />
                                                </div>
                                            </div>
                                            {isOwn && (
                                                <button onClick={() => handleDeleteReview(r._id)}
                                                    className="text-stone-300 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-lg hover:bg-red-50">
                                                    <FaTrash size={12} />
                                                </button>
                                            )}
                                        </div>
                                        {r.comment && <p className="text-sm text-zinc-600 mt-2.5 leading-relaxed">{r.comment}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {relatedProducts.length > 0 && (
                    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
                        <h2 className="font-black text-zinc-900 text-lg mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-amber-500 rounded-full" />Similar Products
                        </h2>
                        <RelatedProductsSlider products={relatedProducts} />
                    </div>
                )}
            </div>

            {imgZoomed && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setImgZoomed(false)}>
                    <img src={zoomImageUrl} alt={product.name} loading="eager" decoding="async"
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
                    <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all cursor-pointer">
                        <FaTimes size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;