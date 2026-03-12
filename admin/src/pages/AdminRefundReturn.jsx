/**
 * AdminRefundReturn.jsx
 * Admin panel: Refund queue + Return queue management
 * Tabs: Refunds | Returns | Flagged Orders
 */
import { useEffect, useState, useCallback } from "react";
import api from "../api/adminApi";
import {
    FaSync, FaUser, FaPhone, FaMapMarkerAlt, FaCheckCircle,
    FaBan, FaMoneyBillWave, FaUndo, FaExclamationTriangle,
    FaSpinner, FaChevronDown, FaChevronUp, FaFlag,
} from "react-icons/fa";

/* ─── Status badges ─── */
const RefundBadge = ({ status }) => {
    const cfg = {
        NONE: { cls: "bg-stone-100 text-stone-500", label: "None" },
        REQUESTED: { cls: "bg-yellow-100 text-yellow-700 border border-yellow-200", label: "Requested" },
        PROCESSING: { cls: "bg-blue-100 text-blue-700 border border-blue-200", label: "Processing" },
        PROCESSED: { cls: "bg-emerald-100 text-emerald-700 border border-emerald-200", label: "Processed" },
        REJECTED: { cls: "bg-red-100 text-red-700 border border-red-200", label: "Rejected" },
        FAILED: { cls: "bg-red-200 text-red-800 border border-red-300", label: "Failed" },
    }[status] || { cls: "bg-stone-100 text-stone-500", label: status };
    return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>;
};

const ReturnBadge = ({ status }) => {
    const cfg = {
        NONE: { cls: "bg-stone-100 text-stone-500", label: "None" },
        REQUESTED: { cls: "bg-yellow-100 text-yellow-700 border border-yellow-200", label: "Requested" },
        APPROVED: { cls: "bg-emerald-100 text-emerald-700 border border-emerald-200", label: "Approved" },
        REJECTED: { cls: "bg-red-100 text-red-700 border border-red-200", label: "Rejected" },
        PICKED_UP: { cls: "bg-blue-100 text-blue-700 border border-blue-200", label: "Picked Up" },
        REFUNDED: { cls: "bg-violet-100 text-violet-700 border border-violet-200", label: "Refunded" },
    }[status] || { cls: "bg-stone-100 text-stone-500", label: status };
    return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>;
};

