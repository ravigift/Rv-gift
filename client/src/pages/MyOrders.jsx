import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getMyOrders } from "../features/orders/orderSlice";
import { FaBoxOpen, FaSync, FaShoppingBag, FaArrowRight, FaCheckCircle, FaFileInvoice } from "react-icons/fa";
import api from "../api/axios";

const STATUS_CONFIG = {
    PLACED: { label: "Order Placed", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-400", icon: "🛒" },
    CONFIRMED: { label: "Confirmed", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-400", icon: "✅" },
    PACKED: { label: "Packed", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", dot: "bg-indigo-400", icon: "📦" },
    SHIPPED: { label: "Shipped", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-400", icon: "🚚" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-400", icon: "🏃" },
    DELIVERED: { label: "Delivered", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", icon: "🎉" },
    CANCELLED: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-400", icon: "❌" },
};

const FLOW = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const CANCELLABLE = ["PLACED", "CONFIRMED"];
const getItemImage = (item) => item.images?.[0]?.url || item.image || null;

const MyOrders = () => {
    const dispatch = useDispatch();
    const { orders = [], status, error } = useSelector(state => state.orders);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [cancellingId, setCancellingId] = useState(null);
    const [confirmCancelId, setConfirmCancelId] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [returnModal, setReturnModal] = useState(null); // order._id
    const [returnReason, setReturnReason] = useState("");
    const [returnLoading, setReturnLoading] = useState(false);

    useEffect(() => { dispatch(getMyOrders()); }, [dispatch]);

    const handleRefresh = async () => {
        setRefreshing(true);
        dispatch(getMyOrders());
        setRefreshing(false);
    };

    const handleReturn = async (orderId) => {
        if (!returnReason.trim()) { alert("Please enter return reason"); return; }
        try {
            setReturnLoading(true);
            await api.post(`/orders/${orderId}/return`, { reason: returnReason });
            alert("Return request submitted! Admin will review within 24-48 hours.");
            setReturnModal(null);
            setReturnReason("");
            handleRefresh(); // Fixed: use handleRefresh instead of fetchOrders()
        } catch (err) {
            alert(err.response?.data?.message || "Failed to submit return request");
        } finally { setReturnLoading(false); }
    };



    const ReturnButton = ({ order }) => {
        // Check if within 7-day window
        const deadline = order.return?.deadlineAt;
        const withinWindow = !deadline || new Date() < new Date(deadline);
        const returnStatus = order.return?.status;

        if (returnStatus && returnStatus !== "NONE") {
            // Show return status
            const cfg = {
                REQUESTED: { cls: "bg-yellow-100 text-yellow-700", label: "Return Requested" },
                APPROVED: { cls: "bg-emerald-100 text-emerald-700", label: "Return Approved" },
                REJECTED: { cls: "bg-red-100 text-red-700", label: "Return Rejected" },
                PICKED_UP: { cls: "bg-blue-100 text-blue-700", label: "Return Picked Up" },
                REFUNDED: { cls: "bg-violet-100 text-violet-700", label: "Refunded" },
            }[returnStatus] || { cls: "bg-stone-100 text-stone-500", label: returnStatus };
            return (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${cfg.cls}`}>
                    {cfg.label}
                </span>
            );
        }

        if (!withinWindow) {
            return <span className="text-xs text-zinc-400">Return window closed</span>;
        }

        return (
            <button
                onClick={() => { setReturnModal(order._id); setReturnReason(""); }}
                className="flex items-center gap-1.5 text-xs font-bold text-violet-600 border border-violet-200 bg-violet-50 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition-all cursor-pointer">
                Return
            </button>
        );
    };

    const ReturnModal = () => returnModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <h3 className="font-black text-zinc-800 text-lg mb-4">Request Return</h3>
                <p className="text-xs text-zinc-500 mb-3">Returns are accepted within 7 days of delivery.</p>
                <textarea
                    placeholder="Why are you returning this order? (required)"
                    value={returnReason}
                    onChange={e => setReturnReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none mb-4"
                />
                <div className="flex gap-3">
                    <button onClick={() => handleReturn(returnModal)} disabled={returnLoading}
                        className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm disabled:opacity-60 cursor-pointer">
                        {returnLoading ? "Submitting..." : "Submit Return Request"}
                    </button>
                    <button onClick={() => setReturnModal(null)}
                        className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-zinc-600 rounded-xl font-bold text-sm cursor-pointer">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    const handleCancel = async (orderId) => {
        try {
            setCancellingId(orderId);
            await api.patch(`/orders/${orderId}/cancel`);
            dispatch(getMyOrders());
            setConfirmCancelId(null);
        } catch (err) {
            alert(err.response?.data?.message || "Cancel failed");
        } finally {
            setCancellingId(null);
        }
    };

    const handleDownloadInvoice = async (orderId) => {
        try {
            setDownloadingId(orderId);
            const response = await api.get(`/orders/${orderId}/invoice`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `RVGifts_Invoice_${orderId.slice(-8).toUpperCase()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            alert("Failed to download invoice. Please try again.");
        } finally {
            setDownloadingId(null);
        }
    };

    const filtered = activeFilter === "ALL" ? orders : orders.filter(o => o.orderStatus === activeFilter);

    if (status === "loading" && !refreshing) return (
        <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-400 text-sm font-medium">Loading your orders...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen py-6 px-4" style={{ background: "#f1f3f6", fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-4 items-start">

                    {/* LEFT SIDEBAR */}
                    <div className="w-full lg:w-64 shrink-0 space-y-3">
                        <div className="bg-white rounded-sm border border-stone-200 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center text-lg font-black shadow-sm">📦</div>
                                <div>
                                    <p className="font-bold text-zinc-800 text-sm">My Orders</p>
                                    <p className="text-xs text-zinc-400">{orders.length} total orders</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
                            <div className="px-4 py-3 border-b border-stone-100">
                                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Filter Orders</p>
                            </div>
                            <div className="py-1">
                                <button onClick={() => setActiveFilter("ALL")}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors ${activeFilter === "ALL" ? "bg-blue-50 text-blue-600 border-l-2 border-blue-500" : "text-zinc-600 hover:bg-stone-50"}`}>
                                    <span>All Orders</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeFilter === "ALL" ? "bg-blue-100 text-blue-600" : "bg-stone-100 text-zinc-500"}`}>{orders.length}</span>
                                </button>
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                                    const count = orders.filter(o => o.orderStatus === key).length;
                                    if (count === 0) return null;
                                    return (
                                        <button key={key} onClick={() => setActiveFilter(key)}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors ${activeFilter === key ? "bg-blue-50 text-blue-600 border-l-2 border-blue-500" : "text-zinc-600 hover:bg-stone-50"}`}>
                                            <span className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                                {cfg.label}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeFilter === key ? "bg-blue-100 text-blue-600" : "bg-stone-100 text-zinc-500"}`}>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT MAIN */}
                    <div className="flex-1 min-w-0 w-full space-y-3">

                        <div className="bg-white rounded-sm border border-stone-200 px-5 py-3 flex items-center justify-between">
                            <h1 className="font-black text-zinc-900 text-base">
                                {activeFilter === "ALL" ? "All Orders" : STATUS_CONFIG[activeFilter]?.label}
                                <span className="ml-2 text-zinc-400 font-normal text-sm">({filtered.length})</span>
                            </h1>
                            <button onClick={handleRefresh} disabled={refreshing}
                                className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold hover:text-amber-600 transition-colors cursor-pointer disabled:opacity-50">
                                <FaSync size={10} className={refreshing ? "animate-spin" : ""} />
                                {refreshing ? "Refreshing..." : "Refresh"}
                            </button>
                        </div>

                        {status === "failed" && error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-sm text-sm">⚠️ {error}</div>
                        )}

                        {orders.length === 0 && status === "succeeded" && (
                            <div className="bg-white rounded-sm border border-stone-200 p-16 text-center">
                                <FaShoppingBag size={48} className="text-stone-200 mx-auto mb-4" />
                                <p className="text-zinc-600 font-bold text-lg mb-1">No orders yet!</p>
                                <p className="text-zinc-400 text-sm mb-6">Looks like you haven't placed any orders.</p>
                                <Link to="/" className="inline-flex items-center gap-2 px-8 py-3 bg-amber-500 text-white rounded-sm font-bold text-sm hover:bg-amber-600 transition-all active:scale-95">
                                    Start Shopping <FaArrowRight size={11} />
                                </Link>
                            </div>
                        )}

                        {orders.length > 0 && filtered.length === 0 && (
                            <div className="bg-white rounded-sm border border-stone-200 p-12 text-center">
                                <FaBoxOpen size={32} className="text-stone-300 mx-auto mb-3" />
                                <p className="text-zinc-500 font-semibold">No {STATUS_CONFIG[activeFilter]?.label} orders</p>
                                <button onClick={() => setActiveFilter("ALL")}
                                    className="mt-3 text-xs text-blue-600 font-bold hover:underline cursor-pointer">
                                    View all orders
                                </button>
                            </div>
                        )}

                        {filtered.map(order => {
                            const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED;
                            const canCancel = CANCELLABLE.includes(order.orderStatus);
                            const stepIdx = FLOW.indexOf(order.orderStatus);
                            const isCancelled = order.orderStatus === "CANCELLED";
                            const isDelivered = order.orderStatus === "DELIVERED";
                            const isDownloading = downloadingId === order._id;

                            // ── Payment badge ──
                            const payMethod = order.payment?.method || "COD";
                            const payStatus = order.payment?.status || "PENDING";
                            const isPaid = payMethod === "RAZORPAY" && payStatus === "PAID";
                            const isCOD = payMethod === "COD";

                            return (
                                <div key={order._id} className="bg-white rounded-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow duration-200">

                                    {/* Order header bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-stone-50 border-b border-stone-100">
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                                            <div>
                                                <p className="font-black text-[10px] uppercase tracking-widest text-zinc-400 mb-0.5">Order ID</p>
                                                <p className="font-mono font-bold text-zinc-700">#{order._id.slice(-8).toUpperCase()}</p>
                                            </div>
                                            <div>
                                                <p className="font-black text-[10px] uppercase tracking-widest text-zinc-400 mb-0.5">Placed On</p>
                                                <p className="font-semibold text-zinc-600">
                                                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-black text-[10px] uppercase tracking-widest text-zinc-400 mb-0.5">Total</p>
                                                <p className="font-black text-zinc-800">₹{Number(order.totalAmount).toLocaleString("en-IN")}</p>
                                            </div>
                                            {/* Payment badge */}
                                            <div>
                                                <p className="font-black text-[10px] uppercase tracking-widest text-zinc-400 mb-0.5">Payment</p>
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : isCOD ? "bg-amber-50 text-amber-700 border-amber-200"
                                                        : "bg-stone-50 text-zinc-500 border-stone-200"
                                                    }`}>
                                                    {isPaid ? "✅ Paid Online" : isCOD ? "💵 COD" : "⏳ Pending"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Invoice — only after DELIVERED */}
                                            {isDelivered && (
                                                <button
                                                    onClick={() => handleDownloadInvoice(order._id)}
                                                    disabled={isDownloading}
                                                    className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer"
                                                    title="Download Invoice"
                                                >
                                                    <FaFileInvoice size={11} />
                                                    {isDownloading ? "Downloading..." : "Invoice"}
                                                </button>
                                            )}
                                            {/* Return Button - only for DELIVERED */}
                                            {isDelivered && <ReturnButton order={order} />}
                                            <Link to={`/orders/${order._id}`}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors">
                                                View Details <FaArrowRight size={8} />
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="divide-y divide-stone-50">
                                        {order.items?.map((item, idx) => {
                                            const img = getItemImage(item);
                                            return (
                                                <div key={idx} className="px-5 py-4 flex gap-4 items-start">
                                                    <div className="w-20 h-20 rounded border border-stone-100 bg-stone-50 overflow-hidden flex items-center justify-center shrink-0">
                                                        {img
                                                            ? <img src={img} alt={item.name} className="w-full h-full object-contain p-1.5" onError={e => { e.target.style.display = "none"; }} />
                                                            : <FaBoxOpen size={20} className="text-stone-300" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-zinc-800 text-sm line-clamp-2 leading-snug">{item.name}</p>
                                                        <p className="text-xs text-zinc-400 mt-0.5">Qty: {item.qty || item.quantity || 1} × ₹{item.price?.toLocaleString("en-IN")}</p>
                                                        {item.customization?.text && (
                                                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                                ✏️ {item.customization.text}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        {isCancelled ? (
                                                            <div className="flex items-center gap-1.5 justify-end">
                                                                <span className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                                                </span>
                                                                <p className="text-sm font-bold text-red-500">Cancelled</p>
                                                            </div>
                                                        ) : isDelivered ? (
                                                            <div className="flex items-center gap-1.5 justify-end">
                                                                <FaCheckCircle size={14} className="text-emerald-500" />
                                                                <p className="text-sm font-bold text-emerald-600">Delivered</p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 justify-end">
                                                                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse`} />
                                                                <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-zinc-400 mt-0.5 font-semibold">
                                                            ₹{((item.qty || item.quantity || 1) * item.price)?.toLocaleString("en-IN")}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Progress tracker */}
                                    {/* ── Live Shipment Tracking ── */}
                                    {order.shipping?.trackingUrl && ["PACKED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(order.orderStatus) && (
                                        <div className="px-5 pb-4 border-t border-stone-100 bg-indigo-50/40">
                                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
                                                <div className="text-xs text-zinc-600 font-semibold">
                                                    🚚 Shipment via <span className="font-bold text-indigo-700">
                                                        {order.shipping.courierName || "Courier"}
                                                    </span>
                                                    {order.shipping.awbCode && (
                                                        <span className="ml-2 text-zinc-400 font-mono">
                                                            AWB: {order.shipping.awbCode}
                                                        </span>
                                                    )}
                                                </div>

                                                <a
                                                    href={order.shipping.trackingUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all cursor-pointer"
                                                >
                                                    Track Shipment →
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {!isCancelled && (
                                        <div className="px-5 py-4 border-t border-stone-100 bg-stone-50/50">
                                            <div className="flex items-center">
                                                {FLOW.map((step, i) => (
                                                    <div key={step} className="flex items-center flex-1">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${i <= stepIdx ? "bg-amber-500" : "bg-stone-200"}`}>
                                                                {i < stepIdx
                                                                    ? <FaCheckCircle size={12} className="text-white" />
                                                                    : i === stepIdx
                                                                        ? <span className="w-2.5 h-2.5 rounded-full bg-white" />
                                                                        : <span className="w-2 h-2 rounded-full bg-stone-300" />}
                                                            </div>
                                                            <p className={`text-[9px] font-bold mt-1 text-center whitespace-nowrap ${i <= stepIdx ? "text-amber-600" : "text-zinc-300"}`}>
                                                                {STATUS_CONFIG[step]?.label.split(" ")[0]}
                                                            </p>
                                                        </div>
                                                        {i < FLOW.length - 1 && (
                                                            <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-stone-200">
                                                                <div className={`h-full rounded-full transition-all duration-500 ${i < stepIdx ? "bg-amber-400 w-full" : "w-0"}`} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Cancel footer */}
                                    {canCancel && (
                                        <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-end gap-2">
                                            {confirmCancelId === order._id ? (
                                                <>
                                                    <span className="text-xs text-zinc-500 font-medium">Cancel this order?</span>
                                                    <button onClick={() => handleCancel(order._id)} disabled={cancellingId === order._id}
                                                        className="px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition cursor-pointer disabled:opacity-60">
                                                        {cancellingId === order._id ? "Cancelling..." : "Yes, Cancel"}
                                                    </button>
                                                    <button onClick={() => setConfirmCancelId(null)}
                                                        className="px-4 py-1.5 bg-stone-100 text-zinc-600 text-xs font-bold rounded hover:bg-stone-200 transition cursor-pointer">
                                                        No, Keep
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => setConfirmCancelId(order._id)}
                                                    className="text-xs text-red-500 font-bold border border-red-200 px-4 py-1.5 rounded hover:bg-red-50 transition cursor-pointer">
                                                    Cancel Order
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Return Modal - moved to end */}
            <ReturnModal />
        </div>
    );
};

export default MyOrders;
