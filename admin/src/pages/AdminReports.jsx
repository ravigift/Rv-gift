import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/adminApi";
import {
    FaChartLine, FaRupeeSign, FaShoppingBag, FaUsers, FaBoxes,
    FaUndo, FaCashRegister, FaDownload, FaSyncAlt, FaArrowUp, FaArrowDown,
    FaExclamationTriangle,
} from "react-icons/fa";

const RANGES = [
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
    { key: "12m", label: "12 months" },
    { key: "all", label: "All time" },
];

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const compact = (n) => {
    n = Number(n || 0);
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + "Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + "L";
    if (n >= 1e3) return "₹" + (n / 1e3).toFixed(1) + "k";
    return "₹" + n;
};
const titleCase = (s) => String(s || "").replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

/* ── tiny dependency-free bar chart ── */
const BarChart = ({ data, valueKey = "revenue", height = 160 }) => {
    if (!data?.length) return <div className="text-xs text-zinc-400 py-8 text-center">No data for this period</div>;
    const max = Math.max(...data.map((d) => d[valueKey]), 1);
    const barW = Math.max(4, Math.min(28, Math.floor(680 / data.length) - 4));
    return (
        <div className="overflow-x-auto">
            <svg width={Math.max(680, data.length * (barW + 4))} height={height + 26} role="img" aria-label="Revenue trend">
                {data.map((d, i) => {
                    const h = Math.round((d[valueKey] / max) * height);
                    const x = i * (barW + 4);
                    return (
                        <g key={d.date}>
                            <rect x={x} y={height - h} width={barW} height={h} rx={3} fill="#f59e0b">
                                <title>{`${d.date} — ${inr(d.revenue)} · ${d.orders} orders`}</title>
                            </rect>
                            {(i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) && (
                                <text x={x + barW / 2} y={height + 16} textAnchor="middle" fontSize="9" fill="#9ca3af">
                                    {d.date.slice(5)}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

const Bars = ({ rows, labelKey, valueKey = "revenue", fmt = compact, color = "#3b82f6" }) => {
    if (!rows?.length) return <p className="text-xs text-zinc-400 py-4">No data</p>;
    const max = Math.max(...rows.map((r) => r[valueKey]), 1);
    return (
        <div className="space-y-2.5">
            {rows.map((r, i) => (
                <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-zinc-700 truncate pr-2">{titleCase(r[labelKey])}</span>
                        <span className="font-bold text-zinc-900 shrink-0">{fmt(r[valueKey])}</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(r[valueKey] / max) * 100}%`, background: color }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

const Delta = ({ value }) => {
    if (value === 0 || value == null) return <span className="text-[11px] text-zinc-400 font-semibold">±0%</span>;
    const up = value > 0;
    return (
        <span className={`text-[11px] font-bold inline-flex items-center gap-0.5 ${up ? "text-emerald-600" : "text-red-500"}`}>
            {up ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}{Math.abs(value)}%
        </span>
    );
};

const Kpi = ({ icon, label, value, delta, sub, accent = "#3B82F6", bg = "#EFF6FF" }) => (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg, color: accent }}>{icon}</div>
            {delta !== undefined && <Delta value={delta} />}
        </div>
        <div className="text-xl font-black text-zinc-900 leading-tight">{value}</div>
        <div className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wide mt-0.5">{label}</div>
        {sub && <div className="text-[11px] text-zinc-400 mt-0.5">{sub}</div>}
    </div>
);

const AdminReports = () => {
    const [range, setRange] = useState("30d");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [exporting, setExporting] = useState(false);

    const load = useCallback(async (rng) => {
        try {
            setLoading(true);
            setError("");
            const { data } = await api.get("/reports/overview", { params: { range: rng } });
            setData(data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load report");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(range); }, [range, load]);

    const exportCsv = async () => {
        try {
            setExporting(true);
            const res = await api.get("/reports/export", { params: { range }, responseType: "blob" });
            const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `orders-${range}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            setError("Export failed");
        } finally {
            setExporting(false);
        }
    };

    const k = data?.kpis || {};
    const totalRevenue = useMemo(() => (k.revenue || 0) + (k.posRevenue || 0), [k]);

    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="max-w-6xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                        <FaChartLine size={15} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-zinc-900">Reports & Analytics</h1>
                        <p className="text-zinc-400 text-xs">
                            {data ? `Live data · generated ${new Date(data.generatedAt).toLocaleString("en-IN")}` : "Loading…"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => load(range)} disabled={loading}
                        className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center text-zinc-500 hover:text-zinc-800 hover:bg-stone-50 disabled:opacity-50 cursor-pointer">
                        <FaSyncAlt size={12} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button onClick={exportCsv} disabled={exporting || loading}
                        className="flex items-center gap-2 px-3.5 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold disabled:opacity-50 cursor-pointer">
                        <FaDownload size={11} /> {exporting ? "Exporting…" : "Export CSV"}
                    </button>
                </div>
            </div>

            {/* Range pills */}
            <div className="flex gap-2 mb-5 flex-wrap">
                {RANGES.map((r) => (
                    <button key={r.key} onClick={() => setRange(r.key)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${range === r.key ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200" : "bg-white text-zinc-600 border-stone-200 hover:border-amber-400"}`}>
                        {r.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                    <FaExclamationTriangle size={13} /> {error}
                </div>
            )}

            {loading && !data ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-24 bg-stone-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : data && (
                <>
                    {/* KPI grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <Kpi icon={<FaRupeeSign size={13} />} label="Online Revenue" value={compact(k.revenue)} delta={k.revenueDelta}
                            sub={`${k.orders} paid orders`} accent="#10B981" bg="#ECFDF5" />
                        <Kpi icon={<FaShoppingBag size={13} />} label="Orders Placed" value={k.placedOrders} delta={k.ordersDelta}
                            sub={`AOV ${inr(k.aov)}`} accent="#3B82F6" bg="#EFF6FF" />
                        <Kpi icon={<FaBoxes size={13} />} label="Units Sold" value={Number(k.units).toLocaleString("en-IN")}
                            accent="#F59E0B" bg="#FFFBEB" />
                        <Kpi icon={<FaUsers size={13} />} label="New Customers" value={k.newCustomers}
                            sub={`${k.buyers} active buyers`} accent="#06B6D4" bg="#ECFEFF" />
                        <Kpi icon={<FaCashRegister size={13} />} label="POS / Walk-in" value={compact(k.posRevenue)}
                            sub={`${k.posBills} bills`} accent="#8B5CF6" bg="#F5F3FF" />
                        <Kpi icon={<FaUndo size={13} />} label="Refunds" value={compact(k.refundAmount)}
                            sub={`${k.refundCount} processed`} accent="#EF4444" bg="#FEF2F2" />
                        <Kpi icon={<FaExclamationTriangle size={12} />} label="Flagged Orders" value={k.flaggedOrders}
                            accent="#F97316" bg="#FFF7ED" />
                        <Kpi icon={<FaRupeeSign size={13} />} label="Total Revenue" value={compact(totalRevenue)}
                            sub="online + POS" accent="#10B981" bg="#ECFDF5" />
                    </div>

                    {/* Revenue trend */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm mb-4">
                        <h2 className="text-sm font-black text-zinc-800 mb-3">Revenue Trend</h2>
                        <BarChart data={data.timeseries} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {/* Top products */}
                        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                            <h2 className="text-sm font-black text-zinc-800 mb-3">Top Products</h2>
                            {data.topProducts.length === 0 ? (
                                <p className="text-xs text-zinc-400 py-4">No sales yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {data.topProducts.map((p, i) => (
                                        <div key={p.id || i} className="flex items-center gap-3 text-xs">
                                            <span className="w-5 text-zinc-300 font-black">{i + 1}</span>
                                            <span className="flex-1 font-semibold text-zinc-700 truncate">{p.name}</span>
                                            <span className="text-zinc-400 shrink-0">{p.units} pcs</span>
                                            <span className="font-bold text-zinc-900 shrink-0 w-16 text-right">{compact(p.revenue)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Category breakdown */}
                        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                            <h2 className="text-sm font-black text-zinc-800 mb-3">Revenue by Category</h2>
                            <Bars rows={data.byCategory} labelKey="category" valueKey="revenue" color="#3b82f6" />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Status funnel */}
                        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                            <h2 className="text-sm font-black text-zinc-800 mb-3">Order Status</h2>
                            <Bars rows={data.statusFunnel.filter((s) => s.count > 0)} labelKey="status" valueKey="count"
                                fmt={(n) => n} color="#8b5cf6" />
                        </div>

                        {/* Payment split */}
                        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                            <h2 className="text-sm font-black text-zinc-800 mb-3">Payment Method</h2>
                            <Bars rows={data.paymentSplit} labelKey="method" valueKey="revenue" color="#10b981" />
                        </div>

                        {/* Top customers */}
                        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                            <h2 className="text-sm font-black text-zinc-800 mb-3">Top Customers</h2>
                            {data.topCustomers.length === 0 ? (
                                <p className="text-xs text-zinc-400 py-4">No data</p>
                            ) : (
                                <div className="space-y-2">
                                    {data.topCustomers.map((c, i) => (
                                        <div key={c.id || i} className="flex items-center gap-2 text-xs">
                                            <span className="w-4 text-zinc-300 font-black">{i + 1}</span>
                                            <span className="flex-1 font-semibold text-zinc-700 truncate">{c.name || "—"}</span>
                                            <span className="text-zinc-400 shrink-0">{c.orders}×</span>
                                            <span className="font-bold text-zinc-900 shrink-0">{compact(c.spend)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminReports;