/* ─── Refund Card ─── */
const RefundCard = ({ order, onAction }) => {
    const [expanded, setExpanded] = useState(false);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const refund = order.refund || {};

    const handleAction = async (action) => {
        if (action === "approve" && !window.confirm(`Approve refund of ₹${refund.amount?.toLocaleString("en-IN")} via Razorpay?`)) return;
        try {
            setLoading(true);
            await api.put(`/orders/${order._id}/refund/process`, { action, adminNote: note });
            onAction();
        } catch (err) {
            alert(err.response?.data?.message || "Action failed");
        } finally { setLoading(false); }
    };

    const handleRetry = async () => {
        if (!window.confirm("Retry failed refund?")) return;
        try {
            setRetrying(true);
            await api.put(`/orders/${order._id}/refund/retry`);
            onAction();
        } catch (err) {
            alert(err.response?.data?.message || "Retry failed");
        } finally { setRetrying(false); }
    };
    {
        order.refund?.status === "REQUESTED" && (
            <span className="text-yellow-600">Refund Pending</span>
        )
    }

    {
        order.refund?.status === "PROCESSING" && (
            <span className="text-blue-600">Refund Processing</span>
        )
    }

    {
        order.refund?.status === "PROCESSED" && (
            <span className="text-green-600">Refund Completed</span>
        )
    }

    {
        order.refund?.status === "FAILED" && (
            <span className="text-red-600">Refund Failed</span>
        )
    }

    const isPending = refund.status === "REQUESTED";
    const isFailed = refund.status === "FAILED";

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isFailed ? "border-red-200" : "border-stone-200"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-stone-50"
                onClick={() => setExpanded(e => !e)}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center">
                        <FaMoneyBillWave size={14} className="text-amber-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-zinc-800 text-sm">{order.customerName}</p>
                            <RefundBadge status={refund.status} />
                        </div>
                        <p className="text-xs text-zinc-400">#{order._id.slice(-8).toUpperCase()} · {order.payment?.method}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <p className="font-black text-emerald-600 text-sm">₹{Number(refund.amount || 0).toLocaleString("en-IN")}</p>
                    {expanded ? <FaChevronUp size={11} className="text-zinc-400" /> : <FaChevronDown size={11} className="text-zinc-400" />}
                </div>
            </div>

            {expanded && (
                <div className="border-t border-stone-100 px-5 py-4 space-y-4">
                    <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-zinc-700"><FaUser size={11} className="text-amber-500" />{order.customerName}</div>
                        <div className="flex items-center gap-2 text-zinc-700"><FaPhone size={11} className="text-amber-500" />{order.phone}</div>
                        <p className="text-xs text-zinc-500 mt-1"><b>Reason:</b> {refund.reason || "—"}</p>
                        <p className="text-xs text-zinc-500"><b>Requested:</b> {refund.requestedAt ? new Date(refund.requestedAt).toLocaleString("en-IN") : "—"}</p>
                        {refund.razorpayRefundId && <p className="text-xs text-emerald-600 font-bold">Refund ID: {refund.razorpayRefundId}</p>}
                    </div>

                    {(isPending || isFailed) && (
                        <div className="space-y-3">
                            <textarea
                                placeholder="Admin note (optional)"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                            />
                            {isFailed ? (
                                <button onClick={handleRetry} disabled={retrying}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm disabled:opacity-60 cursor-pointer">
                                    {retrying ? <><FaSpinner className="animate-spin" size={13} /> Retrying...</> : "🔁 Retry Refund"}
                                </button>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => handleAction("approve")} disabled={loading}
                                        className="flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm disabled:opacity-60 cursor-pointer">
                                        {loading ? <FaSpinner className="animate-spin" size={13} /> : <FaCheckCircle size={13} />}
                                        Approve & Refund
                                    </button>
                                    <button onClick={() => handleAction("reject")} disabled={loading}
                                        className="flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm disabled:opacity-60 cursor-pointer">
                                        <FaBan size={13} /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/* ─── Return Card ─── */
const ReturnCard = ({ order, onAction }) => {
    const [expanded, setExpanded] = useState(false);
    const [note, setNote] = useState("");
    const [refundAmount, setRefundAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const ret = order.return || {};

    const handleAction = async (action) => {
        try {
            setLoading(true);
            await api.put(`/orders/${order._id}/return/process`, {
                action,
                adminNote: note,
                refundAmount: refundAmount ? Number(refundAmount) : order.totalAmount,
            });
            onAction();
        } catch (err) {
            alert(err.response?.data?.message || "Action failed");
        } finally { setLoading(false); }
    };

    const isPending = ret.status === "REQUESTED";

    return (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-stone-50"
                onClick={() => setExpanded(e => !e)}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-50 border border-violet-200 rounded-full flex items-center justify-center">
                        <FaUndo size={14} className="text-violet-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-zinc-800 text-sm">{order.customerName}</p>
                            <ReturnBadge status={ret.status} />
                        </div>
                        <p className="text-xs text-zinc-400">#{order._id.slice(-8).toUpperCase()} · Delivered</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <p className="font-black text-emerald-600 text-sm">₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</p>
                    {expanded ? <FaChevronUp size={11} className="text-zinc-400" /> : <FaChevronDown size={11} className="text-zinc-400" />}
                </div>
            </div>

            {expanded && (
                <div className="border-t border-stone-100 px-5 py-4 space-y-4">
                    <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-zinc-700"><FaUser size={11} className="text-amber-500" />{order.customerName}</div>
                        <div className="flex items-center gap-2 text-zinc-700"><FaPhone size={11} className="text-amber-500" />{order.phone}</div>
                        <div className="flex items-start gap-2 text-zinc-700"><FaMapMarkerAlt size={11} className="text-amber-500 mt-0.5 shrink-0" /><span className="text-xs">{order.address}</span></div>
                        <p className="text-xs text-zinc-500 mt-2"><b>Return Reason:</b> {ret.reason || "—"}</p>
                        <p className="text-xs text-zinc-500"><b>Requested:</b> {ret.requestedAt ? new Date(ret.requestedAt).toLocaleString("en-IN") : "—"}</p>
                        {ret.images?.length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-2">
                                {ret.images.map((img, i) => (
                                    <a key={i} href={img} target="_blank" rel="noreferrer">
                                        <img src={img} alt="return" className="w-16 h-16 object-cover rounded-lg border border-stone-200 hover:opacity-90" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Order items */}
                    <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Items to Return</p>
                        {order.items?.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 py-2 border-b border-stone-100 last:border-0">
                                {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-contain bg-stone-50 border border-stone-100 p-0.5 shrink-0" />}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-800 truncate">{item.name}</p>
                                    <p className="text-xs text-zinc-400">Qty: {item.qty}</p>
                                </div>
                                <p className="text-sm font-bold text-zinc-700 shrink-0">₹{(item.price * item.qty).toLocaleString("en-IN")}</p>
                            </div>
                        ))}
                    </div>

                    {isPending && (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-zinc-500 block mb-1">Refund Amount (₹)</label>
                                <input type="number" placeholder={`Default: ₹${order.totalAmount}`}
                                    value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            </div>
                            <textarea
                                placeholder="Admin note (optional)"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleAction("approve")} disabled={loading}
                                    className="flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm disabled:opacity-60 cursor-pointer">
                                    {loading ? <FaSpinner className="animate-spin" size={13} /> : <FaCheckCircle size={13} />}
                                    Approve Return
                                </button>
                                <button onClick={() => handleAction("reject")} disabled={loading}
                                    className="flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm disabled:opacity-60 cursor-pointer">
                                    <FaBan size={13} /> Reject
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/* ─── Flagged Order Card ─── */
const FlaggedCard = ({ order }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-red-50"
                onClick={() => setExpanded(e => !e)}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-full flex items-center justify-center">
                        <FaFlag size={14} className="text-red-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-zinc-800 text-sm">{order.customerName}</p>
                            {order.payment?.flagReasons?.map((r, i) => (
                                <span key={i} className="text-[9px] font-black bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full">{r}</span>
                            ))}
                        </div>
                        <p className="text-xs text-zinc-400">#{order._id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleString("en-IN")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <p className="font-black text-emerald-600 text-sm">₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</p>
                    {expanded ? <FaChevronUp size={11} className="text-zinc-400" /> : <FaChevronDown size={11} className="text-zinc-400" />}
                </div>
            </div>
            {expanded && (
                <div className="border-t border-red-100 px-5 py-4 bg-red-50/30 space-y-3">
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Customer</p>
                            <p className="text-zinc-700">{order.customerName} · {order.phone}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{order.address}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Payment</p>
                            <p className="text-zinc-700">{order.payment?.method} · {order.payment?.status}</p>
                            {order.payment?.ip && <p className="text-zinc-500 text-xs mt-0.5">IP: {order.payment.ip}</p>}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Fraud Flags</p>
                        <div className="flex gap-2 flex-wrap">
                            {order.payment?.flagReasons?.map((r, i) => (
                                <span key={i} className="text-xs font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded-lg">{r.replace(/_/g, " ")}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
const AdminRefundReturn = () => {
    const [activeTab, setActiveTab] = useState("refunds");
    const [refunds, setRefunds] = useState([]);
    const [returns, setReturns] = useState([]);
    const [flagged, setFlagged] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const [r1, r2, r3] = await Promise.all([
                api.get("/orders/admin/refunds"),
                api.get("/orders/admin/returns"),
                api.get("/orders/admin/flagged"),
            ]);
            setRefunds(Array.isArray(r1.data) ? r1.data : []);
            setReturns(Array.isArray(r2.data) ? r2.data : []);
            setFlagged(Array.isArray(r3.data) ? r3.data : []);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    const refresh = () => { setRefreshing(true); fetchAll(); };

    const tabs = [
        { id: "refunds", label: "Refunds", count: refunds.length, icon: <FaMoneyBillWave size={13} />, color: "text-emerald-600" },
        { id: "returns", label: "Returns", count: returns.length, icon: <FaUndo size={13} />, color: "text-violet-600" },
        { id: "flagged", label: "Flagged", count: flagged.length, icon: <FaExclamationTriangle size={13} />, color: "text-red-600" },
    ];

    return (
        <div className="min-h-screen bg-stone-50">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); .ar-root{font-family:'DM Sans',sans-serif;}`}</style>
            <div className="ar-root max-w-4xl mx-auto px-4 py-8">

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900">Refunds & Returns</h1>
                        <p className="text-zinc-400 text-sm mt-0.5">Manage customer refunds, returns, and fraud alerts</p>
                    </div>
                    <button onClick={refresh} disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 text-zinc-600 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-all disabled:opacity-50 cursor-pointer">
                        <FaSync size={12} className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${activeTab === tab.id ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-500 border-stone-200 hover:border-zinc-400"}`}>
                            <span className={activeTab === tab.id ? "text-white" : tab.color}>{tab.icon}</span>
                            {tab.label}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-stone-100 text-zinc-500"}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-zinc-500 text-sm">Loading...</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeTab === "refunds" && (
                            refunds.length === 0
                                ? <EmptyState icon={<FaMoneyBillWave size={28} />} text="No pending refund requests" />
                                : refunds.map(o => <RefundCard key={o._id} order={o} onAction={fetchAll} />)
                        )}
                        {activeTab === "returns" && (
                            returns.length === 0
                                ? <EmptyState icon={<FaUndo size={28} />} text="No pending return requests" />
                                : returns.map(o => <ReturnCard key={o._id} order={o} onAction={fetchAll} />)
                        )}
                        {activeTab === "flagged" && (
                            flagged.length === 0
                                ? <EmptyState icon={<FaFlag size={28} />} text="No flagged orders" />
                                : flagged.map(o => <FlaggedCard key={o._id} order={o} />)
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const EmptyState = ({ icon, text }) => (
    <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-16 text-center">
        <div className="text-stone-300 mx-auto mb-3 flex justify-center">{icon}</div>
        <p className="text-zinc-500 font-semibold">{text}</p>
        <p className="text-zinc-400 text-xs mt-1">Check back later</p>
    </div>
);

export default AdminRefundReturn;