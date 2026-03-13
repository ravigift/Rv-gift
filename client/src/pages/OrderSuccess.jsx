import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import { imgUrl } from "../utils/imageUrl"; // ✅ Cloudinary optimizer
import {
    FaShoppingBag, FaClipboardList, FaWhatsapp,
    FaCheckCircle, FaMapMarkerAlt, FaPhone, FaUser,
} from "react-icons/fa";

const OrderSuccess = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const paymentMethod = location.state?.paymentMethod || null;

    useEffect(() => {
        if (!id) { navigate("/orders"); return; }
        if (!user) { navigate("/login"); return; }
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/orders/${id}`);
                setOrder(data);
            } catch {
                setError("Order not found");
                setTimeout(() => navigate("/orders"), 2000);
            } finally { setLoading(false); }
        };
        fetchOrder();
    }, [id, user, navigate]);

    if (loading) return (
        <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-400 text-sm">Processing your order...</p>
            </div>
        </div>
    );

    if (error || !order) return (
        <div className="min-h-screen bg-[#f1f3f6] flex flex-col items-center justify-center">
            <p className="text-zinc-500 font-semibold mb-2">Order not found</p>
            <p className="text-zinc-400 text-sm">Redirecting...</p>
        </div>
    );

    const isCOD = order.payment?.method === "COD" || paymentMethod === "COD";
    const cleanPhone = order.phone.replace(/[^0-9]/g, "");
    const finalPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const userWhatsApp = `https://wa.me/${finalPhone}?text=${encodeURIComponent(
        `✅ ORDER CONFIRMED\n\nHi ${order.customerName},\n\nOrder ID: #${order._id.slice(-8).toUpperCase()}\nTotal: ₹${order.totalAmount}\nPayment: ${isCOD ? "Cash on Delivery" : "Online Paid"}\n\nThank you for shopping with RV Gift Shop 💝`
    )}`;

    return (
        <div className="min-h-screen py-8 px-4" style={{ background: "#f1f3f6", fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

            <div className="max-w-3xl mx-auto space-y-3">

                {/* ── Success Banner ── */}
                <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
                    <div className="h-1.5 bg-amber-500 w-full" />
                    <div className="px-6 py-5 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center shrink-0">
                            <FaCheckCircle size={28} className="text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-zinc-900">Order Placed Successfully! 🎉</h1>
                            <p className="text-zinc-400 text-sm mt-0.5">
                                Thank you, <span className="font-bold text-zinc-700">{order.customerName}</span>! Your order has been confirmed.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Order Info ── */}
                <div className="bg-white rounded-sm border border-stone-200">
                    <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
                        <h2 className="font-black text-zinc-800 text-sm">Order Summary</h2>
                        <span className="text-xs font-mono font-bold text-zinc-500">#{order._id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-stone-100">
                        {[
                            { label: "Order ID", value: `#${order._id.slice(-8).toUpperCase()}` },
                            { label: "Total Amount", value: `₹${Number(order.totalAmount).toLocaleString("en-IN")}`, highlight: true },
                            { label: "Payment", value: isCOD ? "Cash on Delivery" : "Online Paid ✓" },
                        ].map(({ label, value, highlight }) => (
                            <div key={label} className="px-4 py-3 text-center">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
                                <p className={`font-black text-sm ${highlight ? "text-amber-600 text-lg" : "text-zinc-800"}`}>{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Items ── */}
                <div className="bg-white rounded-sm border border-stone-200">
                    <div className="px-5 py-3 border-b border-stone-100">
                        <h2 className="font-black text-zinc-800 text-sm">Items Ordered</h2>
                    </div>
                    <div className="divide-y divide-stone-50">
                        {order.items?.map((item, idx) => {
                            // ✅ Optimized: 200px thumbnail — lazy load (below fold)
                            const rawImg = item.images?.[0]?.url || item.image || null;
                            const thumbImg = rawImg ? imgUrl.thumbnail(rawImg) : null;

                            return (
                                <div key={idx} className="px-5 py-4 flex gap-4 items-center">
                                    <div className="w-16 h-16 rounded border border-stone-100 bg-stone-50 overflow-hidden flex items-center justify-center shrink-0">
                                        {thumbImg ? (
                                            <img
                                                src={thumbImg}
                                                alt={item.name}
                                                loading="lazy"
                                                decoding="async"
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-contain p-1"
                                                onError={e => { e.target.style.display = "none"; }}
                                            />
                                        ) : (
                                            <span className="text-2xl">🎁</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-zinc-800 text-sm line-clamp-1">{item.name}</p>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            Qty: {item.qty || item.quantity || 1} × ₹{item.price?.toLocaleString("en-IN")}
                                        </p>
                                        {item.customization?.text && (
                                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                ✏️ {item.customization.text}
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-black text-zinc-800 text-sm shrink-0">
                                        ₹{((item.qty || item.quantity || 1) * item.price)?.toLocaleString("en-IN")}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Delivery Info ── */}
                <div className="bg-white rounded-sm border border-stone-200">
                    <div className="px-5 py-3 border-b border-stone-100">
                        <h2 className="font-black text-zinc-800 text-sm">Delivery Details</h2>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                        {[
                            { icon: <FaUser size={11} className="text-amber-500" />, text: order.customerName },
                            { icon: <FaPhone size={11} className="text-amber-500" />, text: order.phone },
                            { icon: <FaMapMarkerAlt size={11} className="text-amber-500" />, text: order.address },
                        ].map(({ icon, text }, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-amber-50 rounded flex items-center justify-center shrink-0 mt-0.5">{icon}</div>
                                <p className="text-sm text-zinc-600">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── CTAs ── */}
                <div className="bg-white rounded-sm border border-stone-200 p-4 space-y-2">
                    <a href={userWhatsApp} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-sm transition-all active:scale-95 text-sm cursor-pointer">
                        <FaWhatsapp size={16} /> Get WhatsApp Confirmation
                    </a>
                    <div className="flex gap-2">
                        <Link to="/orders"
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-sm transition-all active:scale-95 text-sm">
                            <FaClipboardList size={13} /> My Orders
                        </Link>
                        <Link to="/"
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-sm transition-all active:scale-95 text-sm">
                            <FaShoppingBag size={13} /> Continue Shopping
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OrderSuccess;