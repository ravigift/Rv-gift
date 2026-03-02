import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import {
    FaArrowLeft, FaBoxOpen, FaMapMarkerAlt,
    FaPhone, FaUser, FaCheckCircle, FaShoppingBag,
    FaTimesCircle,
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
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
            <FaBoxOpen size={48} className="text-stone-300 mb-4" />
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
        <div className="min-h-screen bg-stone-50 py-8 px-4">
            <div className="max-w-3xl mx-auto space-y-4">

                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Link to="/orders" className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold hover:text-zinc-700 transition-colors mb-2">
                            <FaArrowLeft size={10} /> Back to Orders
                        </Link>
                        <h1 className="text-2xl font-black text-zinc-900">Order Details</h1>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            #{order._id.slice(-8).toUpperCase()} · Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                        </p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.color}`}>
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                    </span>
                </div>

                {/* Cancelled Banner */}
                {isCancelled && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                        <FaTimesCircle className="text-red-400 shrink-0" size={20} />
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
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
                        <h2 className="font-black text-zinc-800 text-sm mb-4">Order Tracking</h2>
                        <div className="flex items-center">
                            {FLOW_STEPS.map((step, i) => (
                                <div key={step} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${i <= stepIdx ? "border-emerald-500 bg-emerald-500" : "border-stone-200 bg-white"
                                            }`}>
                                            {i <= stepIdx && <FaCheckCircle size={10} className="text-white" />}
                                        </div>
                                    </div>
                                    {i < FLOW_STEPS.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-1 ${i < stepIdx ? "bg-emerald-400" : "bg-stone-200"}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2">
                            {FLOW_STEPS.map((step, i) => (
                                <p key={step}
                                    className={`text-[9px] font-semibold text-center ${i <= stepIdx ? "text-emerald-600" : "text-zinc-300"}`}
                                    style={{ width: `${100 / FLOW_STEPS.length}%` }}>
                                    {STATUS_CONFIG[step]?.label.split(" ")[0]}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ordered Items */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
                    <h2 className="font-black text-zinc-800 text-sm mb-4">Ordered Items</h2>
                    <div className="space-y-3">
                        {order.items.map((item, idx) => {
                            const img = getItemImage(item);
                            return (
                                <div key={idx} className="flex items-center gap-3 bg-stone-50 rounded-xl p-3">
                                    <div className="w-14 h-14 rounded-lg bg-white border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                                        {img ? (
                                            <img src={img} alt={item.name} className="w-full h-full object-contain p-1"
                                                onError={e => { e.target.style.display = "none"; }} />
                                        ) : (
                                            <FaBoxOpen size={18} className="text-stone-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-zinc-800 text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-zinc-400 mt-0.5">Qty: {item.qty} × ₹{item.price.toLocaleString("en-IN")}</p>
                                        {item.selectedSize && (
                                            <span className="inline-block mt-1 text-[10px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                                                Size: {item.selectedSize}
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-black text-zinc-800 text-sm shrink-0">
                                        ₹{(item.qty * item.price).toLocaleString("en-IN")}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Price + Customer */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
                        <h2 className="font-black text-zinc-800 text-sm mb-4">Price Summary</h2>
                        <div className="space-y-2.5 text-sm">
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
                                <span className="font-semibold text-emerald-600">FREE</span>
                            </div>
                            <div className="flex justify-between border-t border-stone-100 pt-2.5">
                                <span className="font-black text-zinc-800">Total</span>
                                <span className="font-black text-emerald-600 text-lg">
                                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                                </span>
                            </div>
                            <div className="flex justify-between text-zinc-500">
                                <span>Payment</span>
                                <span className="font-bold text-zinc-700">Cash on Delivery</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
                        <h2 className="font-black text-zinc-800 text-sm mb-4">Delivery Info</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 text-sm text-zinc-600">
                                <FaUser size={12} className="text-amber-500 shrink-0" />
                                {order.customerName}
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-zinc-600">
                                <FaPhone size={12} className="text-amber-500 shrink-0" />
                                {order.phone}
                            </div>
                            <div className="flex items-start gap-2.5 text-sm text-zinc-600">
                                <FaMapMarkerAlt size={12} className="text-amber-500 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{order.address}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ✅ CANCEL ORDER SECTION */}
                {canCancel && (
                    <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                        <h2 className="font-black text-zinc-800 text-sm mb-1">Cancel Order</h2>
                        <p className="text-xs text-zinc-400 mb-4">
                            You can cancel this order since it hasn't been packed yet.
                        </p>
                        {cancelError && (
                            <p className="text-red-500 text-xs mb-3 font-medium">⚠️ {cancelError}</p>
                        )}
                        {confirmCancel ? (
                            <div className="flex gap-2">
                                <button onClick={handleCancel} disabled={cancelling}
                                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all active:scale-95 disabled:opacity-60">
                                    {cancelling ? "Cancelling..." : "Yes, Cancel Order"}
                                </button>
                                <button onClick={() => { setConfirmCancel(false); setCancelError(""); }}
                                    className="flex-1 py-2.5 bg-stone-100 text-zinc-700 rounded-xl text-sm font-bold hover:bg-stone-200 transition-all">
                                    No, Keep Order
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setConfirmCancel(true)}
                                className="w-full py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all">
                                Cancel Order
                            </button>
                        )}
                    </div>
                )}

                {/* Continue Shopping */}
                <Link to="/"
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-amber-500 transition-all active:scale-95">
                    <FaShoppingBag size={13} /> Continue Shopping
                </Link>

            </div>
        </div>
    );
};

export default OrderDetails;