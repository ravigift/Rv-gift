import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../contexts/AuthContext";
import RelatedProductsSlider from "../components/RelatedProductsSlider";
import {
    FaStar, FaRegStar, FaShoppingCart, FaBolt,
    FaTrash, FaCheckCircle, FaArrowLeft,
    FaUpload, FaTimes, FaPencilAlt, FaStickyNote,
    FaRuler,
} from "react-icons/fa";

const StarRow = ({ value }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) =>
            s <= value
                ? <FaStar key={s} className="text-amber-400" size={13} />
                : <FaRegStar key={s} className="text-stone-300" size={13} />
        )}
    </div>
);

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addItem } = useCart();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ✅ Size selection
    const [selectedSize, setSelectedSize] = useState("");

    /* ── Customization ── */
    const [customText, setCustomText] = useState("");
    const [customNote, setCustomNote] = useState("");
    const [customImagePreview, setCustomImagePreview] = useState("");
    const [customImageUrl, setCustomImageUrl] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);

    /* ── Reviews ── */
    const [myRating, setMyRating] = useState(0);
    const [myComment, setMyComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState(false);

    // ✅ Highlights open/close
    const [highlightsOpen, setHighlightsOpen] = useState(true);

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

    const getCustomization = () => ({
        text: customText.trim(),
        imageUrl: customImageUrl,
        note: customNote.trim(),
    });

    const handleAddToCart = () => {
        if (product.sizes?.length > 0 && !selectedSize) {
            return alert("Please select a size first!");
        }
        addItem({ ...product, selectedSize, customization: getCustomization() });
    };

    const handleBuyNow = () => {
        if (product.sizes?.length > 0 && !selectedSize) {
            return alert("Please select a size first!");
        }
        navigate("/checkout", {
            state: {
                buyNowItem: {
                    ...product,
                    quantity: 1,
                    selectedSize,
                    customization: getCustomization(),
                },
            },
        });
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
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!product || error) return (
        <div className="min-h-screen flex items-center justify-center text-red-500">
            {error || "Product not found"}
        </div>
    );

    const imageUrl = product.images?.[0]?.url || "";

    // Highlights — handle Map or plain object
    const highlightEntries = product.highlights
        ? (product.highlights instanceof Map
            ? [...product.highlights.entries()]
            : Object.entries(product.highlights))
        : [];

    return (
        <div className="min-h-screen bg-stone-100 py-6 px-4">
            <div className="max-w-6xl mx-auto space-y-5">

                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 font-medium transition-colors">
                    <FaArrowLeft size={11} /> Back
                </button>

                {/* ── Product ── */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
                    <div className="grid md:grid-cols-2 gap-8">

                        {/* Image */}
                        <div className="h-96 rounded-2xl bg-stone-50 border border-stone-200 overflow-hidden flex items-center justify-center">
                            {imageUrl
                                ? <img src={imageUrl} alt={product.name} className="w-full h-full object-contain p-4" />
                                : <span className="text-5xl">🎁</span>
                            }
                        </div>

                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black text-zinc-900 mb-2">{product.name}</h1>

                            <div className="flex items-center gap-2 mb-3">
                                <span className={`flex items-center gap-1 text-white text-xs px-2 py-0.5 rounded font-bold ${product.rating >= 4 ? "bg-emerald-500" : "bg-amber-400"}`}>
                                    {product.rating?.toFixed(1) || "0.0"} <FaStar size={8} />
                                </span>
                                <span className="text-sm text-zinc-400">{product.numReviews || 0} ratings</span>
                                {product.isCustomizable && (
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-full">
                                        ✏️ Customizable
                                    </span>
                                )}
                            </div>

                            <p className="text-3xl font-black text-emerald-600 mb-3">
                                ₹{product.price?.toLocaleString("en-IN")}
                            </p>

                            {product.description && (
                                <p className="text-zinc-500 text-sm leading-relaxed mb-4">{product.description}</p>
                            )}

                            {/* ✅ SIZE SELECTOR */}
                            {product.sizes?.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FaRuler size={11} className="text-zinc-500" />
                                        <p className="text-sm font-bold text-zinc-700">
                                            Select Size
                                            {selectedSize && <span className="ml-2 text-amber-600">{selectedSize}</span>}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {product.sizes.map(size => (
                                            <button key={size} onClick={() => setSelectedSize(size)}
                                                className={`min-w-[44px] h-10 px-3 rounded-xl text-sm font-bold border transition-all ${selectedSize === size
                                                        ? "bg-zinc-900 text-white border-zinc-900"
                                                        : "bg-white text-zinc-600 border-stone-200 hover:border-zinc-400"
                                                    }`}>
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                    {product.sizes.length > 0 && !selectedSize && (
                                        <p className="text-xs text-amber-600 mt-1.5 font-medium">Please select a size</p>
                                    )}
                                </div>
                            )}

                            {/* ── CUSTOMIZATION FORM ── */}
                            {product.isCustomizable && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 space-y-3">
                                    <p className="font-black text-amber-800 text-sm">✏️ Customize Your Order</p>
                                    <div>
                                        <label className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1 block">
                                            <FaPencilAlt size={9} /> Name / Message to Print
                                        </label>
                                        <input type="text" value={customText} onChange={e => setCustomText(e.target.value)}
                                            placeholder="e.g. Happy Birthday Rahul! 🎂"
                                            className="w-full px-3 py-2.5 border border-amber-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1 block">
                                            <FaUpload size={9} /> Upload Your Photo/Design
                                        </label>
                                        {!customImagePreview ? (
                                            <label className="flex items-center justify-center gap-2 w-full h-20 border-2 border-dashed border-amber-300 rounded-xl cursor-pointer hover:border-amber-500 hover:bg-amber-100 transition-all">
                                                {uploadingImage
                                                    ? <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                                    : <><FaUpload className="text-amber-400" /><span className="text-sm text-amber-600 font-medium">Click to upload</span></>
                                                }
                                                <input type="file" accept="image/*" onChange={handleCustomImageChange} className="hidden" />
                                            </label>
                                        ) : (
                                            <div className="relative inline-block">
                                                <img src={customImagePreview} alt="custom" className="h-20 w-20 object-cover rounded-xl border-2 border-amber-300" />
                                                <button onClick={removeCustomImage}
                                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                                                    <FaTimes size={9} />
                                                </button>
                                                {customImageUrl && (
                                                    <span className="absolute bottom-1 left-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">✓</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1 block">
                                            <FaStickyNote size={9} /> Special Instructions (Optional)
                                        </label>
                                        <textarea value={customNote} onChange={e => setCustomNote(e.target.value)}
                                            placeholder="e.g. White background, bold font, size L"
                                            rows={2}
                                            className="w-full px-3 py-2.5 border border-amber-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all resize-none" />
                                    </div>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 mt-auto">
                                <button onClick={handleAddToCart}
                                    className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95">
                                    <FaShoppingCart size={13} /> Add to Cart
                                </button>
                                <button onClick={handleBuyNow}
                                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md shadow-emerald-200">
                                    <FaBolt size={13} /> Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ✅ PRODUCT HIGHLIGHTS */}
                {highlightEntries.length > 0 && (
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setHighlightsOpen(o => !o)}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors">
                            <h2 className="font-black text-zinc-900 text-base">Product highlights</h2>
                            <span className="text-zinc-400 text-lg">{highlightsOpen ? "∧" : "∨"}</span>
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

                {/* ── Reviews ── */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
                    <h2 className="font-black text-zinc-900 text-lg mb-5">Ratings & Reviews</h2>

                    {user ? (
                        <form onSubmit={handleSubmitReview} className="mb-6 bg-stone-50 rounded-2xl p-4 border border-stone-200">
                            <p className="text-sm font-bold text-zinc-700 mb-3">Write a Review</p>
                            <div className="flex gap-1 mb-3">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button key={s} type="button" onClick={() => setMyRating(s)} className="text-2xl">
                                        {s <= myRating ? <FaStar className="text-amber-400" /> : <FaRegStar className="text-stone-300" />}
                                    </button>
                                ))}
                            </div>
                            <textarea value={myComment} onChange={e => setMyComment(e.target.value)}
                                rows={3} placeholder="Share your experience..."
                                className="w-full border border-stone-200 rounded-xl p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
                            {reviewError && <p className="text-red-500 text-xs mb-2">{reviewError}</p>}
                            {reviewSuccess && (
                                <p className="text-emerald-600 text-xs mb-2 flex items-center gap-1">
                                    <FaCheckCircle /> Review submitted!
                                </p>
                            )}
                            <button type="submit" disabled={submitting}
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60">
                                {submitting ? "Submitting..." : "Submit Review"}
                            </button>
                        </form>
                    ) : (
                        <button onClick={() => navigate("/login")}
                            className="mb-6 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all">
                            Login to Write Review
                        </button>
                    )}

                    {reviews.length === 0 ? (
                        <p className="text-zinc-400 text-sm text-center py-6">No reviews yet — be the first!</p>
                    ) : (
                        <div className="space-y-3">
                            {reviews.map((r) => {
                                const isOwn = user && (r.user === user._id || r.user?._id === user._id);
                                return (
                                    <div key={r._id} className="bg-stone-50 rounded-2xl border border-stone-200 p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3">
                                                <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-black shrink-0">
                                                    {r.name?.[0]?.toUpperCase() || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-800 text-sm">{r.name}</p>
                                                    <StarRow value={r.rating} />
                                                </div>
                                            </div>
                                            {isOwn && (
                                                <button onClick={() => handleDeleteReview(r._id)}
                                                    className="text-red-400 hover:text-red-600 transition-colors">
                                                    <FaTrash size={13} />
                                                </button>
                                            )}
                                        </div>
                                        {r.comment && <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{r.comment}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {relatedProducts.length > 0 && (
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
                        <h2 className="font-black text-zinc-900 text-lg mb-4">Similar Products</h2>
                        <RelatedProductsSlider products={relatedProducts} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetails;