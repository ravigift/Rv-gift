import { memo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { FaStar, FaRegStar, FaShoppingCart, FaBolt, FaCheckCircle } from "react-icons/fa";
import { imgUrl } from "../utils/imageUrl";

const FALLBACK_IMG = "https://via.placeholder.com/400x400?text=No+Image";

// Clamp discount 1–80% to prevent unrealistic badges
const calcDiscount = (mrp, price) => {
    const m = Number(mrp);
    const p = Number(price);
    if (!m || !p || m <= p) return null;
    const pct = Math.round(((m - p) / m) * 100);
    return pct >= 1 && pct <= 80 ? pct : null;
};

const RatingStars = memo(({ rating, numReviews }) => {
    if (numReviews > 0) {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s =>
                    s <= Math.round(rating)
                        ? <FaStar key={s} size={9} className="text-amber-400" />
                        : <FaRegStar key={s} size={9} className="text-stone-200" />
                )}
                <span className="text-[10px] text-zinc-400 font-medium ml-0.5">({numReviews})</span>
            </div>
        );
    }
    return (
        <div className="flex gap-0.5 items-center">
            {[1, 2, 3, 4, 5].map(s => <FaRegStar key={s} size={9} className="text-stone-200" />)}
            <span className="text-[9px] text-zinc-300 ml-1">No reviews</span>
        </div>
    );
});
RatingStars.displayName = "RatingStars";

