import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import api from "../api/adminApi";
import {
    FaBox, FaClipboardList, FaPlus, FaRupeeSign,
    FaShoppingBag, FaTruck, FaCheckCircle, FaClock,
    FaArrowRight, FaFire, FaMapMarkerAlt, FaCashRegister,
    FaEnvelope, FaEnvelopeOpen, FaPhone, FaTag,
} from "react-icons/fa";
import SecuritySection from "../pages/SecuritySection";

// ══════════════════════════════════════════════
// MAP HELPERS
// ══════════════════════════════════════════════

// FIX 1: Proper bounding box tightly scoped to India.
// Previous version used minLat:8/maxLat:37 which is correct, but SVG transform
// multipliers (2.45 / 4.1) were hand-tuned magic numbers that drift with viewBox.
// Now we convert lat/lng → SVG coords using explicit SVG width/height constants
// so the math is always correct regardless of viewBox changes.

const SVG_W = 400;
const SVG_H = 450;
const SVG_PAD = { top: 20, right: 20, bottom: 20, left: 20 }; // inner drawable area

const INDIA_BOUNDS = { minLat: 8.0, maxLat: 37.5, minLng: 68.0, maxLng: 97.5 };

/**
 * Converts (lat, lng) → { x, y } in SVG pixel space.
 * Uses a simple equirectangular projection which is accurate enough
 * for a dashboard overview map.
 */
const toMapPos = (lat, lng) => {
    const drawW = SVG_W - SVG_PAD.left - SVG_PAD.right;
    const drawH = SVG_H - SVG_PAD.top - SVG_PAD.bottom;

    const x = SVG_PAD.left + ((lng - INDIA_BOUNDS.minLng) / (INDIA_BOUNDS.maxLng - INDIA_BOUNDS.minLng)) * drawW;
    // Latitude is inverted: higher lat = smaller y (top of map)
    const y = SVG_PAD.top + ((INDIA_BOUNDS.maxLat - lat) / (INDIA_BOUNDS.maxLat - INDIA_BOUNDS.minLat)) * drawH;

    return { x, y };
};

const SHOP_LAT = 26.8467;
const SHOP_LNG = 80.9462;

