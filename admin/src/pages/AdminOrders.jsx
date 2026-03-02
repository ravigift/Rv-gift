import { useEffect, useState, useCallback } from "react";
import api from "../api/adminApi";
import {
    FaSync, FaUser, FaPhone, FaMapMarkerAlt,
    FaBox, FaChevronRight, FaWhatsapp, FaBoxOpen,
    FaCheckCircle, FaTruck, FaClock, FaPencilAlt,
    FaStickyNote, FaImage
} from "react-icons/fa";

/* ── Status Config ── */
const STATUS_CONFIG = {
    PLACED: { label: "Placed", color: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-400", icon: <FaClock size={10} /> },
    CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400", icon: <FaCheckCircle size={10} /> },
    PACKED: { label: "Packed", color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-400", icon: <FaBox size={10} /> },
    SHIPPED: { label: "Shipped", color: "bg-indigo-100 text-indigo-700 border-indigo-200", dot: "bg-indigo-400", icon: <FaTruck size={10} /> },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-400", icon: <FaTruck size={10} /> },
    DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", icon: <FaCheckCircle size={10} /> },
};

const FLOW = {
    PLACED: "CONFIRMED",
    CONFIRMED: "PACKED",
    PACKED: "SHIPPED",
    SHIPPED: "OUT_FOR_DELIVERY",
    OUT_FOR_DELIVERY: "DELIVERED",
};

const FLOW_STEPS = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

/* ── Customization Badge ── */
const CustomizationCard = ({ customization }) => {
    const hasText = customization?.text?.trim();
    const hasImage = customization?.imageUrl?.trim();
    const hasNote = customization?.note?.trim();

    if (!hasText && !hasImage && !hasNote) return null;

    return (
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide flex items-center gap-1">
                ✏️ Customization Required
            </p>

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
                            <img
                                src={customization.imageUrl}
                                alt="customer upload"
                                className="w-20 h-20 object-cover rounded-lg border-2 border-amber-200 hover:opacity-90 transition-opacity cursor-pointer"
                            />
                        </a>
                        <p className="text-[9px] text-amber-500 mt-1">Click to open full size</p>
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

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [expandedId, setExpandedId] = useState(null);

    const fetchOrders = useCallback(async () => {
        try {
            setError("");
            setLoading(true);
            const { data } = await api.get("/orders");
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.status === 403
                ? "Access denied. Admin / Owner permission required."
                : "Failed to load orders. Please try again."
            );
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const updateStatus = async (orderId, nextStatus) => {
        if (!nextStatus) return;
        try {
            setUpdatingId(orderId);
            await api.put(`/orders/${orderId}`, { status: nextStatus });
            setOrders(prev => prev.map(o =>
                o._id === orderId ? { ...o, orderStatus: nextStatus } : o
            ));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update status");
            fetchOrders();
        } finally {
            setUpdatingId(null);
        }
    };

    const refreshOrders = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    const filtered = filterStatus === "ALL"
        ? orders
        : orders.filter(o => o.orderStatus === filterStatus);

    const stats = {
        total: orders.length,
        placed: orders.filter(o => o.orderStatus === "PLACED").length,
        delivered: orders.filter(o => o.orderStatus === "DELIVERED").length,
        revenue: orders.filter(o => o.orderStatus === "DELIVERED")
            .reduce((s, o) => s + (o.totalAmount || 0), 0),
    };

    // Check if any item in any order has customization
    const customOrdersCount = orders.filter(o =>
        o.items?.some(i => i.customization?.text || i.customization?.imageUrl || i.customization?.note)
    ).length;

    if (loading) return (
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
                <p className="text-4xl mb-3">⚠️</p>
                <p className="text-zinc-700 font-bold mb-4">{error}</p>
                <button onClick={fetchOrders} className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800">Retry</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); .admin-root{font-family:'DM Sans',sans-serif;}`}</style>

            <div className="admin-root max-w-6xl mx-auto px-4 py-8">

                {/* ── Header ── */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900">Order Management</h1>
                        <p className="text-zinc-400 text-sm mt-0.5">{orders.length} total orders</p>
                    </div>
                    <button onClick={refreshOrders} disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 text-zinc-600 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-all disabled:opacity-50">
                        <FaSync size={12} className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: "Total Orders", value: stats.total, color: "text-zinc-800" },
                        { label: "New (Placed)", value: stats.placed, color: "text-yellow-600" },
                        { label: "Delivered", value: stats.delivered, color: "text-emerald-600" },
                        { label: "Custom Orders", value: customOrdersCount, color: "text-amber-600" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white border border-stone-200 rounded-2xl px-4 py-3">
                            <p className="text-xs text-zinc-400 font-medium mb-0.5">{label}</p>
                            <p className={`text-xl font-black ${color}`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Filter Pills ── */}
                <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
                    {["ALL", ...FLOW_STEPS].map(status => {
                        const cfg = STATUS_CONFIG[status];
                        const count = status === "ALL" ? orders.length : orders.filter(o => o.orderStatus === status).length;
                        return (
                            <button key={status} onClick={() => setFilterStatus(status)}
                                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${filterStatus === status
                                    ? "bg-zinc-900 text-white border-zinc-900"
                                    : "bg-white text-zinc-500 border-stone-200 hover:border-zinc-400"}`}>
                                {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                                {cfg?.label || "All"} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* ── Empty ── */}
                {filtered.length === 0 && (
                    <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-16 text-center">
                        <FaBoxOpen size={36} className="text-stone-300 mx-auto mb-3" />
                        <p className="text-zinc-500 font-semibold">No orders found</p>
                    </div>
                )}

                {/* ── Orders List ── */}
                <div className="space-y-4">
                    {filtered.map(order => {
                        const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED;
                        const nextStatus = FLOW[order.orderStatus];
                        const nextCfg = nextStatus ? STATUS_CONFIG[nextStatus] : null;
                        const isUpdating = updatingId === order._id;
                        const isExpanded = expandedId === order._id;
                        const stepIdx = FLOW_STEPS.indexOf(order.orderStatus);

                        // Check if this order has any customization
                        const hasCustomization = order.items?.some(
                            i => i.customization?.text || i.customization?.imageUrl || i.customization?.note
                        );

                        return (
                            <div key={order._id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">

                                {/* ── Order Header ── */}
                                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-stone-50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : order._id)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                                            <FaUser size={14} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-zinc-800 text-sm">{order.customerName}</p>
                                                {/* ✅ CUSTOMIZATION BADGE */}
                                                {hasCustomization && (
                                                    <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                                        ✏️ Custom
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-400">
                                                #{order._id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <p className="font-black text-emerald-600 text-sm">₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</p>
                                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            {cfg.label}
                                        </span>
                                        <FaChevronRight size={11} className={`text-zinc-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                    </div>
                                </div>

                                {/* ── Progress Bar ── */}
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

                                {/* ── Expanded Details ── */}
                                {isExpanded && (
                                    <div className="border-t border-stone-100 px-5 py-4 space-y-4">

                                        {/* Customer Info + Status Update */}
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Customer</p>
                                                <div className="flex items-center gap-2 text-sm text-zinc-700">
                                                    <FaUser size={11} className="text-amber-500 shrink-0" />
                                                    {order.customerName}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-zinc-700">
                                                    <FaPhone size={11} className="text-amber-500 shrink-0" />
                                                    {order.phone}
                                                </div>
                                                <div className="flex items-start gap-2 text-sm text-zinc-700">
                                                    <FaMapMarkerAlt size={11} className="text-amber-500 shrink-0 mt-0.5" />
                                                    <span className="leading-relaxed">{order.address}</span>
                                                </div>
                                            </div>

                                            <div className="bg-stone-50 rounded-xl p-4">
                                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-3">Update Status</p>
                                                {nextStatus ? (
                                                    <button onClick={() => updateStatus(order._id, nextStatus)} disabled={isUpdating}
                                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-60">
                                                        {isUpdating ? (
                                                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</>
                                                        ) : (
                                                            <>Mark as <span className={`px-2 py-0.5 rounded-lg text-xs ${nextCfg?.color}`}>{nextCfg?.label}</span></>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                                        <FaCheckCircle /> Order Delivered ✓
                                                    </div>
                                                )}
                                                <a href={`https://wa.me/91${order.phone}?text=${encodeURIComponent(`Hi ${order.customerName}! Your order #${order._id.slice(-6).toUpperCase()} is now ${cfg.label}. Thank you for shopping with RV Gifts! 🎁`)}`}
                                                    target="_blank" rel="noreferrer"
                                                    className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all">
                                                    <FaWhatsapp size={14} /> WhatsApp Customer
                                                </a>
                                            </div>
                                        </div>

                                        {/* ── Order Items + Customization ── */}
                                        <div>
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-3">Order Items</p>
                                            <div className="space-y-3">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="bg-stone-50 rounded-xl p-3">
                                                        <div className="flex items-center gap-3">
                                                            {/* Product Image */}
                                                            <div className="w-12 h-12 rounded-lg bg-white border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                                                                {item.image ? (
                                                                    <img src={item.image} alt={item.name}
                                                                        className="w-full h-full object-contain p-1"
                                                                        onError={e => { e.target.style.display = "none"; }} />
                                                                ) : (
                                                                    <FaBoxOpen size={16} className="text-stone-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-zinc-800 text-sm truncate">{item.name}</p>
                                                                <p className="text-xs text-zinc-400">Qty: {item.qty}</p>
                                                            </div>
                                                            <p className="font-bold text-zinc-800 text-sm shrink-0">
                                                                ₹{(item.price * item.qty).toLocaleString("en-IN")}
                                                            </p>
                                                        </div>

                                                        {/* ✅ CUSTOMIZATION DETAILS */}
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
            </div>
        </div>
    );
};



export default AdminOrders;