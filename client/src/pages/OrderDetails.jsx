import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import {
    FaArrowLeft, FaBoxOpen, FaMapMarkerAlt,
    FaPhone, FaUser, FaCheckCircle, FaShoppingBag,
    FaTimesCircle, FaGift,
} from "react-icons/fa";

const STATUS_CONFIG = {
    PLACED: { label: "Placed", color: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-400" },
    CONFIRMED: { label: "Confirmed", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-400" },
    PACKED: { label: "Packed", color: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-400" },
    SHIPPED: { label: "Shipped", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-400" },
    DELIVERED: { label: "Delivered", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    CANCELLED: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400" },
};

const FLOW_STEPS = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const CANCELLABLE = ["PLACED", "CONFIRMED"];

const STEP_ICONS = ["🛒", "✅", "📦", "🚚", "🏃", "🎉"];

const getItemImage = (item) => item.images?.[0]?.url || item.image || null;

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancelling, setCancelling] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [cancelError, setCancelError] = useState("");

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/orders/${id}`);
                setOrder(data);
            } catch {
                setError("Order not found");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchOrder();
    }, [id]);

    const handleCancel = async () => {
        try {
            setCancelling(true);
            setCancelError("");
            const { data } = await api.patch(`/orders/${id}/cancel`);
            setOrder(data.order);
            setConfirmCancel(false);
        } catch (err) {
            setCancelError(err.response?.data?.message || "Failed to cancel order");
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30 flex items-center justify-center">
            <div className="text-center">
                <div className="w-14 h-14 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-400 text-sm font-medium">Loading order...</p>
            </div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-5">
                <FaBoxOpen size={32} className="text-amber-300" />
            </div>
            <h2 className="text-xl font-black text-zinc-800 mb-1">Order Not Found</h2>
            <p className="text-zinc-400 text-sm mb-6">{error}</p>
            <Link to="/orders" className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all">
                <FaArrowLeft size={11} /> Back to Orders
            </Link>
        </div>
    );

    const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED;
    const stepIdx = FLOW_STEPS.indexOf(order.orderStatus);
    const isCancelled = order.orderStatus === "CANCELLED";
    const canCancel = CANCELLABLE.includes(order.orderStatus);

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50/20 py-8 px-4">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                .order-font { font-family: 'DM Sans', sans-serif; }
                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
                .fade-up { animation: fadeUp 0.4s ease forwards; }
                .slide-in { animation: slideIn 0.3s ease forwards; }
                .card { background:white; border-radius:20px; border:1px solid #f0ece8; box-shadow:0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03); }
                .card:hover { box-shadow:0 4px 24px rgba(0,0,0,0.08); transition: box-shadow 0.2s; }
            `}</style>

            <div className="order-font max-w-2xl mx-auto space-y-4 fade-up">

                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Link to="/orders"
                            className="inline-flex items-center gap-1.5 text-zinc-400 text-xs font-semibold hover:text-amber-600 transition-colors mb-3 group">
                            <FaArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
                            Back to Orders
                        </Link>
                        <h1 className="text-2xl font-black text-zinc-900">Order Details</h1>
                        <p className="text-xs text-zinc-400 mt-1 font-medium">
                            <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                                #{order._id.slice(-8).toUpperCase()}
                            </span>
                            <span className="ml-2">
                                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "short", year: "numeric",
                                    hour: "2-digit", minute: "2-digit"
                                })}
                            </span>
                        </p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.color}`}>
                        <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
                        {cfg.label}
                    </span>
                </div>

                {/* Cancelled Banner */}
                {isCancelled && (
                    <div className="card p-4 flex items-center gap-3 border-red-100 bg-gradient-to-r from-red-50 to-white slide-in">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                            <FaTimesCircle className="text-red-500" size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-red-700 text-sm">Order Cancelled</p>
                            <p className="text-red-500 text-xs mt-0.5">
                                {order.cancellationReason || "This order has been cancelled."}
                            </p>
                        </div>
                    </div>
                )}

                {/* Order Tracking */}
                {!isCancelled && (
                    <div className="card p-5">
                        <h2 className="font-black text-zinc-800 text-sm mb-5 flex items-center gap-2">
                            <span className="w-1 h-4 bg-amber-500 rounded-full" />
                            Order Tracking
                        </h2>
                        <div className="flex items-center">
                            {FLOW_STEPS.map((step, i) => (
                                <div key={step} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${i <= stepIdx
                                                ? "bg-amber-500 shadow-md shadow-amber-200"
                                                : "bg-stone-100"
                                            }`}>
                                            {i <= stepIdx
                                                ? <span>{STEP_ICONS[i]}</span>
                                                : <span className="text-stone-300 text-xs">{STEP_ICONS[i]}</span>
                                            }
                                        </div>
                                    </div>
                                    {i < FLOW_STEPS.length - 1 && (
                                        <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-stone-100">
                                            <div className={`h-full rounded-full transition-all duration-500 ${i < stepIdx ? "bg-amber-400 w-full" : "w-0"}`} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2.5">
                            {FLOW_STEPS.map((step, i) => (
                                <p key={step}
                                    className={`text-[9px] font-bold text-center transition-colors ${i <= stepIdx ? "text-amber-600" : "text-zinc-300"}`}
                                    style={{ width: `${100 / FLOW_STEPS.length}%` }}>
                                    {STATUS_CONFIG[step]?.label.split(" ")[0]}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ordered Items */}
                <div className="card p-5">
                    <h2 className="font-black text-zinc-800 text-sm mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-amber-500 rounded-full" />
                        Ordered Items
                    </h2>
                    <div className="space-y-3">
                        {order.items.map((item, idx) => {
                            const img = getItemImage(item);
                            return (
                                <div key={idx} className="flex items-center gap-3 bg-stone-50 hover:bg-amber-50/50 rounded-2xl p-3 transition-colors">
                                    <div className="w-14 h-14 rounded-xl bg-white border border-stone-100 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                                        {img ? (
                                            <img src={img} alt={item.name}
                                                className="w-full h-full object-contain p-1 hover:scale-110 transition-transform duration-300"
                                                onError={e => { e.target.style.display = "none"; }} />
                                        ) : (
                                            <FaGift size={18} className="text-amber-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-zinc-800 text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            Qty: <span className="font-semibold text-zinc-600">{item.qty}</span>
                                            {" × "}
                                            <span className="font-semibold text-zinc-600">₹{item.price.toLocaleString("en-IN")}</span>
                                        </p>
                                        {item.selectedSize && (
                                            <span className="inline-block mt-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                                                Size: {item.selectedSize}
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-black text-zinc-900 text-sm shrink-0">
                                        ₹{(item.qty * item.price).toLocaleString("en-IN")}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Price + Delivery */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Price Summary */}
                    <div className="card p-5">
                        <h2 className="font-black text-zinc-800 text-sm mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 bg-amber-500 rounded-full" />
                            Price Summary
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-zinc-500">
                                <span>Items Total</span>
                                <span className="font-semibold text-zinc-700">
                                    ₹{order.items.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString("en-IN")}
                                </span>
                            </div>
                            <div className="flex justify-between text-zinc-500">
                                <span>Platform Fee</span>
                                <span className="font-semibold text-zinc-700">₹9</span>
                            </div>
                            <div className="flex justify-between text-zinc-500">
                                <span>Delivery</span>
                                <span className="font-bold text-emerald-600">FREE ✓</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-stone-100">
                                <span className="font-black text-zinc-900">Total</span>
                                <span className="font-black text-zinc-900 text-lg">
                                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                                </span>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="text-zinc-400">Payment</span>
                                <span className="font-bold text-zinc-700 flex items-center gap-1">
                                    💵 Cash on Delivery
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="card p-5">
                        <h2 className="font-black text-zinc-800 text-sm mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 bg-amber-500 rounded-full" />
                            Delivery Info
                        </h2>
                        <div className="space-y-3">
                            {[
                                { icon: <FaUser size={11} />, text: order.customerName },
                                { icon: <FaPhone size={11} />, text: order.phone },
                                { icon: <FaMapMarkerAlt size={11} />, text: order.address },
                            ].map(({ icon, text }, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-7 h-7 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center shrink-0 text-amber-500 mt-0.5">
                                        {icon}
                                    </div>
                                    <span className="text-sm text-zinc-600 leading-relaxed">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cancel Section */}
                {canCancel && (
                    <div className="card p-5 border-red-100">
                        <h2 className="font-black text-zinc-800 text-sm mb-1">Cancel Order</h2>
                        <p className="text-xs text-zinc-400 mb-4">
                            You can cancel this order since it hasn't been packed yet.
                        </p>
                        {cancelError && (
                            <p className="text-red-500 text-xs mb-3 font-medium bg-red-50 px-3 py-2 rounded-lg">
                                ⚠️ {cancelError}
                            </p>
                        )}
                        {confirmCancel ? (
                            <div className="flex gap-2">
                                <button onClick={handleCancel} disabled={cancelling}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                                    {cancelling
                                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Cancelling...</>
                                        : "Yes, Cancel Order"
                                    }
                                </button>
                                <button onClick={() => { setConfirmCancel(false); setCancelError(""); }}
                                    className="flex-1 py-3 bg-stone-100 text-zinc-700 rounded-xl text-sm font-bold hover:bg-stone-200 transition-all">
                                    No, Keep Order
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setConfirmCancel(true)}
                                className="w-full py-3 border-2 border-red-200 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-all">
                                Cancel Order
                            </button>
                        )}
                    </div>
                )}

                {/* Continue Shopping */}
                <Link to="/"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-amber-500 transition-all active:scale-95 shadow-lg shadow-zinc-900/10">
                    <FaShoppingBag size={13} /> Continue Shopping
                </Link>

            </div>
        </div>
    );
};

export default OrderDetails;