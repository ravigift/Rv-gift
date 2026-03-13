import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import {
    FaArrowLeft, FaBoxOpen, FaMapMarkerAlt,
    FaPhone, FaUser, FaShoppingBag,
    FaTimesCircle, FaGift, FaUndo, FaInfoCircle,
    FaSpinner, FaFileInvoice, FaTruck,
} from "react-icons/fa";

/* ─────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────── */
const STATUS_CONFIG = {
    PLACED: { label: "Placed", color: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-400" },
    CONFIRMED: { label: "Confirmed", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-400" },
    PACKED: { label: "Packed", color: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-400" },
    SHIPPED: { label: "Shipped", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-400" },
    DELIVERED: { label: "Delivered", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    CANCELLED: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400" },
};

/* ─────────────────────────────────────────────
   REFUND STATUS CONFIG
───────────────────────────────────────────── */
const REFUND_STATUS = {
    NONE: null,
    REQUESTED: {
        label: "Refund Requested",
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        desc: "Your refund request is under review. Admin will process it within 1-2 business days.",
    },
    PROCESSING: {
        label: "Refund Processing",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        desc: "Refund is being processed via Razorpay. Please wait.",
    },
    PROCESSED: {
        label: "Refund Processed",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        desc: "Refund has been initiated. Amount will reflect in 5-7 business days.",
    },
    FAILED: {
        label: "Refund Failed",
        color: "bg-red-50 text-red-700 border-red-200",
        desc: "There was an issue processing your refund. Admin will retry shortly.",
    },
    REJECTED: {
        label: "Refund Rejected",
        color: "bg-red-50 text-red-700 border-red-200",
        desc: null,
    },
};

const FLOW_STEPS = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const CANCELLABLE = ["PLACED", "CONFIRMED"];

// Step dot indicators — no emojis, just colored dots with step number
const STEP_DOTS = FLOW_STEPS.map((_, i) => i + 1);

const getItemImage = (item) => item.images?.[0]?.url || item.image || null;

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [cancelling, setCancelling] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [cancelError, setCancelError] = useState("");

    const [showRefundForm, setShowRefundForm] = useState(false);
    const [refundReason, setRefundReason] = useState("");
    const [requestingRefund, setRequestingRefund] = useState(false);
    const [refundError, setRefundError] = useState("");

    const [downloadingInvoice, setDownloadingInvoice] = useState(false);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/orders/${id}`);
            setOrder(data);
        } catch {
            setError("Order not found or you don't have access.");
        } finally { setLoading(false); }
    };

    useEffect(() => { if (id) fetchOrder(); }, [id]);

    const handleCancel = async () => {
        try {
            setCancelling(true); setCancelError("");
            const { data } = await api.patch(`/orders/${id}/cancel`);
            setOrder(data.order);
            setConfirmCancel(false);
        } catch (err) {
            setCancelError(err.response?.data?.message || "Failed to cancel order");
        } finally { setCancelling(false); }
    };

    const handleRefundRequest = async () => {
        try {
            setRequestingRefund(true); setRefundError("");
            const { data } = await api.post(`/payment/refund/${id}`, {
                reason: refundReason || "Requested by customer",
            });
            setOrder(prev => ({ ...prev, refund: data.refund }));
            setShowRefundForm(false);
        } catch (err) {
            setRefundError(err.response?.data?.message || "Failed to submit refund request");
        } finally { setRequestingRefund(false); }
    };

    const handleDownloadInvoice = async () => {
        try {
            setDownloadingInvoice(true);
            const response = await api.get(`/orders/${id}/invoice`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `RVGifts_Invoice_${id.slice(-8).toUpperCase()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            alert("Failed to download invoice. Please try again.");
        } finally { setDownloadingInvoice(false); }
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
            <Link to="/orders"
                className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all">
                <FaArrowLeft size={11} /> Back to Orders
            </Link>
        </div>
    );

    const cfg = STATUS_CONFIG[order?.orderStatus] || STATUS_CONFIG.PLACED;
    const stepIdx = FLOW_STEPS.indexOf(order?.orderStatus);
    const isCancelled = order?.orderStatus === "CANCELLED";
    const isDelivered = order?.orderStatus === "DELIVERED";
    const canCancel = CANCELLABLE.includes(order?.orderStatus);
    const isRazorpay = order?.payment?.method === "RAZORPAY";
    const isPaid = order?.payment?.status === "PAID";

    const refundStatus = order?.refund?.status || "NONE";
    const refundInfo = REFUND_STATUS[refundStatus] || null;
    const canRequestRefund = isCancelled && isRazorpay && isPaid && refundStatus === "NONE";

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50/20 py-8 px-4">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                .order-font { font-family: 'DM Sans', sans-serif; }
                @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
                .fade-up  { animation: fadeUp  0.4s ease forwards; }
                .slide-in { animation: slideIn 0.3s ease forwards; }
                .card { background:white; border-radius:20px; border:1px solid #f0ece8; box-shadow:0 1px 3px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.03); }
                .card:hover { box-shadow:0 4px 24px rgba(0,0,0,0.08); transition:box-shadow 0.2s; }
            `}</style>

            <div className="order-font max-w-2xl mx-auto space-y-4 fade-up">

                {/* ── Header ── */}
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
                            {order.invoiceNumber && (
                                <span className="ml-2 font-mono bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-[10px]">
                                    {order.invoiceNumber}
                                </span>
                            )}
                            <span className="ml-2">
                                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "short", year: "numeric",
                                    hour: "2-digit", minute: "2-digit",
                                })}
                            </span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isDelivered && (
                            <button
                                onClick={handleDownloadInvoice}
                                disabled={downloadingInvoice}
                                className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <FaFileInvoice size={11} />
                                {downloadingInvoice ? "Downloading..." : "Invoice"}
                            </button>
                        )}
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.color}`}>
                            <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
                            {cfg.label}
                        </span>
                    </div>
                </div>

                {/* ── Cancelled Banner ── */}
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

                {/* ── Refund Status Banner ── */}
                {refundInfo && (
                    <div className={`card p-4 flex items-start gap-3 border slide-in ${refundInfo.color}`}>
                        {refundStatus === "PROCESSING"
                            ? <FaSpinner size={14} className="mt-0.5 shrink-0 animate-spin" />
                            : <FaUndo size={14} className="mt-0.5 shrink-0" />
                        }
                        <div>
                            <p className="font-bold text-sm">{refundInfo.label}</p>
                            {refundInfo.desc && (
                                <p className="text-xs mt-0.5 opacity-80">{refundInfo.desc}</p>
                            )}
                            {refundStatus === "REJECTED" && order.refund?.adminNote && (
                                <p className="text-xs mt-1 font-medium">Reason: {order.refund.adminNote}</p>
                            )}
                            {refundStatus === "PROCESSED" && order.refund?.razorpayRefundId && (
                                <p className="text-xs mt-1 font-mono opacity-70">Refund ID: {order.refund.razorpayRefundId}</p>
                            )}
                            {refundStatus === "PROCESSED" && order.refund?.amount && (
                                <p className="text-xs mt-0.5 font-bold">Rs.{Number(order.refund.amount).toLocaleString("en-IN")} refunded</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Shipment Tracking ── */}
                {order.shipping?.trackingUrl && (
                    <div className="card p-5">
                        <h3 className="font-bold text-zinc-800 mb-3 text-sm flex items-center gap-2">
                            <span className="w-1 h-4 bg-amber-500 rounded-full" />
                            Shipment Tracking
                        </h3>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-zinc-600">
                                <FaTruck size={13} className="text-amber-500" />
                                <span>Courier:</span>
                                <span className="font-bold text-zinc-800">{order.shipping.courierName || "Courier"}</span>
                                {order.shipping.awbCode && (
                                    <span className="text-zinc-400 font-mono text-xs">AWB: {order.shipping.awbCode}</span>
                                )}
                            </div>
                            <a href={order.shipping.trackingUrl} target="_blank" rel="noreferrer"
                                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition font-bold">
                                Track Shipment →
                            </a>
                        </div>
                    </div>
                )}

                {/* ── Order Tracking ── */}
                {!isCancelled && stepIdx >= 0 && (
                    <div className="card p-5">
                        <h2 className="font-black text-zinc-800 text-sm mb-5 flex items-center gap-2">
                            <span className="w-1 h-4 bg-amber-500 rounded-full" />
                            Order Tracking
                        </h2>
                        <div className="flex items-center">
                            {FLOW_STEPS.map((step, i) => (
                                <div key={step} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${i <= stepIdx ? "bg-amber-500 text-white shadow-md shadow-amber-200" : "bg-stone-100 text-zinc-400"}`}>
                                            {i < stepIdx
                                                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                : STEP_DOTS[i]
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

                {/* ── Ordered Items ── */}
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
                                        {img
                                            ? <img src={img} alt={item.name}
                                                className="w-full h-full object-contain p-1 hover:scale-110 transition-transform duration-300"
                                                onError={e => { e.target.style.display = "none"; }} />
                                            : <FaGift size={18} className="text-amber-300" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-zinc-800 text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            Qty: <span className="font-semibold text-zinc-600">{item.qty}</span>
                                            {" x "}
                                            <span className="font-semibold text-zinc-600">Rs.{item.price.toLocaleString("en-IN")}</span>
                                        </p>
                                        {item.selectedSize && (
                                            <span className="inline-block mt-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                                                Size: {item.selectedSize}
                                            </span>
                                        )}
                                        {item.customization?.text && (
                                            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                                                "{item.customization.text}"
                                            </p>
                                        )}
                                    </div>
                                    <p className="font-black text-zinc-900 text-sm shrink-0">
                                        Rs.{(item.qty * item.price).toLocaleString("en-IN")}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Price + Delivery ── */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="card p-5">
                        <h2 className="font-black text-zinc-800 text-sm mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 bg-amber-500 rounded-full" />
                            Price Summary
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-zinc-500">
                                <span>Items Total</span>
                                <span className="font-semibold text-zinc-700">
                                    Rs.{order.items.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString("en-IN")}
                                </span>
                            </div>
                            {Number(order.platformFee) > 0 && (
                                <div className="flex justify-between text-zinc-500">
                                    <span>Platform Fee</span>
                                    <span className="font-semibold text-zinc-700">Rs.{Number(order.platformFee).toLocaleString("en-IN")}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-zinc-500">
                                <span>Delivery</span>
                                {Number(order.deliveryCharge) > 0
                                    ? <span className="font-semibold text-zinc-700">Rs.{Number(order.deliveryCharge).toLocaleString("en-IN")}</span>
                                    : <span className="font-bold text-emerald-600">FREE</span>
                                }
                            </div>
                            <div className="flex justify-between pt-3 border-t border-stone-100">
                                <span className="font-black text-zinc-900">Total</span>
                                <span className="font-black text-zinc-900 text-lg">
                                    Rs.{Number(order.totalAmount).toLocaleString("en-IN")}
                                </span>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="text-zinc-400">Payment</span>
                                <span className="font-bold text-zinc-700">
                                    {isRazorpay ? "Online Paid" : "Cash on Delivery"}
                                </span>
                            </div>
                        </div>
                    </div>

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

                {/* ── Cancel Section ── */}
                {canCancel && (
                    <div className="card p-5 border-red-100">
                        <h2 className="font-black text-zinc-800 text-sm mb-1">Cancel Order</h2>
                        <p className="text-xs text-zinc-400 mb-4">
                            You can cancel this order since it has not been packed yet.
                            {isRazorpay && isPaid && (
                                <span className="block mt-1 text-amber-600 font-medium">
                                    Since you paid online, a refund will be automatically requested after cancellation.
                                </span>
                            )}
                        </p>
                        {cancelError && (
                            <p className="text-red-500 text-xs mb-3 font-medium bg-red-50 px-3 py-2 rounded-lg">{cancelError}</p>
                        )}
                        {confirmCancel ? (
                            <div className="flex gap-2">
                                <button onClick={handleCancel} disabled={cancelling}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer">
                                    {cancelling
                                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Cancelling...</>
                                        : "Yes, Cancel Order"}
                                </button>
                                <button onClick={() => { setConfirmCancel(false); setCancelError(""); }}
                                    className="flex-1 py-3 bg-stone-100 text-zinc-700 rounded-xl text-sm font-bold hover:bg-stone-200 transition-all cursor-pointer">
                                    No, Keep Order
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setConfirmCancel(true)}
                                className="w-full py-3 border-2 border-red-200 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer">
                                Cancel Order
                            </button>
                        )}
                    </div>
                )}

                {/* ── Manual Refund Request ── */}
                {canRequestRefund && (
                    <div className="card p-5 border-amber-100">
                        <h2 className="font-black text-zinc-800 text-sm mb-1 flex items-center gap-2">
                            <FaUndo size={12} className="text-amber-500" /> Request Refund
                        </h2>
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
                            <FaInfoCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Your payment of <strong>Rs.{Number(order.totalAmount).toLocaleString("en-IN")}</strong> will be
                                refunded to your original payment method within <strong>5-7 business days</strong> after admin approval.
                            </p>
                        </div>
                        {refundError && (
                            <p className="text-red-500 text-xs mb-3 font-medium bg-red-50 px-3 py-2 rounded-lg">{refundError}</p>
                        )}
                        {showRefundForm ? (
                            <div className="space-y-3">
                                <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)}
                                    placeholder="Reason for refund (optional)..." rows={3}
                                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none focus:border-amber-400 resize-none" />
                                <div className="flex gap-2">
                                    <button onClick={handleRefundRequest} disabled={requestingRefund}
                                        className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer">
                                        {requestingRefund
                                            ? <><FaSpinner size={11} className="animate-spin" /> Submitting...</>
                                            : <><FaUndo size={11} /> Submit Refund Request</>}
                                    </button>
                                    <button onClick={() => { setShowRefundForm(false); setRefundError(""); }}
                                        className="px-5 py-3 bg-stone-100 text-zinc-700 rounded-xl text-sm font-bold hover:bg-stone-200 transition-all cursor-pointer">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setShowRefundForm(true)}
                                className="w-full py-3 border-2 border-amber-200 text-amber-600 rounded-xl text-sm font-bold hover:bg-amber-50 hover:border-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                <FaUndo size={11} /> Request Refund
                            </button>
                        )}
                    </div>
                )}

                {/* ── Continue Shopping ── */}
                <Link to="/"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-amber-500 transition-all active:scale-95 shadow-lg shadow-zinc-900/10 cursor-pointer">
                    <FaShoppingBag size={13} /> Continue Shopping
                </Link>

            </div>
        </div>
    );
};

export default OrderDetails;