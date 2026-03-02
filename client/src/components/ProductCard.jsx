import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { FaStar, FaRegStar, FaShoppingCart, FaBolt, FaHeart } from "react-icons/fa";
import { useState } from "react";

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { cartItems, addItem } = useCart();
    const inCart = cartItems.some((item) => item._id === product._id);
    const [wished, setWished] = useState(false);
    const [addedFlash, setAddedFlash] = useState(false);

    const imageUrl =
        product?.images?.[0]?.url ||
        product?.image ||
        "https://via.placeholder.com/400x400?text=No+Image";

    const rating = product.rating || 0;
    const numReviews = product.numReviews || 0;

    const handleAddToCart = (e) => {
        e.stopPropagation();
        addItem(product);
        setAddedFlash(true);
        setTimeout(() => setAddedFlash(false), 1500);
    };

    const handleBuyNow = (e) => {
        e.stopPropagation();
        navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1 } } });
    };

    const handleWish = (e) => {
        e.stopPropagation();
        setWished(w => !w);
    };

    return (
        <div
            onClick={() => navigate(`/products/${product._id}`)}
            className="group bg-white rounded-2xl border border-stone-100 hover:border-stone-200 hover:shadow-2xl shadow-sm transition-all duration-300 cursor-pointer flex flex-col overflow-hidden relative"
        >
            {/* ── IMAGE ── */}
            <div className="relative h-52 bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center overflow-hidden">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/400x400?text=No+Image"; }}
                />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isCustomizable && (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            Customizable
                        </span>
                    )}
                </div>

                {/* Wishlist button */}
                <button
                    onClick={handleWish}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${wished
                            ? "bg-red-500 text-white scale-110"
                            : "bg-white/80 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100"
                        }`}
                >
                    <FaHeart size={12} />
                </button>

                {/* Quick add overlay on hover */}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* ── INFO ── */}
            <div className="flex flex-col flex-1 p-4">

                <h3 className="font-bold text-zinc-800 text-sm line-clamp-1 mb-1 group-hover:text-amber-600 transition-colors">
                    {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-2">
                    {numReviews > 0 ? (
                        <>
                            <span className={`flex items-center gap-0.5 text-white text-[11px] font-bold px-1.5 py-0.5 rounded ${rating >= 4 ? "bg-emerald-500" : rating >= 3 ? "bg-amber-400" : "bg-red-400"
                                }`}>
                                {rating.toFixed(1)} <FaStar size={8} />
                            </span>
                            <span className="text-[11px] text-zinc-400">({numReviews})</span>
                        </>
                    ) : (
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => <FaRegStar key={s} size={10} className="text-stone-300" />)}
                        </div>
                    )}
                </div>

                <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed mb-3">
                    {product.description}
                </p>

                <div className="mt-auto">
                    {/* Price */}
                    <p className="text-emerald-600 text-xl font-black mb-3">
                        ₹{product.price.toLocaleString("en-IN")}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddToCart}
                            disabled={inCart}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${inCart
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                    : addedFlash
                                        ? "bg-emerald-500 text-white"
                                        : "bg-zinc-900 text-white hover:bg-zinc-700"
                                }`}
                        >
                            <FaShoppingCart size={11} />
                            {inCart ? "In Cart ✔" : addedFlash ? "Added!" : "Add to Cart"}
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-sm shadow-amber-100 transition-all"
                        >
                            <FaBolt size={10} /> Buy Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;