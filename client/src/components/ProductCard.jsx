import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { FaStar, FaRegStar, FaShoppingCart, FaBolt, FaCheckCircle } from "react-icons/fa";
import { useState } from "react";
import { imgUrl } from "../utils/imageUrl";

const ProductCard = ({ product, onAddToCart, onBuyNow }) => {
    const navigate = useNavigate();
    const { cartItems, addItem } = useCart();

    const inCart = cartItems.some((item) => item._id === product._id);
    const [addedFlash, setAddedFlash] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    const imageUrl = imgUrl.card(
        product?.images?.[0]?.url || product?.image || ""
    );

    const rating = product.rating || 0;
    const numReviews = product.numReviews || 0;
    const stockNum = Number(product.stock ?? 0);
    const isOutOfStock = product.inStock === false || stockNum === 0;
    const isLowStock = !isOutOfStock && stockNum > 0 && stockNum <= 5;

    // ✅ Discount calculation
    const hasDiscount = product.mrp && Number(product.mrp) > Number(product.price);
    const discountPct = hasDiscount
        ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
        : null;

    // ✅ Slug-based URL — fallback to _id if slug missing
    const productUrl = `/products/${product.slug || product._id}`;

    const handleAddToCart = (e) => {
        e.stopPropagation();
        if (inCart || isOutOfStock) return;
        if (onAddToCart) onAddToCart(product);
        else addItem(product);
        setAddedFlash(true);
        setTimeout(() => setAddedFlash(false), 1500);
    };

    const handleBuyNow = (e) => {
        e.stopPropagation();
        if (isOutOfStock) return;
        if (onBuyNow) onBuyNow(product);
        else navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1 } } });
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

                @keyframes addPop {
                    0%   { transform: scale(1); }
                    40%  { transform: scale(1.06); }
                    70%  { transform: scale(0.97); }
                    100% { transform: scale(1); }
                }
                @keyframes shimmerBadge {
                    0%,100% { opacity: 1; }
                    50%     { opacity: 0.7; }
                }
                .add-pop     { animation: addPop 0.35s ease forwards; }
                .badge-pulse { animation: shimmerBadge 2s ease-in-out infinite; }

                .pcard {
                    font-family: 'DM Sans', sans-serif;
                    background: #fff;
                    border-radius: 20px;
                    border: 1.5px solid #f0eeec;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
                    cursor: pointer;
                    display: flex; flex-direction: column;
                    overflow: hidden; position: relative;
                }
                .pcard:hover {
                    border-color: #fbbf24;
                    box-shadow: 0 8px 32px rgba(245,158,11,0.13), 0 2px 8px rgba(0,0,0,0.06);
                    transform: translateY(-2px);
                }
                .pcard:active { transform: scale(0.98); }

                .pcard-img-wrap {
                    position: relative;
                    padding-top: 95%;
                    overflow: hidden;
                    background: linear-gradient(135deg, #fafaf9 0%, #fef9f0 100%);
                }
                .pcard-img {
                    position: absolute; inset: 0;
                    width: 100%; height: 100%;
                    object-fit: contain; padding: 12px;
                    transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1);
                }
                .pcard:hover .pcard-img { transform: scale(1.08); }

                .pcard-overlay {
                    position: absolute; inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.04) 0%, transparent 50%);
                    opacity: 0; transition: opacity 0.3s;
                }
                .pcard:hover .pcard-overlay { opacity: 1; }

                .btn-cart {
                    flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
                    padding: 9px 0; border-radius: 12px;
                    font-size: 11px; font-weight: 800;
                    transition: all 0.18s ease;
                    cursor: pointer; border: none; outline: none;
                }
                .btn-cart-default { background: #18181b; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
                .btn-cart-default:hover { background: #27272a; box-shadow: 0 4px 14px rgba(0,0,0,0.2); transform: translateY(-1px); }
                .btn-cart-default:active { transform: scale(0.95); }
                .btn-cart-incart   { background: #f0fdf4; color: #16a34a; border: 1.5px solid #bbf7d0; }
                .btn-cart-flash    { background: #22c55e; color: #fff; }
                .btn-cart-disabled { background: #f4f4f5; color: #a1a1aa; cursor: not-allowed; }

                .btn-buy {
                    flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
                    padding: 9px 0; border-radius: 12px;
                    font-size: 11px; font-weight: 800;
                    background: linear-gradient(135deg, #f59e0b, #fbbf24);
                    color: #111;
                    box-shadow: 0 3px 10px rgba(245,158,11,0.35);
                    transition: all 0.18s ease;
                    cursor: pointer; border: none; outline: none;
                }
                .btn-buy:hover { background: linear-gradient(135deg, #d97706, #f59e0b); box-shadow: 0 5px 18px rgba(245,158,11,0.45); transform: translateY(-1px); }
                .btn-buy:active { transform: scale(0.95); }
                .btn-buy:disabled { background: #f4f4f5; color: #a1a1aa; box-shadow: none; cursor: not-allowed; transform: none; }
            `}</style>

            <div className="pcard" onClick={() => navigate(productUrl)}>

                {/* ── IMAGE ── */}
                <div className="pcard-img-wrap">
                    {!imgLoaded && <div className="absolute inset-0 bg-stone-100 animate-pulse" />}

                    <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        width={400}
                        height={400}
                        onLoad={() => setImgLoaded(true)}
                        onError={(e) => {
                            e.target.src = "https://via.placeholder.com/400x400?text=No+Image";
                            setImgLoaded(true);
                        }}
                        className={`pcard-img transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"} ${isOutOfStock ? "opacity-40 grayscale" : ""}`}
                    />
                    <div className="pcard-overlay" />

                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                        {product.isCustomizable && !isOutOfStock && (
                            <span className="badge-pulse bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm tracking-wide">
                                ✏️ CUSTOM
                            </span>
                        )}
                        {isOutOfStock && (
                            <span className="bg-zinc-800/80 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-full tracking-wide">
                                SOLD OUT
                            </span>
                        )}
                    </div>

                    {/* Discount badge */}
                    {hasDiscount && !isOutOfStock && (
                        <div className="absolute top-2.5 right-2.5 z-10">
                            <span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                {discountPct}% off
                            </span>
                        </div>
                    )}

                    {/* Rating pill */}
                    {numReviews > 0 && !hasDiscount && (
                        <div className="absolute top-2.5 right-2.5 z-10">
                            <span className={`flex items-center gap-0.5 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm ${rating >= 4 ? "bg-emerald-500" : rating >= 3 ? "bg-amber-400" : "bg-red-400"}`}>
                                {rating.toFixed(1)} <FaStar size={7} />
                            </span>
                        </div>
                    )}
                    {numReviews > 0 && hasDiscount && (
                        <div className="absolute bottom-2.5 right-2.5 z-10">
                            <span className={`flex items-center gap-0.5 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm ${rating >= 4 ? "bg-emerald-500" : rating >= 3 ? "bg-amber-400" : "bg-red-400"}`}>
                                {rating.toFixed(1)} <FaStar size={7} />
                            </span>
                        </div>
                    )}
                </div>

                {/* ── CONTENT ── */}
                <div className="flex flex-col flex-1 px-3 pt-3 pb-3">

                    <h3 className="font-bold text-zinc-800 text-[13px] line-clamp-2 leading-snug mb-1.5" style={{ minHeight: "2.4em" }}>
                        {product.name}
                    </h3>

                    {numReviews > 0 ? (
                        <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map(s => (
                                s <= Math.round(rating)
                                    ? <FaStar key={s} size={9} className="text-amber-400" />
                                    : <FaRegStar key={s} size={9} className="text-stone-200" />
                            ))}
                            <span className="text-[10px] text-zinc-400 font-medium ml-0.5">({numReviews})</span>
                        </div>
                    ) : (
                        <div className="flex gap-0.5 mb-2">
                            {[1, 2, 3, 4, 5].map(s => <FaRegStar key={s} size={9} className="text-stone-200" />)}
                            <span className="text-[9px] text-zinc-300 ml-1">No reviews</span>
                        </div>
                    )}

                    <div className="mb-2">
                        {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 inline-block" /> Out of Stock
                            </span>
                        ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                ⚡ Only {stockNum} left
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> In Stock
                            </span>
                        )}
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className={`text-[18px] font-black leading-none ${isOutOfStock ? "text-zinc-400" : "text-zinc-900"}`}>
                                ₹{Number(product.price).toLocaleString("en-IN")}
                            </span>
                            {hasDiscount && !isOutOfStock && (
                                <span className="text-[12px] font-medium text-zinc-400 line-through leading-none">
                                    ₹{Number(product.mrp).toLocaleString("en-IN")}
                                </span>
                            )}
                        </div>
                        {hasDiscount && !isOutOfStock && (
                            <p className="text-[10px] text-green-600 font-bold mt-0.5">
                                Save ₹{(Number(product.mrp) - Number(product.price)).toLocaleString("en-IN")}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-1.5 mt-auto">
                        <button
                            onClick={handleAddToCart}
                            disabled={inCart || isOutOfStock}
                            className={`btn-cart ${inCart ? "btn-cart-incart" : addedFlash ? "btn-cart-flash add-pop" : isOutOfStock ? "btn-cart-disabled" : "btn-cart-default"}`}
                        >
                            {inCart ? <><FaCheckCircle size={10} /> In Cart</> : addedFlash ? <>✓ Added!</> : <><FaShoppingCart size={10} /> Add</>}
                        </button>
                        <button onClick={handleBuyNow} disabled={isOutOfStock} className="btn-buy">
                            <FaBolt size={9} /> Buy Now
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProductCard;