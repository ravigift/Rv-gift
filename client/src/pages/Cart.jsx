import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { FaTrash, FaArrowRight, FaShoppingBag, FaTag, FaShoppingCart } from "react-icons/fa";

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

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-5">
                    <FaShoppingCart size={36} className="text-amber-300" />
                </div>
                <h1 className="text-xl font-black text-zinc-800 mb-1">Your cart is empty</h1>
                <p className="text-zinc-400 text-sm mb-6">Add items to get started</p>
                <Link to="/"
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md shadow-amber-200">
                    <FaShoppingBag size={13} /> Go Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 py-8 px-4">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap'); .cart-font{font-family:'DM Sans',sans-serif;}`}</style>

            <div className="cart-font max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900">Shopping Cart</h1>
                        <p className="text-zinc-400 text-sm mt-0.5">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
                    </div>
                    <button onClick={clear}
                        className="flex items-center gap-1.5 text-xs text-red-400 font-bold hover:text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-all">
                        <FaTrash size={10} /> Clear Cart
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-5 items-start">

                    {/* Cart Items */}
                    <div className="flex-1 min-w-0 w-full space-y-3">
                        {cartItems.map((item, index) => {
                            const imageUrl = item.images?.[0]?.url || item.image || null;
                            return (
                                <div key={`${item._id}-${index}`}
                                    className="bg-white rounded-2xl border border-stone-100 hover:border-stone-200 hover:shadow-md shadow-sm p-4 flex items-center gap-4 transition-all duration-200">

                                    {/* Image */}
                                    <div className="w-20 h-20 rounded-xl bg-stone-50 border border-stone-100 overflow-hidden flex items-center justify-center shrink-0">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={item.name}
                                                className="w-full h-full object-contain p-1 hover:scale-110 transition-transform duration-300"
                                                onError={e => { e.target.style.display = "none"; }} />
                                        ) : (
                                            <FaShoppingBag size={24} className="text-stone-300" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-zinc-800 text-sm truncate">{item.name}</h3>
                                        <p className="text-zinc-500 font-black text-base mt-0.5">
                                            ₹{item.price.toLocaleString("en-IN")}
                                        </p>
                                        {item.customization?.text && (
                                            <p className="text-xs text-emerald-600 font-medium mt-0.5 truncate">
                                                ✏️ {item.customization.text}
                                            </p>
                                        )}
                                    </div>

                                    {/* Qty Controls */}
                                    <div className="flex items-center gap-2 bg-stone-100 rounded-xl px-3 py-2 shrink-0">
                                        <button onClick={() => decQty(item._id)}
                                            disabled={item.quantity <= 1}
                                            className="w-6 h-6 flex items-center justify-center font-black text-zinc-600 hover:text-red-500 disabled:opacity-30 transition-colors text-lg leading-none">
                                            −
                                        </button>
                                        <span className="font-black text-zinc-800 w-5 text-center text-sm">{item.quantity}</span>
                                        <button onClick={() => incQty(item._id)}
                                            className="w-6 h-6 flex items-center justify-center font-black text-zinc-600 hover:text-emerald-600 transition-colors text-lg leading-none">
                                            +
                                        </button>
                                    </div>

                                    {/* Total + Remove */}
                                    <div className="text-right shrink-0">
                                        <p className="font-black text-zinc-900 text-base">
                                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                        </p>
                                        <button onClick={() => removeItem(item._id)}
                                            className="text-red-400 text-xs font-bold hover:text-red-600 mt-1 transition-colors flex items-center gap-1 ml-auto">
                                            <FaTrash size={9} /> Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Price Breakdown */}
                    <div className="w-full lg:w-96 shrink-0">
                        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sticky top-24">
                            <h2 className="font-black text-zinc-800 text-sm mb-4 flex items-center gap-2">
                                <FaTag size={12} className="text-amber-500" /> Price Details
                            </h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-zinc-600">
                                    <span>Price ({totalItems} items)</span>
                                    <span className="font-semibold">₹{totalPrice.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between text-zinc-600">
                                    <span>Platform Fee</span>
                                    <span className="font-semibold">₹{PLATFORM_FEE}</span>
                                </div>
                                <div className="flex justify-between text-zinc-600">
                                    <span>Delivery Charges</span>
                                    {delivery === 0 ? (
                                        <span className="text-emerald-600 font-bold">FREE ✓</span>
                                    ) : (
                                        <span className="font-semibold">₹{delivery}</span>
                                    )}
                                </div>

                                {/* Free delivery progress */}
                                {delivery > 0 && amountNeededForFree > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                                        <p className="text-xs text-amber-700 font-medium mb-1.5">
                                            Add ₹{amountNeededForFree} more for FREE delivery!
                                        </p>
                                        <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min((totalPrice / FREE_DELIVERY_ABOVE) * 100, 100)}%` }} />
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-stone-100 pt-3 flex justify-between items-center">
                                    <span className="font-black text-zinc-900">Total Amount</span>
                                    <span className="font-black text-zinc-900 text-xl">
                                        ₹{grandTotal.toLocaleString("en-IN")}
                                    </span>
                                </div>

                                {savingsOnDelivery > 0 && (
                                    <p className="text-emerald-600 text-xs font-bold text-center bg-emerald-50 rounded-xl py-2 border border-emerald-100">
                                        🎉 You saved ₹{savingsOnDelivery} on delivery!
                                    </p>
                                )}
                            </div>

                            <button onClick={() => navigate("/checkout")}
                                className="w-full mt-5 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm rounded-xl transition-all active:scale-95 shadow-md shadow-amber-200 flex items-center justify-center gap-2">
                                Proceed to Checkout <FaArrowRight size={12} />
                            </button>

                            <p className="text-center text-xs text-zinc-400 mt-3">🔒 Safe & Secure Payments</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;