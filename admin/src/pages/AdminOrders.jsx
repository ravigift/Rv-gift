import { useEffect, useState, useCallback, useRef } from "react";
import api from "../api/adminApi";
import { imgUrl } from "../utils/imageUrl";
import {
    FaSync, FaUser, FaPhone, FaMapMarkerAlt,
    FaBox, FaChevronRight, FaWhatsapp, FaBoxOpen,
    FaCheckCircle, FaClock, FaPencilAlt,
    FaStickyNote, FaImage, FaBan, FaFileInvoice,
    FaTag, FaSpinner, FaUndo, FaTimesCircle, FaSearch,
    FaArrowRight, FaTruck, FaCheck, FaExclamationCircle,
} from "react-icons/fa";

const STATUS_CONFIG = {
    PLACED: { label: "Placed", color: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500", badge: "bg-yellow-50 text-yellow-700" },
    CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700" },
    PACKED: { label: "Packed", color: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500", badge: "bg-purple-50 text-purple-700" },
    SHIPPED: { label: "Shipped", color: "bg-indigo-100 text-indigo-800 border-indigo-200", dot: "bg-indigo-500", badge: "bg-indigo-50 text-indigo-700" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500", badge: "bg-orange-50 text-orange-700" },
    DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
    CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500", badge: "bg-red-50 text-red-700" },
};

const FLOW = {
    PLACED: "CONFIRMED",
    CONFIRMED: "PACKED",
    PACKED: "SHIPPED",
    SHIPPED: "OUT_FOR_DELIVERY",
    OUT_FOR_DELIVERY: "DELIVERED",
};

const FLOW_STEPS = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const PAGE_LIMIT = 20;

/* ── Customization Card ── */
const CustomizationCard = ({ customization }) => {
    const hasText = customization?.text?.trim();
    const hasImage = customization?.imageUrl?.trim();
    const hasNote = customization?.note?.trim();
    if (!hasText && !hasImage && !hasNote) return null;
    return (
        <div className="mt-2 bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide">Customization Details</p>
            {hasText && (
                <div className="flex items-start gap-2">
                    <FaPencilAlt size={10} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[10px] text-amber-600 font-bold">Print Text:</p>
                        <p className="text-xs font-semibold text-zinc-800">{customization.text}</p>
                    </div>
                </div>
            )}
            {hasImage && (
                <div className="flex items-start gap-2">
                    <FaImage size={10} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[10px] text-amber-600 font-bold mb-1">Customer Image:</p>
                        <a href={customization.imageUrl} target="_blank" rel="noreferrer">
                            <img src={customization.imageUrl} alt="customer upload"
                                className="w-16 h-16 object-cover rounded-lg border-2 border-amber-200 hover:opacity-90 transition-opacity cursor-pointer shadow-xs" />
                        </a>
                    </div>
                </div>
            )}
            {hasNote && (
                <div className="flex items-start gap-2">
                    <FaStickyNote size={10} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[10px] text-amber-600 font-bold">Special Note:</p>
                        <p className="text-xs text-zinc-700 leading-relaxed">{customization.note}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── Refund Card ── */
const RefundCard = ({ order, onRefundUpdate }) => {
    const [processing, setProcessing] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [rejectNote, setRejectNote] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [error, setError] = useState("");

    const refund = order?.refund;
    if (!refund || refund.status === "NONE") return null;

    const handleApprove = async () => {
        try {
            setProcessing(true); setError("");
            await api.put(`/orders/${order._id}/refund/process`, { action: "approve" });
            onRefundUpdate(order._id, {
                ...order,
                refund: { ...order.refund, status: "PROCESSED", processedAt: new Date().toISOString() },
            });
        } catch (err) {
            setError(err.response?.data?.message || "Refund failed");
        } finally { setProcessing(false); }
    };

    const handleReject = async () => {
        try {
            setRejecting(true); setError("");
            await api.put(`/orders/${order._id}/refund/process`, { action: "reject", rejectionReason: rejectNote });
            onRefundUpdate(order._id, {
                ...order,
                refund: { ...order.refund, status: "REJECTED", rejectionReason: rejectNote, processedAt: new Date().toISOString() },
            });
            setShowRejectInput(false);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reject");
        } finally { setRejecting(false); }
    };

    const statusStyles = {
        REQUESTED: "bg-yellow-50 border-yellow-200 text-yellow-800",
        PROCESSING: "bg-blue-50 border-blue-200 text-blue-800",
        PROCESSED: "bg-emerald-50 border-emerald-200 text-emerald-800",
        REJECTED: "bg-red-50 border-red-200 text-red-800",
        FAILED: "bg-red-100 border-red-300 text-red-900",
    };

    return (
        <div className={`rounded-xl border p-4 space-y-3 ${statusStyles[refund.status] || "bg-stone-50 border-stone-200"}`}>
            <div className="flex items-center justify-between">
                <p className="text-xs font-black flex items-center gap-1.5">
                    {refund.status === "PROCESSING" ? <FaSpinner size={10} className="animate-spin" /> : <FaUndo size={10} />}
                    Refund — {refund.status}
                </p>
                <span className="text-xs font-black">₹{Number(refund.amount || order.totalAmount).toLocaleString("en-IN")}</span>
            </div>
            {refund.reason && <p className="text-xs opacity-80">Reason: {refund.reason}</p>}
            {refund.requestedAt && <p className="text-[10px] opacity-60">Requested: {new Date(refund.requestedAt).toLocaleString("en-IN")}</p>}
            {refund.status === "PROCESSED" && refund.razorpayRefundId && (
                <p className="text-[10px] font-mono opacity-70">Refund ID: {refund.razorpayRefundId}</p>
            )}
            {refund.status === "REJECTED" && (refund.rejectionReason || refund.adminNote) && (
                <p className="text-xs">Note: {refund.rejectionReason || refund.adminNote}</p>
            )}
            {refund.status === "FAILED" && <p className="text-xs font-bold">⚠️ Razorpay refund failed. Use retry or contact support.</p>}
            {error && <p className="text-red-600 text-xs font-medium bg-white/60 px-2 py-1 rounded-lg">⚠️ {error}</p>}

            {refund.status === "REQUESTED" && (
                <div className="space-y-2">
                    {showRejectInput ? (
                        <div className="space-y-2">
                            <input type="text" value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                                placeholder="Rejection reason (optional)"
                                className="w-full border border-yellow-300 bg-white rounded-lg px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-red-400" />
                            <div className="flex gap-2">
                                <button onClick={handleReject} disabled={rejecting}
                                    className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all disabled:opacity-60 flex items-center justify-center gap-1 cursor-pointer">
                                    {rejecting ? <FaSpinner size={9} className="animate-spin" /> : <FaTimesCircle size={9} />} Confirm Reject
                                </button>
                                <button onClick={() => setShowRejectInput(false)}
                                    className="px-4 py-2 bg-white border border-yellow-200 text-yellow-700 rounded-lg text-xs font-bold cursor-pointer">Back</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={handleApprove} disabled={processing}
                                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-60 flex items-center justify-center gap-1 cursor-pointer">
                                {processing ? <FaSpinner size={9} className="animate-spin" /> : <FaUndo size={9} />}
                                {processing ? "Processing..." : "Approve & Refund"}
                            </button>
                            <button onClick={() => setShowRejectInput(true)}
                                className="flex-1 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-1 cursor-pointer">
                                <FaTimesCircle size={9} /> Reject
                            </button>
                        </div>
                    )}
                </div>
            )}

            {refund.status === "FAILED" && (
                <button onClick={async () => {
                    try {
                        setProcessing(true); setError("");
                        await api.put(`/orders/${order._id}/refund/retry`);
                        onRefundUpdate(order._id, { ...order, refund: { ...order.refund, status: "PROCESSING" } });
                    } catch (err) {
                        setError(err.response?.data?.message || "Retry failed");
                    } finally { setProcessing(false); }
                }} disabled={processing}
                    className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1 cursor-pointer">
                    {processing ? <FaSpinner size={9} className="animate-spin" /> : "🔁"} Retry Refund
                </button>
            )}
        </div>
    );
};

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [expandedId, setExpandedId] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Tracking info modal/drawer state
    const [shippingModal, setShippingModal] = useState({ open: false, orderId: null, awbCode: "", courierName: "", trackingUrl: "" });

    // Backend pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Live Stats
    const [stats, setStats] = useState({
        ALL: 0,
        PLACED: 0,
        CONFIRMED: 0,
        PACKED: 0,
        SHIPPED: 0,
        OUT_FOR_DELIVERY: 0,
        DELIVERED: 0,
        CANCELLED: 0,
        REFUND_PENDING: 0,
    });

    // ── Fetch stats ──────────────────────────────────────
    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.get("/orders/admin/stats");
            if (data?.stats) setStats(data.stats);
        } catch { /* silent */ }
    }, []);

    // ── Fetch orders from backend ─────────────────────────
    const fetchOrders = useCallback(async ({ page = 1, status = "ALL", search = "" } = {}) => {
        try {
            setError("");
            setLoading(true);

            const params = { page, limit: PAGE_LIMIT };
            if (status && status !== "ALL" && status !== "REFUND_PENDING") {
                params.status = status;
            }
            if (search.trim()) {
                params.search = search.trim();
            }

            const { data } = await api.get("/orders", { params });

            const list = Array.isArray(data?.orders) ? data.orders : [];
            setOrders(list);
            setTotalOrders(data?.total || 0);
            setTotalPages(data?.totalPages || 1);
            setCurrentPage(data?.page || 1);

        } catch (err) {
            setError(err.response?.status === 403
                ? "Access denied. Admin / Owner permission required."
                : "Failed to load orders. Please try again.");
            setOrders([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchOrders({ page: 1, status: filterStatus, search: searchQuery });
        fetchStats();
    }, []);

    // ── Status update ──────────────────────────────────────
    const updateStatus = async (orderId, targetStatus, shippingPayload = {}) => {
        if (!targetStatus) return;
        try {
            setUpdatingId(orderId);
            const { data: updatedOrder } = await api.put(`/orders/${orderId}`, {
                status: targetStatus,
                ...shippingPayload,
            });

            if (updatedOrder?._id) {
                // If filtering by specific status, remove the moved order from view or replace in list
                if (filterStatus !== "ALL" && updatedOrder.orderStatus !== filterStatus) {
                    setOrders(prev => prev.filter(o => o._id !== orderId));
                    setTotalOrders(prev => Math.max(0, prev - 1));
                } else {
                    setOrders(prev => prev.map(o => o._id === orderId ? updatedOrder : o));
                }
                // Live sync stats counter
                fetchStats();
            } else {
                await fetchOrders({ page: currentPage, status: filterStatus, search: searchQuery });
                fetchStats();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update status");
        } finally {
            setUpdatingId(null);
            setShippingModal({ open: false, orderId: null, awbCode: "", courierName: "", trackingUrl: "" });
        }
    };

    const handleFilterChange = (key) => {
        setFilterStatus(key);
        setExpandedId(null);
        setCurrentPage(1);
        fetchOrders({ page: 1, status: key, search: searchQuery });
        fetchStats();
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchQuery(searchInput);
        setFilterStatus("ALL");
        setCurrentPage(1);
        fetchOrders({ page: 1, status: "ALL", search: searchInput });
    };

    const clearSearch = () => {
        setSearchInput("");
        setSearchQuery("");
        fetchOrders({ page: 1, status: filterStatus, search: "" });
    };

    const refreshOrders = async () => {
        setRefreshing(true);
        await Promise.all([
            fetchOrders({ page: currentPage, status: filterStatus, search: searchQuery }),
            fetchStats(),
        ]);
        setRefreshing(false);
    };

    const handleRefundUpdate = (orderId, updatedOrder) => {
        setOrders(prev => prev.map(o => o._id === orderId ? updatedOrder : o));
        fetchStats();
    };

    const handleDownloadInvoice = async (orderId, e) => {
        e.stopPropagation();
        try {
            setDownloadingId(orderId);
            const response = await api.get(`/orders/${orderId}/invoice`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `RVGifts_Invoice_${orderId.slice(-8).toUpperCase()}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
        } catch { alert("Failed to download invoice."); }
        finally { setDownloadingId(null); }
    };

    const goToPage = (page) => {
        setExpandedId(null);
        window.scrollTo(0, 0);
        fetchOrders({ page, status: filterStatus, search: searchQuery });
    };

    const getPageNumbers = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages = [];
        if (currentPage <= 3) pages.push(1, 2, 3, 4, "…", totalPages);
        else if (currentPage >= totalPages - 2) pages.push(1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        else pages.push(1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages);
        return pages;
    };

    if (loading && orders.length === 0) return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-zinc-500 text-xs font-bold">Loading real-time orders...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
            <div className="text-center bg-white rounded-2xl p-8 border border-stone-200 shadow-sm max-w-sm w-full">
                <FaExclamationCircle className="text-red-500 text-3xl mx-auto mb-3" />
                <p className="text-zinc-800 font-bold mb-4 text-sm">{error}</p>
                <button onClick={() => refreshOrders()} className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 cursor-pointer">
                    Retry Loading
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] py-6 font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">

                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-zinc-900">Orders Management</h1>
                            <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                                Live Sync
                            </span>
                        </div>
                        <p className="text-zinc-500 text-xs mt-0.5">
                            {totalOrders} orders in current view · {stats.ALL} total in store
                        </p>
                    </div>

                    <div className="flex gap-2 items-center flex-wrap">
                        {/* Search input */}
                        <form onSubmit={handleSearch} className="relative">
                            <FaSearch size={11} className="absolute left-3 top-3 text-zinc-400" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder="Search customer, phone..."
                                className="pl-8 pr-8 py-2 border border-stone-200 rounded-xl text-xs bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400 w-48 sm:w-56 transition-all"
                            />
                            {searchInput && (
                                <button type="button" onClick={clearSearch} className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700">
                                    <FaTimesCircle size={11} />
                                </button>
                            )}
                        </form>

                        {/* Refresh button */}
                        <button
                            onClick={refreshOrders}
                            disabled={refreshing}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 text-zinc-700 rounded-xl text-xs font-bold hover:bg-stone-50 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                            <FaSync size={10} className={refreshing ? "animate-spin text-amber-500" : ""} />
                            <span>{refreshing ? "Syncing..." : "Sync"}</span>
                        </button>
                    </div>
                </div>

                {/* Filter Tabs with Live Real-time Counts */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
                    {[
                        { key: "ALL", label: "All Orders", count: stats.ALL },
                        { key: "PLACED", label: "Placed", count: stats.PLACED, dot: "bg-yellow-500" },
                        { key: "CONFIRMED", label: "Confirmed", count: stats.CONFIRMED, dot: "bg-blue-500" },
                        { key: "PACKED", label: "Packed", count: stats.PACKED, dot: "bg-purple-500" },
                        { key: "SHIPPED", label: "Shipped", count: stats.SHIPPED, dot: "bg-indigo-500" },
                        { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", count: stats.OUT_FOR_DELIVERY, dot: "bg-orange-500" },
                        { key: "DELIVERED", label: "Delivered", count: stats.DELIVERED, dot: "bg-emerald-500" },
                        { key: "CANCELLED", label: "Cancelled", count: stats.CANCELLED, dot: "bg-red-500" },
                    ].map(({ key, label, count, dot }) => {
                        const isActive = filterStatus === key;
                        return (
                            <button
                                key={key}
                                onClick={() => handleFilterChange(key)}
                                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isActive
                                    ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                                    : "bg-white text-zinc-600 border-stone-200 hover:border-stone-300"
                                }`}
                            >
                                {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
                                <span>{label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isActive ? "bg-white/20 text-white" : "bg-stone-100 text-zinc-600"}`}>
                                    {count ?? 0}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Empty State */}
                {orders.length === 0 && !loading && (
                    <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center">
                        <FaBoxOpen size={36} className="text-stone-300 mx-auto mb-3" />
                        <h3 className="text-zinc-800 font-bold text-sm">No orders in "{STATUS_CONFIG[filterStatus]?.label || filterStatus}"</h3>
                        <p className="text-zinc-400 text-xs mt-1">Try selecting another filter or searching by customer name.</p>
                    </div>
                )}

                {/* Orders List */}
                <div className="space-y-4">
                    {orders.map(order => {
                        const currentStatus = order.orderStatus || "PLACED";
                        const cfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.PLACED;
                        const isCancelled = currentStatus === "CANCELLED";
                        const nextStatus = isCancelled ? null : FLOW[currentStatus];
                        const nextCfg = nextStatus ? STATUS_CONFIG[nextStatus] : null;
                        const isUpdating = updatingId === order._id;
                        const isExpanded = expandedId === order._id;
                        const stepIdx = FLOW_STEPS.indexOf(currentStatus);
                        const isDownloading = downloadingId === order._id;
                        const hasCustom = order.items?.some(i => i.customization?.text || i.customization?.imageUrl || i.customization?.note);
                        const hasRefundPending = order.refund?.status === "REQUESTED";

                        return (
                            <div
                                key={order._id}
                                className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all duration-200 ${isExpanded ? "border-amber-400 shadow-md ring-1 ring-amber-400/20" : "border-stone-200 hover:border-stone-300"}`}
                            >
                                {/* Header Row */}
                                <div
                                    onClick={() => setExpandedId(isExpanded ? null : order._id)}
                                    className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-stone-50/70 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${isCancelled ? "bg-red-50 border-red-200 text-red-500" : "bg-stone-50 border-stone-200 text-zinc-700"}`}>
                                            {isCancelled ? <FaBan size={14} /> : <FaBox size={14} className="text-amber-500" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-zinc-900 text-sm truncate">{order.customerName || "Customer"}</p>
                                                {hasCustom && (
                                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded">
                                                        ✏️ Custom
                                                    </span>
                                                )}
                                                {hasRefundPending && (
                                                    <span className="bg-orange-100 text-orange-800 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <FaUndo size={7} /> Refund Pending
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-zinc-400 mt-0.5">
                                                Order #{order._id.slice(-6).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Side Info & Badges */}
                                    <div className="flex items-center gap-2.5 flex-wrap justify-end">
                                        <p className="font-black text-zinc-900 text-sm sm:text-base">
                                            ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                                        </p>

                                        {/* CURRENT STATUS BADGE */}
                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            <span>{cfg.label}</span>
                                        </span>

                                        <button
                                            onClick={e => handleDownloadInvoice(order._id, e)}
                                            disabled={isDownloading}
                                            className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-stone-50 border border-stone-200 text-zinc-600 text-xs font-bold rounded-lg hover:bg-stone-100 transition-all disabled:opacity-50 cursor-pointer"
                                        >
                                            <FaFileInvoice size={10} />
                                            <span>{isDownloading ? "..." : "Invoice"}</span>
                                        </button>

                                        <FaChevronRight size={10} className={`text-zinc-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                    </div>
                                </div>

                                {/* Step Progress Bar */}
                                {!isCancelled && (
                                    <div className="px-5 pb-3">
                                        <div className="flex items-center">
                                            {FLOW_STEPS.map((step, i) => {
                                                const isDone = i <= stepIdx;
                                                const isCurrent = i === stepIdx;
                                                return (
                                                    <div key={step} className="flex items-center flex-1">
                                                        <div
                                                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black transition-all ${isCurrent
                                                                ? "bg-amber-500 text-white ring-4 ring-amber-100"
                                                                : isDone
                                                                    ? "bg-emerald-500 text-white"
                                                                    : "bg-stone-100 text-stone-400 border border-stone-200"
                                                            }`}
                                                            title={STATUS_CONFIG[step]?.label}
                                                        >
                                                            {isDone && !isCurrent ? <FaCheck size={7} /> : i + 1}
                                                        </div>
                                                        {i < FLOW_STEPS.length - 1 && (
                                                            <div className={`flex-1 h-1 transition-all ${i < stepIdx ? "bg-emerald-400" : "bg-stone-200"}`} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            {FLOW_STEPS.map((step, i) => (
                                                <p
                                                    key={step}
                                                    className={`text-[9px] font-bold ${i === stepIdx ? "text-amber-600" : i < stepIdx ? "text-emerald-600" : "text-zinc-300"}`}
                                                    style={{ width: `${100 / FLOW_STEPS.length}%`, textAlign: i === 0 ? "left" : i === FLOW_STEPS.length - 1 ? "right" : "center" }}
                                                >
                                                    {STATUS_CONFIG[step]?.label}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* EXPANDED DETAILS & REAL-TIME CONTROLS */}
                                {isExpanded && (
                                    <div className="border-t border-stone-100 p-4 sm:p-5 bg-stone-50/50 space-y-5">

                                        {/* Status Control Panel */}
                                        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 mb-3">
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                                                        Real-Time Order Control
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-zinc-600 font-semibold">Current State:</span>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-black border ${cfg.color}`}>
                                                            {cfg.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* 1-Click Advance Next Step */}
                                                {!isCancelled && nextStatus && (
                                                    <button
                                                        onClick={() => {
                                                            if (nextStatus === "SHIPPED") {
                                                                setShippingModal({ open: true, orderId: order._id, awbCode: order.shipping?.awbCode || "", courierName: order.shipping?.courierName || "", trackingUrl: order.shipping?.trackingUrl || "" });
                                                            } else {
                                                                updateStatus(order._id, nextStatus);
                                                            }
                                                        }}
                                                        disabled={isUpdating}
                                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer disabled:opacity-50"
                                                    >
                                                        {isUpdating ? (
                                                            <><FaSpinner size={10} className="animate-spin" /> Updating...</>
                                                        ) : (
                                                            <>Advance to <strong>{nextCfg?.label}</strong> <FaArrowRight size={10} /></>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Direct Status Selector Pills */}
                                            <div>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                                    Jump Directly to Any Status:
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {FLOW_STEPS.map((step) => {
                                                        const isSelected = currentStatus === step;
                                                        const stepData = STATUS_CONFIG[step];
                                                        return (
                                                            <button
                                                                key={step}
                                                                onClick={() => {
                                                                    if (step === "SHIPPED") {
                                                                        setShippingModal({ open: true, orderId: order._id, awbCode: order.shipping?.awbCode || "", courierName: order.shipping?.courierName || "", trackingUrl: order.shipping?.trackingUrl || "" });
                                                                    } else {
                                                                        updateStatus(order._id, step);
                                                                    }
                                                                }}
                                                                disabled={isUpdating || isSelected}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${isSelected
                                                                    ? "bg-zinc-900 text-white border-zinc-900 cursor-default"
                                                                    : "bg-stone-50 border-stone-200 text-zinc-700 hover:bg-amber-50 hover:border-amber-300"
                                                                }`}
                                                            >
                                                                {isSelected && "✓ "}{stepData.label}
                                                            </button>
                                                        );
                                                    })}

                                                    {/* Cancel Option */}
                                                    {!isCancelled && (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm("Are you sure you want to CANCEL this order? This will restore stock.")) {
                                                                    updateStatus(order._id, "CANCELLED");
                                                                }
                                                            }}
                                                            disabled={isUpdating}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer ml-auto"
                                                        >
                                                            Cancel Order
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Shipping & Tracking details if shipped */}
                                            {order.shipping?.awbCode && (
                                                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                                                    <span className="text-zinc-500 flex items-center gap-1 font-medium">
                                                        <FaTruck size={11} className="text-indigo-500" />
                                                        Courier: <strong>{order.shipping.courierName || "Standard"}</strong> | AWB: <strong className="font-mono">{order.shipping.awbCode}</strong>
                                                    </span>
                                                    {order.shipping.trackingUrl && (
                                                        <a href={order.shipping.trackingUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold">
                                                            Track Shipment ↗
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Customer & Delivery Information */}
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2 shadow-xs">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Customer & Delivery</p>
                                                <div className="flex items-center gap-2 text-xs text-zinc-800 font-bold">
                                                    <FaUser size={10} className="text-amber-500 shrink-0" /> {order.customerName}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-zinc-700">
                                                    <FaPhone size={10} className="text-amber-500 shrink-0" /> {order.phone}
                                                </div>
                                                <div className="flex items-start gap-2 text-xs text-zinc-600">
                                                    <FaMapMarkerAlt size={10} className="text-amber-500 shrink-0 mt-0.5" />
                                                    <span className="leading-relaxed">{order.address}</span>
                                                </div>

                                                <a
                                                    href={`https://wa.me/91${order.phone}?text=${encodeURIComponent(`Hi ${order.customerName}! Your order #${order._id.slice(-6).toUpperCase()} is now ${cfg.label}. Thank you for shopping with RV Gifts!`)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-all cursor-pointer"
                                                >
                                                    <FaWhatsapp size={12} /> WhatsApp Customer Update
                                                </a>
                                            </div>

                                            {/* Payment & Order Summary */}
                                            <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2 shadow-xs">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Payment Details</p>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-zinc-500">Method:</span>
                                                    <span className="font-bold text-zinc-800">{order.payment?.method || "COD"}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-zinc-500">Status:</span>
                                                    <span className={`font-black ${order.payment?.status === "PAID" ? "text-emerald-600" : "text-amber-600"}`}>
                                                        {order.payment?.status || "PENDING"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs pt-1 border-t border-stone-100">
                                                    <span className="text-zinc-500">Total Amount:</span>
                                                    <span className="font-black text-emerald-600 text-sm">₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Refund Details if active */}
                                        {order.refund?.status && order.refund.status !== "NONE" && (
                                            <RefundCard order={order} onRefundUpdate={handleRefundUpdate} />
                                        )}

                                        {/* Order Items List */}
                                        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-3">
                                                Purchased Items ({order.items?.length || 0})
                                            </p>
                                            <div className="space-y-3">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="bg-stone-50/80 rounded-xl p-3 border border-stone-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-lg bg-white border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                                                                {item.image
                                                                    ? <img src={imgUrl.thumbnail(item.image)} alt={item.name} className="w-full h-full object-contain p-1" onError={e => { e.target.style.display = "none"; }} />
                                                                    : <FaBoxOpen size={16} className="text-stone-300" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-zinc-800 text-xs truncate">{item.name}</p>
                                                                <p className="text-[11px] text-zinc-400">
                                                                    Qty: {item.qty} × ₹{item.price}
                                                                    {item.selectedSize && (
                                                                        <span className="ml-2 bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded text-[9px] font-bold">{item.selectedSize}</span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <p className="font-black text-zinc-900 text-xs shrink-0">
                                                                ₹{(item.price * item.qty).toLocaleString("en-IN")}
                                                            </p>
                                                        </div>
                                                        <CustomizationCard customization={item.customization} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-200 flex-wrap gap-3">
                        <p className="text-xs text-zinc-500 font-medium">
                            Showing <span className="font-bold text-zinc-800">{(currentPage - 1) * PAGE_LIMIT + 1}–{Math.min(currentPage * PAGE_LIMIT, totalOrders)}</span> of <span className="font-bold text-zinc-800">{totalOrders}</span> orders
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-stone-200 text-zinc-700 rounded-xl hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                                ← Prev
                            </button>
                            {getPageNumbers().map((p, i) =>
                                p === "…" ? (
                                    <span key={`dot-${i}`} className="px-2 text-zinc-400 text-xs">…</span>
                                ) : (
                                    <button key={p} onClick={() => goToPage(p)}
                                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === p ? "bg-zinc-900 text-white" : "bg-white border border-stone-200 text-zinc-700 hover:bg-stone-50"}`}>
                                        {p}
                                    </button>
                                )
                            )}
                            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-stone-200 text-zinc-700 rounded-xl hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* SHIPPING INFO MODAL (When marking as SHIPPED) */}
            {shippingModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                                <FaTruck className="text-indigo-600" /> Mark as Shipped (Optional Courier Details)
                            </h3>
                            <button onClick={() => setShippingModal({ open: false, orderId: null, awbCode: "", courierName: "", trackingUrl: "" })} className="text-zinc-400 hover:text-zinc-700">
                                <FaTimesCircle size={14} />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="font-bold text-zinc-700 block mb-1">Courier Partner Name</label>
                                <input
                                    type="text"
                                    value={shippingModal.courierName}
                                    onChange={e => setShippingModal(m => ({ ...m, courierName: e.target.value }))}
                                    placeholder="e.g. Delhivery, Bluedart, DTDC"
                                    className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-zinc-700 block mb-1">AWB / Tracking Number</label>
                                <input
                                    type="text"
                                    value={shippingModal.awbCode}
                                    onChange={e => setShippingModal(m => ({ ...m, awbCode: e.target.value }))}
                                    placeholder="e.g. 142389124012"
                                    className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-zinc-700 block mb-1">Tracking URL (Optional)</label>
                                <input
                                    type="text"
                                    value={shippingModal.trackingUrl}
                                    onChange={e => setShippingModal(m => ({ ...m, trackingUrl: e.target.value }))}
                                    placeholder="https://track.courier.com/..."
                                    className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-stone-100">
                            <button
                                onClick={() => {
                                    updateStatus(shippingModal.orderId, "SHIPPED", {
                                        awbCode: shippingModal.awbCode,
                                        courierName: shippingModal.courierName,
                                        trackingUrl: shippingModal.trackingUrl,
                                    });
                                }}
                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                            >
                                Confirm Shipped
                            </button>
                            <button
                                onClick={() => setShippingModal({ open: false, orderId: null, awbCode: "", courierName: "", trackingUrl: "" })}
                                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;