const ProductCard = memo(({ product, onAddToCart, onBuyNow }) => {
    const navigate = useNavigate();
    const { cartItems, addItem } = useCart();

    const inCart = cartItems.some(i => i._id === product._id);
    const [addedFlash, setAddedFlash] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    const imageUrl = imgError
        ? FALLBACK_IMG
        : imgUrl.card(product?.images?.[0]?.url || product?.image || "");

    const rating = product.rating || 0;
    const numReviews = product.numReviews || 0;
    const stockNum = Number(product.stock ?? product.countInStock ?? 0);
    const isOutOfStock = product.inStock === false || stockNum === 0;
    const isLowStock = !isOutOfStock && stockNum > 0 && stockNum <= 5;

    const discountPct = calcDiscount(product.mrp, product.price);
    const hasDiscount = discountPct !== null;

    const productUrl = `/products/${product.slug || product._id}`;

    const handleAddToCart = useCallback((e) => {
        e.stopPropagation();
        if (inCart || isOutOfStock) return;
        if (onAddToCart) onAddToCart(product); else addItem(product);
        setAddedFlash(true);
        setTimeout(() => setAddedFlash(false), 1400);
    }, [inCart, isOutOfStock, onAddToCart, product, addItem]);

    const handleBuyNow = useCallback((e) => {
        e.stopPropagation();
        if (isOutOfStock) return;
        if (onBuyNow) onBuyNow(product);
        else navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1 } } });
    }, [isOutOfStock, onBuyNow, product, navigate]);

    const handleNavigate = useCallback(() => navigate(productUrl), [navigate, productUrl]);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

                @keyframes shimmerBadge    { 0%,100%{opacity:1} 50%{opacity:.7} }
                @keyframes skeletonMove    { 0%{background-position:-200% center} 100%{background-position:200% center} }
                .badge-pulse { animation: shimmerBadge 2s ease-in-out infinite; }

                .pcard-skeleton {
                    background: linear-gradient(110deg,#f1f1f0 30%,#fafaf9 50%,#f1f1f0 70%);
                    background-size: 200% 100%;
                    animation: skeletonMove 1.4s linear infinite;
                }

                /* ── Card shell ── */
                .pcard {
                    font-family: 'DM Sans', sans-serif;
                    background: #fff;
                    border-radius: 16px;
                    border: 1.5px solid #f0eeec;
                    box-shadow: 0 1px 4px rgba(0,0,0,.05);
                    transition: border-color .2s ease, box-shadow .22s ease, transform .2s ease;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    position: relative;
                    height: 100%;          /* fills grid cell → equal height */
                }
                .pcard:hover {
                    border-color: #fbbf24;
                    box-shadow: 0 8px 28px rgba(245,158,11,.14), 0 2px 8px rgba(0,0,0,.06);
                    transform: translateY(-3px);
                }
                .pcard:active  { transform: scale(.98); }
                .pcard:focus-visible { outline: 2px solid #f59e0b; outline-offset: 2px; }

                /* ── Image area: pure white, fixed height, NO blur ── */
                .pcard-img-wrap {
                    position: relative;
                    height: 220px;
                    flex-shrink: 0;
                    background: #ffffff;           /* clean white — no colour bleed */
                    border-bottom: 1px solid #f3f4f6;
                    overflow: hidden;
                }

                /* The product photo */
                .pcard-img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;           /* full image, no crop */
                    object-position: center;
                    padding: 12px;                 /* breathing room inside white box */
                    transition: transform .4s ease, opacity .3s ease;
                    background: #fff;              /* extra safety behind transparent PNGs */
                }
                .pcard-img-oos {
                    filter: grayscale(60%);
                }
                .pcard:hover .pcard-img {
                    transform: scale(1.06);
                }

                /* Hover overlay — very subtle, doesn't tint image */
                .pcard-overlay {
                    position: absolute; inset: 0;
                    background: rgba(0,0,0,.03);
                    opacity: 0;
                    transition: opacity .25s;
                    pointer-events: none;
                    z-index: 2;
                }
                .pcard:hover .pcard-overlay { opacity: 1; }

                /* ── Content ── */
                .pcard-body {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    padding: 12px;
                }

                /* Title: 2-line clamp, reserved height so all cards align */
                .pcard-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: #27272a;
                    line-height: 1.45;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    min-height: 2.9em;
                    margin-bottom: 8px;
                    transition: color .2s;
                }
                .pcard:hover .pcard-title { color: #b45309; }

                /* Stars — fixed height */
                .pcard-stars {
                    height: 20px;
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                    margin-bottom: 6px;
                }

                /* Stock — fixed height */
                .pcard-stock {
                    height: 22px;
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                    margin-bottom: 8px;
                }
                .stock-oos { display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:#a1a1aa; }
                .stock-low { display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;color:#d97706;background:#fffbeb;border:1px solid #fde68a;padding:1px 8px;border-radius:999px; }
                .stock-ok  { display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:#16a34a; }

                /* Price — fixed min-height so buttons stay aligned */
                .pcard-price {
                    min-height: 44px;
                    flex-shrink: 0;
                    margin-bottom: 10px;
                }

                /* Buttons — pinned to bottom */
                .pcard-actions {
                    display: flex;
                    gap: 6px;
                    margin-top: auto;
                    flex-shrink: 0;
                }

                .btn-cart, .btn-buy {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    padding: 9px 4px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 800;
                    border: none;
                    outline: none;
                    cursor: pointer;
                    transition: all .18s ease;
                    white-space: nowrap;
                }
                .btn-cart:active, .btn-buy:active { transform: scale(.95); }

                .btn-cart-default  { background:#18181b; color:#fff; box-shadow:0 2px 8px rgba(0,0,0,.15); }
                .btn-cart-default:hover { background:#27272a; box-shadow:0 4px 14px rgba(0,0,0,.2); transform:translateY(-1px); }
                .btn-cart-incart   { background:#f0fdf4; color:#16a34a; border:1.5px solid #bbf7d0; cursor:default; }
                .btn-cart-flash    { background:#22c55e; color:#fff; }
                .btn-cart-disabled { background:#f4f4f5; color:#a1a1aa; cursor:not-allowed; }

                .btn-buy {
                    background: linear-gradient(135deg,#f59e0b,#fbbf24);
                    color: #111;
                    box-shadow: 0 3px 10px rgba(245,158,11,.35);
                }
                .btn-buy:hover    { background:linear-gradient(135deg,#d97706,#f59e0b); box-shadow:0 5px 18px rgba(245,158,11,.45); transform:translateY(-1px); }
                .btn-buy:disabled { background:#f4f4f5; color:#a1a1aa; box-shadow:none; cursor:not-allowed; transform:none; }

                /* Mobile */
                @media (max-width: 640px) {
                    .pcard-img-wrap { height: 140px; }
                    .pcard-body     { padding: 8px; }
                    .pcard-title    { font-size: 12px; min-height: 2.7em; margin-bottom: 4px; }
                    .pcard-stars    { height: 16px; margin-bottom: 4px; }
                    .pcard-stock    { height: 18px; margin-bottom: 4px; }
                    .pcard-price    { min-height: 38px; margin-bottom: 6px; }
                    .pcard-actions  { gap: 4px; }
                    .btn-cart, .btn-buy { font-size: 10px; padding: 7px 2px; border-radius: 8px; }
                }
            `}</style>

            <div
                onClick={handleNavigate}
                className="pcard"
                role="button"
                tabIndex={0}
                aria-label={`View ${product.name}`}
                onKeyDown={e => e.key === "Enter" && handleNavigate()}
            >
                {/* ── IMAGE ── */}
                <div className="pcard-img-wrap">

                    {/* Skeleton shimmer — shown until image loads */}
                    {!imgLoaded && <div className="absolute inset-0 pcard-skeleton" />}

                    {/* Product photo — pure white bg, contain, no blur/effects */}
                    <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        width={800}
                        height={800}
                        onLoad={() => setImgLoaded(true)}
                        onError={() => { setImgError(true); setImgLoaded(true); }}
                        className={`pcard-img
                            ${imgLoaded ? "opacity-100" : "opacity-0"}
                            ${isOutOfStock ? "pcard-img-oos" : ""}
                        `}
                    />

                    {/* Hover tint */}
                    <div className="pcard-overlay" />

                    {/* Badges — top left */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                        {product.isCustomizable && !isOutOfStock && (
                            <span className="badge-pulse bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm tracking-wide">
                                ✏️ CUSTOM
                            </span>
                        )}
                        {isOutOfStock && (
                            <span className="bg-zinc-800 text-white text-[9px] font-black px-2.5 py-1 rounded-full tracking-wide">
                                SOLD OUT
                            </span>
                        )}
                    </div>

                    {/* Discount badge — top right */}
                    {hasDiscount && !isOutOfStock && (
                        <div className="absolute top-2.5 right-2.5 z-10">
                            <span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                {discountPct}% off
                            </span>
                        </div>
                    )}

                    {/* Rating pill — top right (only when no discount) */}
                    {numReviews > 0 && !hasDiscount && (
                        <div className="absolute top-2.5 right-2.5 z-10">
                            <span className={`flex items-center gap-0.5 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm
                                ${rating >= 4 ? "bg-emerald-500" : rating >= 3 ? "bg-amber-400" : "bg-red-400"}`}>
                                {rating.toFixed(1)} <FaStar size={7} />
                            </span>
                        </div>
                    )}
                </div>

                {/* ── CONTENT ── */}
                <div className="pcard-body">

                    <h3 className="pcard-title">{product.name}</h3>

                    <div className="pcard-stars">
                        <RatingStars rating={rating} numReviews={numReviews} />
                    </div>

                    <div className="pcard-stock">
                        {isOutOfStock ? (
                            <span className="stock-oos">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 inline-block" /> Out of Stock
                            </span>
                        ) : isLowStock ? (
                            <span className="stock-low">⚡ Only {stockNum} left</span>
                        ) : (
                            <span className="stock-ok">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> In Stock
                            </span>
                        )}
                    </div>

                    <div className="pcard-price">
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
                        {hasDiscount && !isOutOfStock ? (
                            <p className="text-[10px] text-green-600 font-bold mt-0.5">
                                Save ₹{(Number(product.mrp) - Number(product.price)).toLocaleString("en-IN")}
                            </p>
                        ) : (
                            <p className="text-[10px] text-transparent select-none mt-0.5">–</p>
                        )}
                    </div>

                    <div className="pcard-actions">
                        <button
                            onClick={handleAddToCart}
                            disabled={inCart || isOutOfStock}
                            aria-label={inCart ? "Already in cart" : "Add to cart"}
                            className={`btn-cart ${inCart ? "btn-cart-incart" :
                                    addedFlash ? "btn-cart-flash" :
                                        isOutOfStock ? "btn-cart-disabled" :
                                            "btn-cart-default"
                                }`}
                        >
                            {inCart ? <><FaCheckCircle size={10} /> In Cart</> :
                                addedFlash ? <>✓ Added!</> :
                                    <><FaShoppingCart size={10} /> Add</>}
                        </button>

                        <button
                            onClick={handleBuyNow}
                            disabled={isOutOfStock}
                            aria-label="Buy now"
                            className="btn-buy"
                        >
                            <FaBolt size={9} /> Buy Now
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
});

ProductCard.displayName = "ProductCard";
export default ProductCard;