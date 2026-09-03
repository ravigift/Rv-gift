import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { FaStar, FaShoppingCart, FaBolt, FaCheckCircle } from "react-icons/fa";
import { imgUrl } from "../utils/imageUrl";

/* Neutral inline placeholder — no external host */
const FALLBACK_IMG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='52%25' font-size='140' text-anchor='middle' dominant-baseline='central'%3E%F0%9F%8E%81%3C/text%3E%3C/svg%3E";

const discountPct = (mrp, price) => {
    const m = Number(mrp), p = Number(price);
    if (!m || !p || m <= p) return null;
    const pct = Math.round(((m - p) / m) * 100);
    return pct >= 1 && pct <= 90 ? pct : null;
};

/**
 * The one product card used across the whole storefront — home grid,
 * catalog grid, related-products slider, "you may also like" rows.
 *
 * Props:
 *   product     (required)
 *   index       stagger delay for the entrance animation (default 0)
 *   onAddToCart optional override — default: add to redux cart
 *   onBuyNow    optional override — default: go to /checkout with this item
 *   className   extra classes on the outer card
 */
const ProductCard = memo(({ product, index = 0, onAddToCart, onBuyNow, className = "" }) => {
    const navigate = useNavigate();
    const { cartItems, addItem } = useCart();
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    if (!product) return null;

    const {
        _id, slug, name, price, mrp, category, rating = 0, numReviews = 0,
        isCustomizable, inStock, stock, images, image, sizes,
    } = product;

    const url = `/products/${slug || _id}`;
    const src = imgError ? FALLBACK_IMG : (imgUrl.card(images?.[0]?.url || image || "") || FALLBACK_IMG);
    const outOfStock = inStock === false || (stock != null && Number(stock) === 0);
    const inCart = cartItems?.some((i) => i._id === _id) || false;
    const pct = discountPct(mrp, price);
    const save = pct ? Number(mrp) - Number(price) : 0;
    const needsChoice = Array.isArray(sizes) && sizes.length > 0;

    const goDetail = useCallback(() => navigate(url), [navigate, url]);

    const doAdd = useCallback((e) => {
        e.stopPropagation();
        if (outOfStock) return;
        if (inCart) return navigate("/cart");
        if (needsChoice) return navigate(url);        // pick a size on the detail page
        if (onAddToCart) onAddToCart(product);
        else addItem(product);
    }, [outOfStock, inCart, needsChoice, onAddToCart, product, addItem, navigate, url]);

    const doBuy = useCallback((e) => {
        e.stopPropagation();
        if (outOfStock) return;
        if (needsChoice) return navigate(url);
        if (onBuyNow) onBuyNow(product);
        else navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1 } } });
    }, [outOfStock, needsChoice, onBuyNow, product, navigate, url]);

    return (
        <article
            role="button"
            tabIndex={0}
            aria-label={name}
            onClick={goDetail}
            onKeyDown={(e) => e.key === "Enter" && goDetail()}
            className={`rv-card group ${className}`}
            style={{ animationDelay: `${Math.min(index * 35, 320)}ms` }}
        >
            {/* IMAGE */}
            <div className="rv-card-img">
                {!imgLoaded && <span className="rv-card-shimmer" aria-hidden="true" />}
                <img
                    src={src}
                    alt={name || "Product"}
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={400}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => { setImgError(true); setImgLoaded(true); }}
                    className={`rv-card-photo ${imgLoaded ? "is-ready" : ""} ${outOfStock ? "is-oos" : ""}`}
                />

                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {isCustomizable && !outOfStock && <span className="rv-badge bg-emerald-500">Custom</span>}
                    {outOfStock && <span className="rv-badge bg-zinc-900/90">SOLD OUT</span>}
                </div>
                {pct && !outOfStock && (
                    <span className="rv-badge bg-amber-500 absolute top-2 right-2 z-10">{pct}% off</span>
                )}
            </div>

            {/* BODY */}
            <div className="rv-card-body">
                <div className="flex items-center justify-between gap-1">
                    <span className="rv-card-cat">{category?.replace(/-/g, " ") || "Gift"}</span>
                    {numReviews > 0 ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 shrink-0">
                            <FaStar size={8} /> {Number(rating).toFixed(1)}
                        </span>
                    ) : (
                        <span className="text-[9px] text-zinc-300 font-semibold shrink-0">New</span>
                    )}
                </div>

                <h3 className="rv-card-title" title={name}>{name}</h3>

                {/* Price */}
                <div className="mt-auto pt-1">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className={`text-[15px] sm:text-base font-black leading-none ${outOfStock ? "text-zinc-400" : "text-zinc-900"}`}>
                            ₹{Number(price || 0).toLocaleString("en-IN")}
                        </span>
                        {pct && !outOfStock && (
                            <span className="text-[11px] font-medium text-zinc-400 line-through leading-none">
                                ₹{Number(mrp).toLocaleString("en-IN")}
                            </span>
                        )}
                    </div>
                    <p className={`text-[10px] font-bold mt-0.5 leading-none ${pct && !outOfStock ? "text-emerald-600" : "text-transparent select-none"}`}>
                        {pct && !outOfStock ? `Save ₹${save.toLocaleString("en-IN")}` : "·"}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 mt-1.5">
                    <button
                        type="button"
                        onClick={doAdd}
                        disabled={outOfStock}
                        aria-label={inCart ? "Go to cart" : needsChoice ? "Choose options" : "Add to cart"}
                        className={`rv-card-btn ${inCart ? "is-incart" : outOfStock ? "is-disabled" : "is-add"}`}
                    >
                        {inCart
                            ? <><FaCheckCircle size={9} /> In Cart</>
                            : needsChoice
                                ? "Choose"
                                : <><FaShoppingCart size={9} /> Add</>}
                    </button>
                    <button
                        type="button"
                        onClick={doBuy}
                        disabled={outOfStock}
                        aria-label="Buy now"
                        className="rv-card-btn is-buy"
                    >
                        <FaBolt size={8} /> Buy
                    </button>
                </div>
            </div>
        </article>
    );
});

ProductCard.displayName = "ProductCard";
export default ProductCard;
