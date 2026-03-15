import { useEffect, useState, useCallback } from "react";
import api from "../api/adminApi";
import { imgUrl } from "../utils/imageUrl";
import {
    FaSync, FaUser, FaPhone, FaMapMarkerAlt,
    FaBox, FaChevronRight, FaWhatsapp, FaBoxOpen,
    FaCheckCircle, FaClock, FaPencilAlt,
    FaStickyNote, FaImage, FaBan, FaFileInvoice,
    FaTag, FaSpinner, FaUndo, FaTimesCircle, FaSearch,
} from "react-icons/fa";

const STATUS_CONFIG = {
    PLACED: { label: "Placed", color: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-400" },
    CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400" },
    PACKED: { label: "Packed", color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-400" },
    SHIPPED: { label: "Shipped", color: "bg-indigo-100 text-indigo-700 border-indigo-200", dot: "bg-indigo-400" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-400" },
    DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
};

const FLOW = {
    PLACED: "CONFIRMED", CONFIRMED: "PACKED", PACKED: "SHIPPED",
    SHIPPED: "OUT_FOR_DELIVERY", OUT_FOR_DELIVERY: "DELIVERED",
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
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide">Customization Required</p>
            {hasText && (
                <div className="flex items-start gap-2">
                    <FaPencilAlt size={10} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[10px] text-amber-600 font-bold">Print Text:</p>
                        <p className="text-sm font-semibold text-zinc-800">{customization.text}</p>
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
                                className="w-20 h-20 object-cover rounded-lg border-2 border-amber-200 hover:opacity-90 transition-opacity cursor-pointer" />
                        </a>
                    </div>
                </div>
            )}
            {hasNote && (
                <div className="flex items-start gap-2">
                    <FaStickyNote size={10} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[10px] text-amber-600 font-bold">Special Instructions:</p>
                        <p className="text-sm text-zinc-700 leading-relaxed">{customization.note}</p>
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

    const refund = order.refund;
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

    // ── Backend pagination state ──────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // ── Stats (separate lightweight call) ─────────────────
    const [stats, setStats] = useState({ total: 0, placed: 0, delivered: 0, cancelled: 0, refunds: 0 });

    // ── Fetch orders from backend (paginated + filtered) ──
    const fetchOrders = useCallback(async ({ page = 1, status = "ALL", search = "" } = {}) => {
        try {
            setError("");
            setLoading(true);

            const params = { page, limit: PAGE_LIMIT };
            if (status && status !== "ALL" && status !== "REFUND_PENDING")
                params.status = status;
            if (search.trim())
                params.search = search.trim();

            const { data } = await api.get("/orders", { params });

            // Backend returns { orders, total, page, totalPages }
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

    // ── Fetch stats (all-orders count for filter tabs) ────
    const fetchStats = useCallback(async () => {
        try {
            // Use a high-limit call just for counts — or add a /orders/stats endpoint
            const { data } = await api.get("/orders", { params: { page: 1, limit: 1 } });
            // We get total from response; per-status counts need separate call or stats endpoint
            // For now derive from current orders — good enough for dashboard tabs
            setStats(prev => ({ ...prev, total: data?.total || 0 }));
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchOrders({ page: 1, status: filterStatus, search: searchQuery });
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Page / filter / search change ─────────────────────
    const goToPage = (page) => {
        setExpandedId(null);
        window.scrollTo(0, 0);
        fetchOrders({ page, status: filterStatus, search: searchQuery });
    };

    const handleFilterChange = (key) => {
        setFilterStatus(key);
        setExpandedId(null);
        setCurrentPage(1);
        fetchOrders({ page: 1, status: key, search: searchQuery });
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
        await fetchOrders({ page: currentPage, status: filterStatus, search: searchQuery });
        setRefreshing(false);
    };

    // ── Status update ──────────────────────────────────────
    const updateStatus = async (orderId, nextStatus) => {
        if (!nextStatus) return;
        try {
            setUpdatingId(orderId);
            const { data: updatedOrder } = await api.put(`/orders/${orderId}`, { status: nextStatus });
            if (updatedOrder?._id) {
                setOrders(prev => prev.map(o => o._id === orderId ? updatedOrder : o));
            } else {
                await fetchOrders({ page: currentPage, status: filterStatus, search: searchQuery });
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update status");
            await fetchOrders({ page: currentPage, status: filterStatus, search: searchQuery });
        } finally { setUpdatingId(null); }
    };

    const handleRefundUpdate = (orderId, updatedOrder) => {
        setOrders(prev => prev.map(o => o._id === orderId ? updatedOrder : o));
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

    // ── Page number buttons ────────────────────────────────
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
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-500 text-sm font-medium">Loading orders...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
            <div className="text-center bg-white rounded-2xl p-10 border border-stone-200 shadow-sm">
                <p className="text-4xl mb-3">⚠</p>
                <p className="text-zinc-700 font-bold mb-4">{error}</p>
                <button onClick={() => fetchOrders()} className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 cursor-pointer">Retry</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); .admin-root{font-family:'DM Sans',sans-serif;}`}</style>
            <div className="admin-root max-w-6xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900">Order Management</h1>
                        <p className="text-zinc-400 text-sm mt-0.5">{totalOrders} total orders</p>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <div className="relative">
                                <FaSearch size={11} className="absolute left-3 top-3 text-zinc-400" />
                                <input
                                    type="text" value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    placeholder="Search name, phone..."
                                    className="pl-8 pr-3 py-2 border border-stone-200 rounded-xl text-sm bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-300 w-44"
                                />
                            </div>
                            {searchQuery && (
                                <button type="button" onClick={clearSearch}
                                    className="text-xs text-zinc-400 hover:text-red-500 font-bold cursor-pointer">✕ Clear</button>
                            )}
                        </form>
                        <button onClick={refreshOrders} disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-zinc-600 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-all disabled:opacity-50 cursor-pointer">
                            <FaSync size={11} className={refreshing ? "animate-spin" : ""} />
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
                    {[
                        { key: "ALL", label: "All" },
                        ...FLOW_STEPS.map(s => ({ key: s, label: STATUS_CONFIG[s]?.label, dot: STATUS_CONFIG[s]?.dot })),
                        { key: "CANCELLED", label: "Cancelled", dot: STATUS_CONFIG.CANCELLED.dot },
                    ].map(({ key, label, dot }) => (
                        <button key={key} onClick={() => handleFilterChange(key)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 cursor-pointer ${filterStatus === key
                                    ? "bg-zinc-900 text-white border-zinc-900"
                                    : "bg-white text-zinc-500 border-stone-200 hover:border-zinc-400"
                                }`}>
                            {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
                            {label}
                        </button>
                    ))}
                </div>

                {/* Loading overlay — page change pe */}
                {loading && orders.length > 0 && (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {orders.length === 0 && !loading && (
                    <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-16 text-center">
                        <FaBoxOpen size={36} className="text-stone-300 mx-auto mb-3" />
                        <p className="text-zinc-500 font-semibold">No orders found</p>
                        {searchQuery && <p className="text-zinc-400 text-sm mt-1">Try a different search term</p>}
                    </div>
                )}

                <div className="space-y-4">
                    {orders.map(order => {
                        const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED;
                        const isCancelled = order.orderStatus === "CANCELLED";
                        const nextStatus = isCancelled ? null : FLOW[order.orderStatus];
                        const nextCfg = nextStatus ? STATUS_CONFIG[nextStatus] : null;
                        const isUpdating = updatingId === order._id;
                        const isExpanded = expandedId === order._id;
                        const stepIdx = FLOW_STEPS.indexOf(order.orderStatus);
                        const isDownloading = downloadingId === order._id;
                        const hasCustom = order.items?.some(i => i.customization?.text || i.customization?.imageUrl || i.customization?.note);
                        const hasRefundPending = order.refund?.status === "REQUESTED";

                        return (
                            <div key={order._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${hasRefundPending ? "border-orange-300" : isCancelled ? "border-red-200" : "border-stone-200"}`}>

                                {/* Row Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-stone-50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : order._id)}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${hasRefundPending ? "bg-orange-50 border-orange-200" : isCancelled ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                                            {hasRefundPending ? <FaUndo size={14} className="text-orange-400" />
                                                : isCancelled ? <FaBan size={14} className="text-red-400" />
                                                    : <FaUser size={14} className="text-amber-500" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-zinc-800 text-sm">{order.customerName}</p>
                                                {hasCustom && !isCancelled && (
                                                    <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black px-1.5 py-0.5 rounded-full">Custom</span>
                                                )}
                                                {hasRefundPending && (
                                                    <span className="bg-orange-100 text-orange-700 border border-orange-200 text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                        <FaUndo size={8} /> Refund Pending
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-400">
                                                #{order._id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                        <p className="font-black text-emerald-600 text-sm">₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</p>
                                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            {cfg.label}
                                        </span>
                                        <button onClick={e => handleDownloadInvoice(order._id, e)} disabled={isDownloading}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-all disabled:opacity-50 cursor-pointer">
                                            <FaFileInvoice size={11} />
                                            {isDownloading ? "..." : "Invoice"}
                                        </button>
                                        <FaChevronRight size={11} className={`text-zinc-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {!isCancelled && (
                                    <div className="px-5 pb-3">
                                        <div className="flex items-center">
                                            {FLOW_STEPS.map((step, i) => (
                                                <div key={step} className="flex items-center flex-1">
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${i <= stepIdx ? "border-emerald-500 bg-emerald-500" : "border-stone-200 bg-white"}`}>
                                                        {i <= stepIdx && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                    {i < FLOW_STEPS.length - 1 && (
                                                        <div className={`flex-1 h-0.5 ${i < stepIdx ? "bg-emerald-400" : "bg-stone-200"}`} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            {FLOW_STEPS.map((step, i) => (
                                                <p key={step} className={`text-[9px] font-medium ${i <= stepIdx ? "text-emerald-600" : "text-zinc-300"}`}
                                                    style={{ width: `${100 / FLOW_STEPS.length}%`, textAlign: i === 0 ? "left" : i === FLOW_STEPS.length - 1 ? "right" : "center" }}>
                                                    {STATUS_CONFIG[step]?.label.split(" ")[0]}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isCancelled && (
                                    <div className="mx-5 mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                                        <FaBan size={12} className="text-red-400 shrink-0" />
                                        <p className="text-xs font-bold text-red-600">
                                            This order was cancelled{order.cancellationReason ? ` — ${order.cancellationReason}` : ""}
                                        </p>
                                    </div>
                                )}

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-stone-100 px-5 py-4 space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {/* Customer Info */}
                                            <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Customer</p>
                                                <div className="flex items-center gap-2 text-sm text-zinc-700"><FaUser size={11} className="text-amber-500 shrink-0" />{order.customerName}</div>
                                                <div className="flex items-center gap-2 text-sm text-zinc-700"><FaPhone size={11} className="text-amber-500 shrink-0" />{order.phone}</div>
                                                <div className="flex items-start gap-2 text-sm text-zinc-700"><FaMapMarkerAlt size={11} className="text-amber-500 shrink-0 mt-0.5" /><span className="leading-relaxed">{order.address}</span></div>
                                            </div>

                                            {/* Status Control */}
                                            <div className="bg-stone-50 rounded-xl p-4">
                                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-3">Update Status</p>
                                                {isCancelled ? (
                                                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                                        <FaBan size={14} className="text-red-500 shrink-0" />
                                                        <span className="text-red-600 font-bold text-sm">Order Cancelled</span>
                                                    </div>
                                                ) : nextStatus ? (
                                                    <button onClick={() => updateStatus(order._id, nextStatus)} disabled={isUpdating}
                                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-60 cursor-pointer">
                                                        {isUpdating
                                                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</>
                                                            : <>Mark as <span className={`px-2 py-0.5 rounded-lg text-xs ${nextCfg?.color}`}>{nextCfg?.label}</span></>}
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                                        <FaCheckCircle /> Order Delivered
                                                    </div>
                                                )}
                                                {!isCancelled && (
                                                    <a href={`https://wa.me/91${order.phone}?text=${encodeURIComponent(`Hi ${order.customerName}! Your order #${order._id.slice(-6).toUpperCase()} is now ${cfg.label}. Thank you for shopping with RV Gifts!`)}`}
                                                        target="_blank" rel="noreferrer"
                                                        className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all">
                                                        <FaWhatsapp size={14} /> WhatsApp Customer
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Refund */}
                                        {order.refund?.status && order.refund.status !== "NONE" && (
                                            <div>
                                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Refund</p>
                                                <RefundCard order={order} onRefundUpdate={handleRefundUpdate} />
                                            </div>
                                        )}

                                        {/* Order Items */}
                                        <div>
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-3">Order Items</p>
                                            <div className="space-y-3">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="bg-stone-50 rounded-xl p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-lg bg-white border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                                                                {item.image
                                                                    ? <img src={imgUrl.thumbnail(item.image)} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-contain p-1" onError={e => { e.target.style.display = "none"; }} />
                                                                    : <FaBoxOpen size={16} className="text-stone-400" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-zinc-800 text-sm truncate">{item.name}</p>
                                                                <p className="text-xs text-zinc-400">
                                                                    Qty: {item.qty}
                                                                    {item.selectedSize && (
                                                                        <span className="ml-2 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{item.selectedSize}</span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <p className="font-bold text-zinc-800 text-sm shrink-0">₹{(item.price * item.qty).toLocaleString("en-IN")}</p>
                                                        </div>
                                                        <CustomizationCard customization={item.customization} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-stone-200">
                                                <span className="font-bold text-zinc-700 text-sm">Total Amount</span>
                                                <span className="font-black text-emerald-600 text-lg">₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-200 flex-wrap gap-3">
                        <p className="text-sm text-zinc-400 font-medium">
                            Showing <span className="font-bold text-zinc-600">{(currentPage - 1) * PAGE_LIMIT + 1}–{Math.min(currentPage * PAGE_LIMIT, totalOrders)}</span> of <span className="font-bold text-zinc-600">{totalOrders}</span> orders
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-bold bg-white border border-stone-200 text-zinc-600 rounded-xl hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                                ← Prev
                            </button>
                            {getPageNumbers().map((p, i) =>
                                p === "…" ? (
                                    <span key={`dot-${i}`} className="px-2 text-zinc-400 text-sm">…</span>
                                ) : (
                                    <button key={p} onClick={() => goToPage(p)}
                                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-all cursor-pointer ${currentPage === p ? "bg-zinc-900 text-white" : "bg-white border border-stone-200 text-zinc-600 hover:bg-stone-50"}`}>
                                        {p}
                                    </button>
                                )
                            )}
                            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm font-bold bg-white border border-stone-200 text-zinc-600 rounded-xl hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;