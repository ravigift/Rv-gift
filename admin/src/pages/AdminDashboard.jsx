import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/adminApi";
import {
    FaBox, FaClipboardList, FaPlus, FaRupeeSign,
    FaShoppingBag, FaTruck, FaCheckCircle, FaClock,
    FaArrowRight, FaFire, FaMapMarkerAlt
} from "react-icons/fa";

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [customerLocations, setCustomerLocations] = useState([]);
    const [cityStats, setCityStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: orders } = await api.get("/orders");
                const { data: products } = await api.get("/products");
                const { data: users } = await api.get("/auth/users").catch(() => ({ data: [] }));

                const list = Array.isArray(orders) ? orders : [];
                const prodList = Array.isArray(products) ? products : [];
                const userList = Array.isArray(users) ? users : [];

                const delivered = list.filter(o => o.orderStatus === "DELIVERED");
                const pending = list.filter(o => o.orderStatus === "PLACED");
                const revenue = delivered.reduce((s, o) => s + (o.totalAmount || 0), 0);

                setStats({
                    totalOrders: list.length,
                    totalProducts: prodList.length,
                    revenue,
                    pending: pending.length,
                    delivered: delivered.length,
                    inTransit: list.filter(o => ["SHIPPED", "OUT_FOR_DELIVERY"].includes(o.orderStatus)).length,
                });

                setRecentOrders(list.slice(0, 5));

                // ✅ Customer locations
                const withLocation = userList.filter(u => u.location?.latitude && u.location?.city);
                setCustomerLocations(withLocation);

                // ✅ City-wise count
                const cityMap = {};
                withLocation.forEach(u => {
                    const city = u.location.city;
                    cityMap[city] = (cityMap[city] || 0) + 1;
                });

                const sorted = Object.entries(cityMap)
                    .map(([city, count]) => ({ city, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8);

                setCityStats(sorted);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const STATUS_CONFIG = {
        PLACED: { label: "Placed", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
        CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-700", dot: "bg-blue-400" },
        PACKED: { label: "Packed", color: "bg-purple-100 text-purple-700", dot: "bg-purple-400" },
        SHIPPED: { label: "Shipped", color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-400" },
        OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-orange-100 text-orange-700", dot: "bg-orange-400" },
        DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    };

    const maxCount = cityStats[0]?.count || 1;

    // Shop location — Lucknow
    const SHOP_LAT = 26.8467;
    const SHOP_LNG = 80.9462;

    // Convert lat/lng to map percentage position
    const toMapPos = (lat, lng) => {
        const MAP_BOUNDS = { minLat: 8, maxLat: 37, minLng: 68, maxLng: 97 };
        const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
        const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
        return { x, y };
    };

    const shopPos = toMapPos(SHOP_LAT, SHOP_LNG);

    return (
        <div className="min-h-screen bg-stone-50">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); .dash{font-family:'DM Sans',sans-serif;}`}</style>

            <div className="dash max-w-6xl mx-auto px-4 py-8 space-y-6">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900">Dashboard</h1>
                        <p className="text-zinc-400 text-sm mt-0.5">
                            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>
                    <Link to="/admin/products/new"
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-200">
                        <FaPlus size={11} /> Add Product
                    </Link>
                </div>

                {/* ── Stats Grid ── */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-stone-200 h-24 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "Total Revenue", value: `₹${(stats?.revenue || 0).toLocaleString("en-IN")}`, icon: <FaRupeeSign size={14} />, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", iconBg: "bg-emerald-500" },
                            { label: "Total Orders", value: stats?.totalOrders || 0, icon: <FaShoppingBag size={14} />, color: "text-blue-600", bg: "bg-blue-50 border-blue-100", iconBg: "bg-blue-500" },
                            { label: "Products", value: stats?.totalProducts || 0, icon: <FaBox size={14} />, color: "text-amber-600", bg: "bg-amber-50 border-amber-100", iconBg: "bg-amber-500" },
                            { label: "Pending", value: stats?.pending || 0, icon: <FaClock size={14} />, color: "text-red-500", bg: "bg-red-50 border-red-100", iconBg: "bg-red-500" },
                        ].map(({ label, value, icon, color, bg, iconBg }) => (
                            <div key={label} className={`bg-white border ${bg} rounded-2xl p-4`}>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs text-zinc-400 font-medium">{label}</p>
                                    <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center text-white`}>{icon}</div>
                                </div>
                                <p className={`text-2xl font-black ${color}`}>{value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Order Status Row ── */}
                {!loading && stats && (
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: "Delivered", value: stats.delivered, icon: <FaCheckCircle size={13} />, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
                            { label: "In Transit", value: stats.inTransit, icon: <FaTruck size={13} />, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
                            { label: "New Orders", value: stats.pending, icon: <FaFire size={13} />, color: "text-orange-500", bg: "bg-orange-50 border-orange-100" },
                        ].map(({ label, value, icon, color, bg }) => (
                            <div key={label} className={`bg-white border ${bg} rounded-2xl px-4 py-3 flex items-center justify-between`}>
                                <div>
                                    <p className="text-xs text-zinc-400 font-medium">{label}</p>
                                    <p className={`text-xl font-black ${color} mt-0.5`}>{value}</p>
                                </div>
                                <div className={`${color} opacity-60`}>{icon}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── LOCATION SECTION ── */}
                <div className="grid md:grid-cols-2 gap-5">

                    {/* ── City-wise Bar Chart ── */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-amber-500" size={13} />
                            <h2 className="font-black text-zinc-800 text-sm">Customers by City</h2>
                            <span className="ml-auto text-xs text-zinc-400">{customerLocations.length} tracked</span>
                        </div>

                        <div className="p-5">
                            {cityStats.length === 0 ? (
                                <div className="text-center py-8">
                                    <FaMapMarkerAlt size={28} className="text-stone-300 mx-auto mb-2" />
                                    <p className="text-zinc-400 text-sm">No location data yet</p>
                                    <p className="text-zinc-300 text-xs mt-1">Customers se location allow karwao</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cityStats.map(({ city, count }) => (
                                        <div key={city}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-semibold text-zinc-700">{city}</span>
                                                <span className="text-xs font-bold text-amber-600">{count} customer{count > 1 ? "s" : ""}</span>
                                            </div>
                                            <div className="w-full bg-stone-100 rounded-full h-2.5">
                                                <div
                                                    className="bg-gradient-to-r from-amber-400 to-amber-500 h-2.5 rounded-full transition-all duration-700"
                                                    style={{ width: `${(count / maxCount) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── India Map with Pins ── */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-red-500" size={13} />
                            <h2 className="font-black text-zinc-800 text-sm">Customer Map</h2>
                            <div className="ml-auto flex items-center gap-3 text-xs text-zinc-400">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Shop</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Customer</span>
                            </div>
                        </div>

                        <div className="p-4">
                            {/* India SVG Map */}
                            <div className="relative w-full" style={{ paddingBottom: "100%" }}>
                                <div className="absolute inset-0">
                                    <svg
                                        viewBox="0 0 400 450"
                                        className="w-full h-full"
                                        style={{ background: "#f0f9ff" }}
                                    >
                                        {/* India outline — simplified */}
                                        <path
                                            d="M160,20 L200,15 L240,25 L270,40 L290,70 L300,100 L310,130 L320,160 L315,190 L310,220 L300,250 L285,275 L265,295 L250,320 L240,345 L230,370 L220,390 L210,410 L200,425 L190,410 L180,390 L170,365 L158,340 L145,315 L130,290 L115,265 L105,240 L95,210 L88,180 L85,150 L88,120 L95,95 L110,70 L130,50 L160,20 Z"
                                            fill="#e0f2fe"
                                            stroke="#94a3b8"
                                            strokeWidth="1.5"
                                        />

                                        {/* Grid lines */}
                                        {[...Array(5)].map((_, i) => (
                                            <line key={`h${i}`} x1="80" y1={80 + i * 70} x2="325" y2={80 + i * 70}
                                                stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" />
                                        ))}
                                        {[...Array(5)].map((_, i) => (
                                            <line key={`v${i}`} x1={100 + i * 50} y1="20" x2={100 + i * 50} y2="430"
                                                stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" />
                                        ))}

                                        {/* ✅ SHOP PIN — Lucknow */}
                                        <g transform={`translate(${80 + shopPos.x * 2.45}, ${20 + shopPos.y * 4.1})`}>
                                            <circle r="8" fill="#f59e0b" stroke="white" strokeWidth="2" />
                                            <text y="4" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">S</text>
                                            <text y="-12" textAnchor="middle" fontSize="7" fill="#92400e" fontWeight="bold">Shop</text>
                                        </g>

                                        {/* ✅ CUSTOMER PINS */}
                                        {customerLocations.slice(0, 20).map((user, i) => {
                                            const pos = toMapPos(user.location.latitude, user.location.longitude);
                                            const x = 80 + pos.x * 2.45;
                                            const y = 20 + pos.y * 4.1;
                                            return (
                                                <g key={i} transform={`translate(${x}, ${y})`}>
                                                    <circle r="5" fill="#3b82f6" stroke="white" strokeWidth="1.5" opacity="0.85" />
                                                </g>
                                            );
                                        })}

                                        {/* City labels */}
                                        {[
                                            { name: "Delhi", lat: 28.6, lng: 77.2 },
                                            { name: "Mumbai", lat: 19.0, lng: 72.8 },
                                            { name: "Lucknow", lat: 26.8, lng: 80.9 },
                                            { name: "Kolkata", lat: 22.6, lng: 88.4 },
                                            { name: "Chennai", lat: 13.1, lng: 80.3 },
                                        ].map(({ name, lat, lng }) => {
                                            const pos = toMapPos(lat, lng);
                                            return (
                                                <text key={name}
                                                    x={80 + pos.x * 2.45}
                                                    y={20 + pos.y * 4.1 + 14}
                                                    textAnchor="middle"
                                                    fontSize="6"
                                                    fill="#64748b"
                                                    fontWeight="500"
                                                >
                                                    {name}
                                                </text>
                                            );
                                        })}
                                    </svg>
                                </div>
                            </div>

                            <p className="text-xs text-zinc-400 text-center mt-2">
                                🟡 Shop (Lucknow) &nbsp;|&nbsp; 🔵 Customers ({customerLocations.length})
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Quick Actions ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { to: "/admin/products", icon: <FaBox size={20} className="text-amber-500" />, label: "Manage Products", desc: "Add, edit, delete products", bg: "bg-amber-50 border-amber-200", linkColor: "text-amber-600 hover:text-amber-700" },
                        { to: "/admin/orders", icon: <FaClipboardList size={20} className="text-blue-500" />, label: "Manage Orders", desc: "Update order status, view details", bg: "bg-blue-50 border-blue-200", linkColor: "text-blue-600 hover:text-blue-700" },
                        { to: "/admin/products/new", icon: <FaPlus size={20} className="text-emerald-500" />, label: "Add New Product", desc: "Upload images, set price & category", bg: "bg-emerald-50 border-emerald-200", linkColor: "text-emerald-600 hover:text-emerald-700" },
                    ].map(({ to, icon, label, desc, bg, linkColor }) => (
                        <Link key={to} to={to}
                            className={`group bg-white border ${bg} rounded-2xl p-5 hover:shadow-md transition-all duration-200 flex flex-col gap-3`}>
                            <div className="w-10 h-10 bg-white rounded-xl border border-stone-200 flex items-center justify-center shadow-sm">{icon}</div>
                            <div>
                                <p className="font-bold text-zinc-800 text-sm">{label}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold ${linkColor} mt-auto`}>
                                Go <FaArrowRight size={9} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>

                {/* ── Recent Orders ── */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                        <h2 className="font-black text-zinc-800 text-sm">Recent Orders</h2>
                        <Link to="/admin/orders" className="text-xs text-amber-600 font-bold hover:text-amber-700 flex items-center gap-1">
                            View all <FaArrowRight size={9} />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-stone-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : recentOrders.length === 0 ? (
                        <div className="py-12 text-center">
                            <FaShoppingBag size={28} className="text-stone-300 mx-auto mb-2" />
                            <p className="text-zinc-400 text-sm">No orders yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {recentOrders.map(order => {
                                const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED;
                                return (
                                    <div key={order._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                                                <FaShoppingBag size={12} className="text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-zinc-800 text-sm">#{order._id.slice(-6).toUpperCase()}</p>
                                                <p className="text-xs text-zinc-400">{order.customerName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                {cfg.label}
                                            </span>
                                            <p className="font-black text-emerald-600 text-sm">₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;