import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { FaArrowRight, FaShoppingBag, FaTag, FaShoppingCart, FaMinus, FaPlus, FaTrash } from "react-icons/fa";

const PLATFORM_FEE = 9;
const FREE_DELIVERY_ABOVE = 499;
const DELIVERY_CHARGE = 49;

const Cart = () => {
    const navigate = useNavigate();
    const { cartItems, totalItems, totalPrice, removeItem, incQty, decQty, clear } = useCart();

    const delivery = totalPrice >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;
    const grandTotal = totalPrice + PLATFORM_FEE + delivery;
    const savingsOnDelivery = delivery === 0 ? DELIVERY_CHARGE : 0;
    const amountNeededForFree = FREE_DELIVERY_ABOVE - totalPrice;
    const deliveryProgress = Math.min((totalPrice / FREE_DELIVERY_ABOVE) * 100, 100);

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4"
                style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8f7f5" }}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>
                <div className="text-center">
                    <div className="w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"
                        style={{ background: "linear-gradient(135deg, #fef9f0, #fef3c7)" }}>
                        <FaShoppingCart size={42} className="text-amber-300" />
                    </div>
                    <h1 className="text-2xl font-black text-zinc-800 mb-2">Your cart is empty</h1>
                    <p className="text-zinc-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                        Looks like you haven't added anything yet. Let's find something special!
                    </p>
                    <Link to="/"
                        className="inline-flex items-center gap-2 px-8 py-3.5 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 cursor-pointer"
                        style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)", boxShadow: "0 8px 24px rgba(245,158,11,0.35)" }}>
                        <FaShoppingBag size={13} /> Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4" style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8f7f5" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                .fade-up { animation: fadeUp 0.3s ease forwards; }
                .item-card { transition: all 0.2s ease; }
                .item-card:hover { transform: translateY(-1px); }
                .qty-btn { transition: all 0.15s ease; }
                .qty-btn:hover { transform: scale(1.1); }
                .qty-btn:active { transform: scale(0.92); }
                .checkout-btn { transition: all 0.2s ease; }
                .checkout-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(245,158,11,0.45); }
                .checkout-btn:active { transform: scale(0.97); }
            `}</style>

            <div className="max-w-6xl mx-auto fade-up">

                {/* Header */}
                <div className="flex items-center justify-between mb-7">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900">My Cart</h1>
                        <p className="text-zinc-400 text-sm mt-0.5 font-medium">{totalItems} item{totalItems !== 1 ? "s" : ""} added</p>
                    </div>
                    <button onClick={clear}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-red-100">
                        <FaTrash size={10} /> Clear all
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-5 items-start">

                    {/* ── Cart Items ── */}
                    <div className="flex-1 min-w-0 w-full space-y-3">
                        {cartItems.map((item, index) => {
                            const imageUrl = item.images?.[0]?.url || item.image || null;
                            return (
                                <div key={`${item._id}-${index}`}
                                    className="item-card bg-white rounded-2xl border border-stone-100 hover:border-amber-200 hover:shadow-xl shadow-sm p-4 group/item">
                                    <div className="flex items-center gap-4">

                                        {/* Image */}
                                        <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                                            style={{ background: "linear-gradient(135deg, #fafaf9, #fef9f0)" }}>
                                            {imageUrl ? (
                                                <img src={imageUrl} alt={item.name}
                                                    className="w-full h-full object-contain p-1.5 group-hover/item:scale-110 transition-transform duration-300"
                                                    onError={e => { e.target.style.display = "none"; }} />
                                            ) : (
                                                <FaShoppingBag size={22} className="text-stone-300" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-zinc-800 text-sm truncate group-hover/item:text-amber-600 transition-colors mb-0.5">
                                                {item.name}
                                            </h3>
                                            <p className="text-zinc-400 text-xs font-medium">
                                                ₹{item.price.toLocaleString("en-IN")} per item
                                            </p>
                                            {item.selectedSize && (
                                                <span className="inline-flex items-center mt-1.5 text-[10px] font-bold text-zinc-500 bg-stone-100 px-2 py-0.5 rounded-full">
                                                    Size: {item.selectedSize}
                                                </span>
                                            )}
                                            {item.customization?.text && (
                                                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                    ✏️ {item.customization.text}
                                                </span>
                                            )}
                                        </div>

                                        {/* Right side */}
                                        <div className="flex flex-col items-end gap-3 shrink-0">
                                            {/* Price */}
                                            <p className="font-black text-zinc-900 text-base">
                                                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                            </p>

                                            {/* Qty Controls */}
                                            <div className="flex items-center gap-1 rounded-xl p-0.5"
                                                style={{ background: "#f1f0ee" }}>
                                                <button onClick={() => decQty(item._id)}
                                                    disabled={item.quantity <= 1}
                                                    className="qty-btn w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-white hover:text-red-500 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer">
                                                    <FaMinus size={9} />
                                                </button>
                                                <span className="font-black text-zinc-800 w-7 text-center text-sm">{item.quantity}</span>
                                                <button onClick={() => incQty(item._id)}
                                                    className="qty-btn w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-white hover:text-emerald-600 cursor-pointer">
                                                    <FaPlus size={9} />
                                                </button>
                                            </div>

                                            {/* Remove */}
                                            <button onClick={() => removeItem(item._id)}
                                                className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-red-500 font-semibold transition-colors duration-150 cursor-pointer hover:underline underline-offset-2">
                                                <FaTrash size={9} /> Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Price Summary ── */}
                    <div className="w-full lg:w-[360px] shrink-0">
                        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sticky top-24">

                            <h2 className="font-black text-zinc-800 text-sm mb-5 flex items-center gap-2 pb-4 border-b border-stone-100">
                                <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <FaTag size={10} className="text-amber-600" />
                                </span>
                                Price Breakdown
                            </h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-zinc-500">
                                    <span>Subtotal ({totalItems} items)</span>
                                    <span className="font-semibold text-zinc-700">₹{totalPrice.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between text-zinc-500">
                                    <span>Platform Fee</span>
                                    <span className="font-semibold text-zinc-700">₹{PLATFORM_FEE}</span>
                                </div>
                                <div className="flex justify-between text-zinc-500">
                                    <span>Delivery</span>
                                    {delivery === 0 ? (
                                        <span className="text-emerald-600 font-bold">FREE ✓</span>
                                    ) : (
                                        <span className="font-semibold text-zinc-700">₹{delivery}</span>
                                    )}
                                </div>

                                {/* Free delivery progress */}
                                {delivery > 0 && amountNeededForFree > 0 && (
                                    <div className="rounded-xl p-3 mt-1" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                                        <p className="text-xs text-amber-700 font-semibold mb-2">
                                            🚚 Add <span className="font-black">₹{amountNeededForFree}</span> more for FREE delivery
                                        </p>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#fef3c7" }}>
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${deliveryProgress}%`, background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }} />
                                        </div>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="border-t border-stone-100 pt-4 mt-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-black text-zinc-900 text-base">Total</span>
                                        <span className="font-black text-zinc-900 text-2xl">₹{grandTotal.toLocaleString("en-IN")}</span>
                                    </div>
                                    {savingsOnDelivery > 0 && (
                                        <p className="text-emerald-600 text-xs font-bold mt-2 flex items-center gap-1">
                                            🎉 Saved ₹{savingsOnDelivery} on delivery!
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button onClick={() => navigate("/checkout")}
                                className="checkout-btn w-full mt-5 py-3.5 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                                style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)", color: "#111", boxShadow: "0 8px 24px rgba(245,158,11,0.35)" }}>
                                Proceed to Checkout <FaArrowRight size={12} />
                            </button>

                            <p className="text-center text-xs text-zinc-400 mt-3 font-medium">🔒 100% Secure Checkout</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;