import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { FaStar, FaRegStar, FaShoppingCart, FaBolt, FaHeart } from "react-icons/fa";
import { useState } from "react";

const ProductCard = ({ product, onAddToCart, onBuyNow }) => {
    const navigate = useNavigate();
    const { cartItems, addItem } = useCart();
    const inCart = cartItems.some((item) => item._id === product._id);
    const [wished, setWished] = useState(false);
    const [addedFlash, setAddedFlash] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    const imageUrl =
        product?.images?.[0]?.url ||
        product?.image ||
        "https://via.placeholder.com/400x400?text=No+Image";

    const rating = product.rating || 0;
    const numReviews = product.numReviews || 0;

    const handleAddToCart = (e) => {
        e.stopPropagation();
        if (inCart || product.inStock === false) return;
        if (onAddToCart) onAddToCart(product);
        else addItem(product);
        setAddedFlash(true);
        setTimeout(() => setAddedFlash(false), 1500);
    };

    const handleBuyNow = (e) => {
        e.stopPropagation();
        if (onBuyNow) onBuyNow(product);
        else navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1 } } });
    };

    return (
        <div
            onClick={() => navigate(`/products/${product._id}`)}
            className="group bg-white rounded-2xl border border-stone-100 hover:border-amber-200 hover:shadow-xl shadow-sm transition-all duration-300 cursor-pointer flex flex-col overflow-hidden relative"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* IMAGE */}
            <div className="relative bg-gradient-to-br from-stone-50 to-amber-50/30 overflow-hidden"
                style={{ paddingTop: "100%" }}>
                <div className="absolute inset-0 flex items-center justify-center">
                    {!imgLoaded && <div className="absolute inset-0 bg-stone-100 animate-pulse" />}
                    <img
                        src={imageUrl}
                        alt={product.name}
                        onLoad={() => setImgLoaded(true)}
                        onError={e => { e.target.src = "https://via.placeholder.com/400x400?text=No+Image"; setImgLoaded(true); }}
                        className={`w-full h-full object-contain p-4 group-hover:scale-108 transition-transform duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                        style={{ transform: "scale(1)", transition: "transform 0.5s ease" }}
                    />
                    <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/4 transition-all duration-300" />
                </div>

                {/* Top badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {product.isCustomizable && (
                        <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm tracking-wide">
                            ✏️ CUSTOM
                        </span>
                    )}
                    {product.inStock === false && (
                        <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-wide">
                            SOLD OUT
                        </span>
                    )}
                </div>

                {/* Wishlist */}
                <button
                    onClick={e => { e.stopPropagation(); setWished(w => !w); }}
                    className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${wished ? "bg-red-500 text-white scale-110" : "bg-white/90 text-zinc-300 hover:text-red-400"
                        }`}
                >
                    <FaHeart size={11} />
                </button>
            </div>

            {/* CONTENT */}
            <div className="flex flex-col flex-1 p-3.5">
                <h3 className="font-bold text-zinc-800 text-sm line-clamp-1 mb-1.5 group-hover:text-amber-600 transition-colors leading-snug">
                    {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-2">
                    {numReviews > 0 ? (
                        <>
                            <span className={`flex items-center gap-0.5 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md ${rating >= 4 ? "bg-emerald-500" : rating >= 3 ? "bg-amber-400" : "bg-red-400"
                                }`}>
                                {rating.toFixed(1)} <FaStar size={7} />
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium">({numReviews})</span>
                        </>
                    ) : (
                        <div className="flex gap-0.5 items-center">
                            {[1, 2, 3, 4, 5].map(s => <FaRegStar key={s} size={9} className="text-stone-200" />)}
                            <span className="text-[9px] text-zinc-300 ml-1 font-medium">No reviews</span>
                        </div>
                    )}
                </div>

                <p className="text-zinc-400 text-[11px] line-clamp-2 leading-relaxed mb-3 flex-1">
                    {product.description}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mb-3">
                    <p className="text-zinc-900 text-lg font-black leading-none">
                        ₹{product.price.toLocaleString("en-IN")}
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-1.5">
                    <button
                        onClick={handleAddToCart}
                        disabled={inCart || product.inStock === false}
                        className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-black transition-all active:scale-95 ${inCart
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : addedFlash
                                    ? "bg-emerald-500 text-white"
                                    : product.inStock === false
                                        ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                                        : "bg-zinc-900 text-white hover:bg-zinc-800"
                            }`}
                    >
                        <FaShoppingCart size={10} />
                        {inCart ? "In Cart ✔" : addedFlash ? "Added!" : "Add"}
                    </button>
                    <button
                        onClick={handleBuyNow}
                        disabled={product.inStock === false}
                        className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-black bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-sm shadow-amber-200 transition-all disabled:opacity-40"
                    >
                        <FaBolt size={9} /> Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;