// ══════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════
const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [customerLocations, setCustomerLocations] = useState([]);
    const [cityStats, setCityStats] = useState([]);

    // FIX 2: Granular loading states per section so skeleton screens
    // are accurate — previously a single `loading` flag hid the 401 issue
    // because everything stayed "loading" when the session expired.
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingPos, setLoadingPos] = useState(true);

    const [fetchError, setFetchError] = useState(null);
    const [posStats, setPosStats] = useState(null);

    // FIX 3: Track auth/session state explicitly
    const [sessionExpired, setSessionExpired] = useState(false);

    // ── Queries State ──
    const [queries, setQueries] = useState([]);
    const [queriesLoading, setQueriesLoading] = useState(true);
    const [expandedQuery, setExpandedQuery] = useState(null);

    // Prevent stale setState calls if component unmounts during fetch
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setFetchError(null);
            setSessionExpired(false);

            // ── FIX 3: Per-request 401 detection ──
            // Previously the catch block swallowed 401 globally, leaving the UI
            // in a perpetual loading skeleton. Now each request is checked
            // individually; a 401 on any request triggers a session-expired banner
            // while the rest of the data still loads.
            // onFinally = optional extra callback (e.g. setQueriesLoading(false))
            // so loading state is ALWAYS cleared even if the request fails.
            const safeGet = async (url, onSuccess, setLoading, onFinally) => {
                try {
                    const res = await api.get(url);
                    if (isMounted.current) onSuccess(res?.data);
                } catch (err) {
                    if (err?.response?.status === 401) {
                        // 401 means token expired / not authenticated.
                        // Show a dedicated banner instead of staying stuck on skeleton.
                        if (isMounted.current) setSessionExpired(true);
                    } else if (isMounted.current) {
                        setFetchError("Kuch data load nahi hua. Refresh karo.");
                    }
                } finally {
                    if (isMounted.current) {
                        if (setLoading) setLoading(false);
                        if (onFinally) onFinally(); // ← queriesLoading & other extras
                    }
                }
            };

            // Fire all requests in parallel; each handles its own loading/error state.
            await Promise.all([
                safeGet("/orders", (data) => {
                    const list = Array.isArray(data) ? data : [];
                    const delivered = list.filter(o => o.orderStatus === "DELIVERED");
                    const pending = list.filter(o => o.orderStatus === "PLACED");
                    const revenue = delivered.reduce((s, o) => s + (o.totalAmount || 0), 0);

                    setStats({
                        totalOrders: list.length,
                        revenue,
                        pending: pending.length,
                        delivered: delivered.length,
                        inTransit: list.filter(o => ["SHIPPED", "OUT_FOR_DELIVERY"].includes(o.orderStatus)).length,
                    });
                    setRecentOrders(list.slice(0, 5));
                }, setLoadingOrders),

                safeGet("/products", (data) => {
                    const prodList = Array.isArray(data) ? data : [];
                    setStats(prev => prev ? { ...prev, totalProducts: prodList.length } : { totalProducts: prodList.length });
                }, setLoadingProducts),

                safeGet("/auth/users", (data) => {
                    const userList = Array.isArray(data) ? data : [];
                    const withLocation = userList.filter(u => u.location?.latitude && u.location?.city);
                    setCustomerLocations(withLocation);

                    const cityMap = {};
                    withLocation.forEach(u => {
                        const city = u.location.city;
                        cityMap[city] = (cityMap[city] || 0) + 1;
                    });
                    setCityStats(
                        Object.entries(cityMap)
                            .map(([city, count]) => ({ city, count }))
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 8)
                    );
                }, setLoadingUsers),

                safeGet("/walkin/stats", (data) => {
                    if (data) setPosStats(data);
                }, setLoadingPos),

                safeGet("/contact", (data) => {
                    if (Array.isArray(data)) setQueries(data);
                }, null, () => setQueriesLoading(false)), // always cleared via finally
            ]);
        };

        fetchData();
    }, []);

    // Combined loading flag for sections that depend on orders + products
    const loading = loadingOrders || loadingProducts || loadingUsers;

    const markAsRead = async (id) => {
        // Guard: already read hai toh API call skip karo (race condition fix)
        const query = queries.find(q => q._id === id);
        if (!query || query.isRead) return;

        // Optimistic update: UI turant respond kare, API ka wait nahi
        setQueries(prev => prev.map(q => q._id === id ? { ...q, isRead: true } : q));

        try {
            await api.patch(`/contact/${id}/read`);
        } catch {
            // Rollback: API fail hui toh wapas unread karo
            setQueries(prev => prev.map(q => q._id === id ? { ...q, isRead: false } : q));
        }
    };

    const unreadCount = queries.filter(q => !q.isRead).length;

    const STATUS_CFG = {
        PLACED: { label: "Placed", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
        CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-700", dot: "bg-blue-400" },
        PACKED: { label: "Packed", color: "bg-purple-100 text-purple-700", dot: "bg-purple-400" },
        SHIPPED: { label: "Shipped", color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-400" },
        OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-orange-100 text-orange-700", dot: "bg-orange-400" },
        DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    };

    const maxCount = cityStats[0]?.count || 1;
    const shopPos = toMapPos(SHOP_LAT, SHOP_LNG);

    const CITY_LABELS = [
        { name: "Delhi", lat: 28.6, lng: 77.2 },
        { name: "Mumbai", lat: 19.0, lng: 72.8 },
        { name: "Lucknow", lat: 26.8, lng: 80.9 },
        { name: "Kolkata", lat: 22.6, lng: 88.4 },
    ];

    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100%", background: "#F1F5F9" }}>
            {/* FIX 2: Keyframes kept in one place, no duplication */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0.45; }
                }
                .skeleton {
                    animation: pulse 1.5s ease-in-out infinite;
                    background: #E2E8F0;
                    border-radius: 10px;
                }
            `}</style>

            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 48px" }}>

                {/* ── Header ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: "#0F172A", lineHeight: 1 }}>
                            Dashboard
                        </h1>
                        <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 5 }}>
                            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Link to="/admin/pos" style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "9px 16px", borderRadius: 10,
                            background: "#1E293B", color: "#fff",
                            fontWeight: 700, fontSize: 13, textDecoration: "none",
                        }}>
                            <FaCashRegister size={12} /> Shop POS
                        </Link>
                        <Link to="/admin/products/new" style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "9px 16px", borderRadius: 10,
                            background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#fff",
                            fontWeight: 700, fontSize: 13, textDecoration: "none",
                            boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
                        }}>
                            <FaPlus size={11} /> Add Product
                        </Link>
                    </div>
                </div>

                {/* ── FIX 3: Session expired banner (replaces silent loading) ── */}
                {sessionExpired && (
                    <div style={{
                        background: "#FFF7ED", border: "1px solid #FED7AA", color: "#C2410C",
                        padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                        marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <span>⚠️ Session expire ho gayi. Dobara login karo.</span>
                        <Link to="/admin/login" style={{
                            background: "#EA580C", color: "#fff", padding: "6px 14px",
                            borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none",
                        }}>
                            Login
                        </Link>
                    </div>
                )}

                {/* Generic error */}
                {fetchError && (
                    <div style={{
                        background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626",
                        padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 500, marginBottom: 20,
                    }}>
                        ⚠️ {fetchError}
                    </div>
                )}

                {/* ── Stats ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 12 }}>
                    {loading ? (
                        [0, 1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: 90 }} />
                        ))
                    ) : [
                        { label: "Total Revenue", value: `₹${(stats?.revenue || 0).toLocaleString("en-IN")}`, icon: <FaRupeeSign size={13} />, accent: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
                        { label: "Total Orders", value: stats?.totalOrders || 0, icon: <FaShoppingBag size={13} />, accent: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
                        { label: "Products", value: stats?.totalProducts || 0, icon: <FaBox size={13} />, accent: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
                        { label: "Pending Orders", value: stats?.pending || 0, icon: <FaClock size={13} />, accent: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
                    ].map(({ label, value, icon, accent, bg, border }) => (
                        <div key={label} style={{
                            background: "#fff", border: `1px solid ${border}`,
                            borderRadius: 14, padding: "16px 18px",
                            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{label}</span>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 8, background: bg,
                                    display: "flex", alignItems: "center", justifyContent: "center", color: accent,
                                }}>{icon}</div>
                            </div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: accent }}>
                                {value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Status Row ── */}
                {!loading && stats && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                        {[
                            { label: "Delivered", value: stats.delivered, icon: <FaCheckCircle size={13} />, accent: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
                            { label: "In Transit", value: stats.inTransit, icon: <FaTruck size={13} />, accent: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE" },
                            { label: "New Orders", value: stats.pending, icon: <FaFire size={13} />, accent: "#F97316", bg: "#FFF7ED", border: "#FED7AA" },
                        ].map(({ label, value, icon, accent, bg, border }) => (
                            <div key={label} style={{
                                background: "#fff", border: `1px solid ${border}`,
                                borderRadius: 14, padding: "14px 18px",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                            }}>
                                <div>
                                    <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{label}</div>
                                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: accent, marginTop: 2 }}>{value}</div>
                                </div>
                                <div style={{ color: accent, opacity: 0.5 }}>{icon}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── POS Banner ── */}
                {loadingPos ? (
                    <div className="skeleton" style={{ height: 90, marginBottom: 20 }} />
                ) : posStats && (
                    <div style={{
                        background: "#0F172A", borderRadius: 16, padding: "20px 24px",
                        display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center",
                        justifyContent: "space-between", marginBottom: 20,
                        border: "1px solid rgba(245,158,11,0.15)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 42, height: 42, borderRadius: 12,
                                background: "linear-gradient(135deg,#F59E0B,#D97706)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
                            }}>
                                <FaCashRegister size={17} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 600 }}>Shop POS — Today</div>
                                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: "#fff" }}>Walk-in Billing</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 28 }}>
                            {[
                                { label: "Today's Bills", value: posStats.todayBills, color: "#fff" },
                                { label: "Today's Revenue", value: `₹${Number(posStats.todayRevenue || 0).toLocaleString("en-IN")}`, color: "#F59E0B" },
                                { label: "Total Revenue", value: `₹${Number(posStats.totalRevenue || 0).toLocaleString("en-IN")}`, color: "#10B981" },
                            ].map(({ label, value, color }) => (
                                <div key={label}>
                                    <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 600 }}>{label}</div>
                                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color }}>{value}</div>
                                </div>
                            ))}
                        </div>
                        <Link to="/admin/pos" style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "10px 18px", borderRadius: 10,
                            background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#fff",
                            fontWeight: 700, fontSize: 13, textDecoration: "none",
                            boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
                        }}>
                            Open POS <FaArrowRight size={10} />
                        </Link>
                    </div>
                )}

                {/* ── Map + City + Security ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 320px", gap: 16, marginBottom: 20 }}>

                    {/* City Stats */}
                    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                        <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
                            <FaMapMarkerAlt size={12} color="#F59E0B" />
                            <span style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>Customers by City</span>
                            <span style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8" }}>{customerLocations.length} tracked</span>
                        </div>
                        <div style={{ padding: "16px 18px" }}>
                            {loadingUsers ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="skeleton" style={{ height: 28 }} />
                                    ))}
                                </div>
                            ) : cityStats.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "28px 0" }}>
                                    <FaMapMarkerAlt size={26} style={{ margin: "0 auto 8px", color: "#CBD5E1", display: "block" }} />
                                    <p style={{ fontSize: 13, color: "#94A3B8" }}>No location data yet</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {cityStats.map(({ city, count }) => (
                                        <div key={city}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{city}</span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B" }}>{count} customer{count > 1 ? "s" : ""}</span>
                                            </div>
                                            <div style={{ height: 6, background: "#F1F5F9", borderRadius: 10, overflow: "hidden" }}>
                                                <div style={{
                                                    height: "100%", borderRadius: 10,
                                                    background: "linear-gradient(90deg,#F59E0B,#D97706)",
                                                    width: `${(count / maxCount) * 100}%`,
                                                    transition: "width 0.6s ease",
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── FIX 1: Customer Map — accurate projection ── */}
                    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                        <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
                            <FaMapMarkerAlt size={12} color="#EF4444" />
                            <span style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>Customer Map</span>
                            <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
                                {[{ color: "#F59E0B", label: "Shop" }, { color: "#3B82F6", label: "Customer" }].map(({ color, label }) => (
                                    <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#94A3B8" }}>
                                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} /> {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div style={{ padding: 12 }}>
                            {loadingUsers ? (
                                <div className="skeleton" style={{ paddingBottom: "90%", borderRadius: 10 }} />
                            ) : (
                                // viewBox matches SVG_W × SVG_H so toMapPos coords land correctly
                                <svg
                                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                                    style={{ width: "100%", display: "block", background: "#F0F9FF", borderRadius: 10 }}
                                    aria-label="India customer map"
                                >
                                    {/* India outline (simplified) */}
                                    <path
                                        d="M160,20 L200,15 L240,25 L270,40 L290,70 L300,100 L310,130
                                           L320,160 L315,190 L310,220 L300,250 L285,275 L265,295
                                           L250,320 L240,345 L230,370 L220,390 L210,410 L200,425
                                           L190,410 L180,390 L170,365 L158,340 L145,315 L130,290
                                           L115,265 L105,240 L95,210 L88,180 L85,150 L88,120
                                           L95,95 L110,70 L130,50 L160,20 Z"
                                        fill="#E0F2FE" stroke="#94A3B8" strokeWidth="1.5"
                                    />

                                    {/* Grid lines */}
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <line key={`h${i}`}
                                            x1={SVG_PAD.left} y1={SVG_PAD.top + i * 80}
                                            x2={SVG_W - SVG_PAD.right} y2={SVG_PAD.top + i * 80}
                                            stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="4,4"
                                        />
                                    ))}
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <line key={`v${i}`}
                                            x1={SVG_PAD.left + i * 72} y1={SVG_PAD.top}
                                            x2={SVG_PAD.left + i * 72} y2={SVG_H - SVG_PAD.bottom}
                                            stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="4,4"
                                        />
                                    ))}

                                    {/* City name labels */}
                                    {CITY_LABELS.map(({ name, lat, lng }) => {
                                        const p = toMapPos(lat, lng);
                                        return (
                                            <text key={name} x={p.x} y={p.y + 14}
                                                textAnchor="middle" fontSize="7" fill="#64748B" fontWeight="500">
                                                {name}
                                            </text>
                                        );
                                    })}

                                    {/* Customer dots — capped at 40 for performance */}
                                    {customerLocations.slice(0, 40).map((user, i) => {
                                        const p = toMapPos(user.location.latitude, user.location.longitude);
                                        return (
                                            <circle key={i} cx={p.x} cy={p.y}
                                                r="5" fill="#3B82F6" stroke="white" strokeWidth="1.5" opacity="0.85"
                                            />
                                        );
                                    })}

                                    {/* Shop marker — rendered last so it's always on top */}
                                    <g transform={`translate(${shopPos.x},${shopPos.y})`}>
                                        <circle r="9" fill="#F59E0B" stroke="white" strokeWidth="2" />
                                        <text y="4" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">S</text>
                                        <text y="-13" textAnchor="middle" fontSize="7" fill="#92400E" fontWeight="bold">Shop</text>
                                    </g>
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Security Section */}
                    <SecuritySection />
                </div>

                {/* ── Quick Actions ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 20 }}>
                    {[
                        { to: "/admin/products", icon: <FaBox size={18} />, label: "Products", desc: "Add, edit, delete", accent: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
                        { to: "/admin/orders", icon: <FaClipboardList size={18} />, label: "Orders", desc: "Update status", accent: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
                        { to: "/admin/products/new", icon: <FaPlus size={18} />, label: "Add Product", desc: "Upload & set pricing", accent: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
                        { to: "/admin/pos", icon: <FaCashRegister size={18} />, label: "Shop POS", desc: "Walk-in billing", accent: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE" },
                    ].map(({ to, icon, label, desc, accent, bg, border }) => (
                        <Link key={to} to={to} style={{
                            background: "#fff", border: `1px solid ${border}`,
                            borderRadius: 14, padding: "18px 16px",
                            textDecoration: "none", display: "flex", flexDirection: "column", gap: 10,
                            transition: "box-shadow 0.15s", boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                        }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)"}
                        >
                            <div style={{
                                width: 38, height: 38, borderRadius: 10, background: bg,
                                display: "flex", alignItems: "center", justifyContent: "center", color: accent,
                            }}>{icon}</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{label}</div>
                                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{desc}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: accent, marginTop: "auto" }}>
                                Open <FaArrowRight size={8} />
                            </div>
                        </Link>
                    ))}
                </div>

                {/* ── Customer Queries ── */}
                <div style={{
                    background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0",
                    overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: 20,
                }}>
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 20px", borderBottom: "1px solid #F1F5F9",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <FaEnvelope size={13} color="#8B5CF6" />
                            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: "#0F172A" }}>
                                Customer Queries
                            </span>
                            {unreadCount > 0 && (
                                <span style={{
                                    background: "#EF4444", color: "#fff",
                                    fontSize: 10, fontWeight: 800,
                                    padding: "2px 7px", borderRadius: 20,
                                }}>
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>{queries.length} total</span>
                    </div>

                    {queriesLoading ? (
                        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} className="skeleton" style={{ height: 56 }} />
                            ))}
                        </div>
                    ) : queries.length === 0 ? (
                        <div style={{ padding: "40px 0", textAlign: "center" }}>
                            <FaEnvelope size={26} style={{ margin: "0 auto 8px", color: "#CBD5E1", display: "block" }} />
                            <p style={{ fontSize: 13, color: "#94A3B8" }}>No queries yet</p>
                        </div>
                    ) : (
                        queries.slice(0, 10).map(query => {
                            const isExpanded = expandedQuery === query._id;
                            return (
                                <div key={query._id} style={{
                                    borderBottom: "1px solid #F8FAFC",
                                    background: query.isRead ? "transparent" : "#FDFAF6",
                                    transition: "background 0.15s",
                                }}>
                                    <div
                                        onClick={() => {
                                            setExpandedQuery(isExpanded ? null : query._id);
                                            if (!query.isRead) markAsRead(query._id);
                                        }}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 12,
                                            padding: "12px 20px", cursor: "pointer",
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        <div style={{
                                            width: 36, height: 36, borderRadius: "50%",
                                            background: query.isRead ? "#F1F5F9" : "#EDE9FE",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            {query.isRead
                                                ? <FaEnvelopeOpen size={13} color="#94A3B8" />
                                                : <FaEnvelope size={13} color="#8B5CF6" />
                                            }
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                <span style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{query.name}</span>
                                                {!query.isRead && (
                                                    <span style={{
                                                        width: 7, height: 7, borderRadius: "50%",
                                                        background: "#8B5CF6", display: "inline-block",
                                                    }} />
                                                )}
                                                {query.subject && (
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, color: "#F59E0B",
                                                        background: "#FFFBEB", border: "1px solid #FDE68A",
                                                        padding: "1px 7px", borderRadius: 20,
                                                        display: "flex", alignItems: "center", gap: 3,
                                                    }}>
                                                        <FaTag size={7} /> {query.subject}
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{
                                                fontSize: 11, color: "#64748B", marginTop: 2,
                                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                maxWidth: 400,
                                            }}>
                                                {query.message}
                                            </p>
                                        </div>

                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontSize: 10, color: "#94A3B8" }}>
                                                {new Date(query.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                            </div>
                                            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                                                {new Date(query.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div style={{
                                            margin: "0 20px 14px",
                                            background: "#F8FAFC", border: "1px solid #E2E8F0",
                                            borderRadius: 12, padding: "14px 16px",
                                        }}>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 12 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569" }}>
                                                    <FaEnvelope size={10} color="#8B5CF6" />
                                                    <a href={`mailto:${query.email}`} style={{ color: "#8B5CF6", fontWeight: 600, textDecoration: "none" }}>
                                                        {query.email}
                                                    </a>
                                                </div>
                                                {query.phone && (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569" }}>
                                                        <FaPhone size={10} color="#10B981" />
                                                        <a href={`tel:${query.phone}`} style={{ color: "#10B981", fontWeight: 600, textDecoration: "none" }}>
                                                            {query.phone}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            <p style={{
                                                fontSize: 13, color: "#334155", lineHeight: 1.6,
                                                background: "#fff", padding: "10px 12px", borderRadius: 8,
                                                border: "1px solid #E2E8F0",
                                            }}>
                                                {query.message}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── Recent Orders ── */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #F1F5F9" }}>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: "#0F172A" }}>Recent Orders</span>
                        <Link to="/admin/orders" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#F59E0B", textDecoration: "none" }}>
                            View all <FaArrowRight size={9} />
                        </Link>
                    </div>
                    {loadingOrders ? (
                        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                            {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
                        </div>
                    ) : recentOrders.length === 0 ? (
                        <div style={{ padding: "40px 0", textAlign: "center" }}>
                            <FaShoppingBag size={26} style={{ margin: "0 auto 8px", color: "#CBD5E1", display: "block" }} />
                            <p style={{ fontSize: 13, color: "#94A3B8" }}>No orders yet</p>
                        </div>
                    ) : recentOrders.map(order => {
                        const cfg = STATUS_CFG[order.orderStatus] || STATUS_CFG.PLACED;
                        return (
                            <div key={order._id} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "12px 20px", borderBottom: "1px solid #F8FAFC",
                                transition: "background 0.12s", cursor: "default",
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: "50%",
                                        background: "#FFFBEB", border: "1px solid #FDE68A",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <FaShoppingBag size={12} color="#F59E0B" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>
                                            #{order._id.slice(-6).toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{order.customerName}</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.color}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                        {cfg.label}
                                    </span>
                                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: "#10B981" }}>
                                        ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;