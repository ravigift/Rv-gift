/**
 * AdminCustomers.jsx
 * Full customer management page for admin panel
 */
import { useEffect, useState, useCallback } from "react";
import api from "../api/adminApi";
import {
    FaUsers, FaSync, FaSearch, FaUser, FaEnvelope,
    FaPhone, FaMapMarkerAlt, FaTimesCircle, FaShoppingBag,
    FaChevronDown, FaChevronUp, FaCheck, FaBan,
    FaCalendarAlt, FaWhatsapp,
} from "react-icons/fa";

const PAGE_SIZE = 15;

const AdminCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const paginated = filtered.slice(pageStart, pageStart + PAGE_SIZE);

    const fetchCustomers = useCallback(async () => {
        try {
            setError("");
            setLoading(true);
            const { data } = await api.get("/auth/users");
            const list = Array.isArray(data) ? data : [];
            setCustomers(list);
            setFiltered(list);
        } catch (err) {
            setError(err.response?.status === 403
                ? "Access denied. Owner permission required."
                : "Failed to load customers.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    useEffect(() => {
        setCurrentPage(1);
        if (!search.trim()) return setFiltered(customers);
        const q = search.toLowerCase();
        setFiltered(customers.filter(c =>
            c.name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.phone?.includes(q) ||
            c.location?.city?.toLowerCase().includes(q)
        ));
    }, [search, customers]);

    const refresh = async () => {
        setRefreshing(true);
        await fetchCustomers();
        setRefreshing(false);
    };

    const totalCustomers = customers.length;
    const verifiedCount = customers.filter(c => c.isEmailVerified).length;
    const withPhone = customers.filter(c => c.phone).length;
    const withLocation = customers.filter(c => c.location?.city).length;

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-zinc-400 text-xs font-bold">Loading customers...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="text-center bg-white rounded-2xl p-8 border border-stone-200 shadow-sm max-w-sm w-full">
                <FaBan className="text-red-500 text-3xl mx-auto mb-3" />
                <p className="text-zinc-800 font-bold text-sm mb-4">{error}</p>
                <button onClick={fetchCustomers} className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 cursor-pointer">
                    Retry
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] py-6 font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-zinc-900">Customers</h1>
                            <span className="bg-blue-100 text-blue-800 text-[11px] font-black px-2.5 py-0.5 rounded-full">{totalCustomers} Total</span>
                        </div>
                        <p className="text-zinc-500 text-xs mt-0.5">All registered customers of RV Gift Shop.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <form onSubmit={e => e.preventDefault()} className="relative">
                            <FaSearch size={11} className="absolute left-3 top-3 text-zinc-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search name, email, city..."
                                className="pl-8 pr-8 py-2 border border-stone-200 rounded-xl text-xs bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400 w-52 transition-all"
                            />
                            {search && (
                                <button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700">
                                    <FaTimesCircle size={11} />
                                </button>
                            )}
                        </form>
                        <button onClick={refresh} disabled={refreshing}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 text-zinc-700 rounded-xl text-xs font-bold hover:bg-stone-50 transition-all disabled:opacity-50 cursor-pointer shadow-xs">
                            <FaSync size={10} className={refreshing ? "animate-spin text-amber-500" : ""} />
                            {refreshing ? "Syncing..." : "Sync"}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: "Total Registered", value: totalCustomers, color: "text-zinc-900", bg: "bg-white" },
                        { label: "Email Verified", value: verifiedCount, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "With Phone", value: withPhone, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "With Location", value: withLocation, color: "text-amber-600", bg: "bg-amber-50" },
                    ].map(stat => (
                        <div key={stat.label} className={`${stat.bg} rounded-2xl border border-stone-200 p-4 shadow-xs`}>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{stat.label}</p>
                            <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {paginated.length === 0 && (
                    <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center">
                        <FaUsers size={36} className="text-stone-300 mx-auto mb-3" />
                        <p className="text-zinc-700 font-bold text-sm">No customers found</p>
                        <p className="text-zinc-400 text-xs mt-1">Try adjusting your search term.</p>
                    </div>
                )}

                {/* Customer List */}
                <div className="space-y-3">
                    {paginated.map(c => {
                        const isExpanded = expandedId === c._id;
                        return (
                            <div
                                key={c._id}
                                className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all ${isExpanded ? "border-amber-400 ring-1 ring-amber-400/20" : "border-stone-200 hover:border-stone-300"}`}
                            >
                                {/* Header Row */}
                                <div
                                    onClick={() => setExpandedId(isExpanded ? null : c._id)}
                                    className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-stone-50/60 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs shadow-amber-200">
                                            {c.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-zinc-900 text-sm truncate">{c.name || "—"}</p>
                                                {c.isEmailVerified
                                                    ? <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5"><FaCheck size={7} /> Verified</span>
                                                    : <span className="bg-red-50 border border-red-200 text-red-600 text-[9px] font-black px-1.5 py-0.2 rounded-full">Unverified</span>
                                                }
                                                {c.role === "admin" && <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-1.5 py-0.2 rounded-full">Admin</span>}
                                                {c.role === "owner" && <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded-full">Owner</span>}
                                            </div>
                                            <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                                                <FaEnvelope size={9} /> {c.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {c.phone && (
                                            <a
                                                href={`https://wa.me/91${c.phone}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-all"
                                            >
                                                <FaWhatsapp size={11} /> {c.phone}
                                            </a>
                                        )}
                                        {c.location?.city && (
                                            <span className="hidden sm:flex items-center gap-1 text-xs text-zinc-500 font-medium">
                                                <FaMapMarkerAlt size={10} className="text-amber-500" />
                                                {c.location.city}{c.location.state ? `, ${c.location.state}` : ""}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-zinc-400 hidden sm:block">
                                            {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                        {isExpanded ? <FaChevronUp size={10} className="text-zinc-400" /> : <FaChevronDown size={10} className="text-zinc-400" />}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-stone-100 p-4 bg-stone-50/50">
                                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                            <div className="bg-white rounded-xl border border-stone-200 p-3 space-y-2">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Account Info</p>
                                                <div className="flex items-center gap-2 text-zinc-700">
                                                    <FaUser size={10} className="text-amber-500" /> {c.name}
                                                </div>
                                                <div className="flex items-center gap-2 text-zinc-600">
                                                    <FaEnvelope size={10} className="text-amber-500" /> {c.email}
                                                </div>
                                                {c.phone && (
                                                    <div className="flex items-center gap-2 text-zinc-600">
                                                        <FaPhone size={10} className="text-amber-500" /> {c.phone}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-zinc-500">
                                                    <FaCalendarAlt size={10} className="text-amber-500" />
                                                    Joined: {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-xl border border-stone-200 p-3 space-y-2">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Location</p>
                                                {c.location?.city ? (
                                                    <>
                                                        <div className="flex items-center gap-2 text-zinc-700">
                                                            <FaMapMarkerAlt size={10} className="text-amber-500" />
                                                            {c.location.city}{c.location.state ? `, ${c.location.state}` : ""}
                                                        </div>
                                                        {c.location.latitude && (
                                                            <p className="text-zinc-400 text-[10px] font-mono">
                                                                {c.location.latitude.toFixed(4)}°N, {c.location.longitude?.toFixed(4)}°E
                                                            </p>
                                                        )}
                                                        {c.location.updatedAt && (
                                                            <p className="text-zinc-400 text-[10px]">
                                                                Updated: {new Date(c.location.updatedAt).toLocaleDateString("en-IN")}
                                                            </p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-zinc-400">No location data</p>
                                                )}
                                            </div>

                                            <div className="bg-white rounded-xl border border-stone-200 p-3 space-y-2">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Saved Addresses</p>
                                                {c.addresses?.length > 0 ? (
                                                    c.addresses.slice(0, 2).map((addr, i) => (
                                                        <div key={i} className="text-zinc-600 leading-relaxed">
                                                            <span className="font-bold">{addr.label || "Home"}: </span>
                                                            {addr.city}, {addr.state} - {addr.pincode}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-zinc-400">No saved addresses</p>
                                                )}
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
                            Showing <span className="font-bold text-zinc-800">{pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)}</span> of <span className="font-bold text-zinc-800">{filtered.length}</span> customers
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-stone-200 text-zinc-700 rounded-xl hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                                ← Prev
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1;
                                return (
                                    <button key={page} onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === page ? "bg-zinc-900 text-white" : "bg-white border border-stone-200 text-zinc-700 hover:bg-stone-50"}`}>
                                        {page}
                                    </button>
                                );
                            })}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-stone-200 text-zinc-700 rounded-xl hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCustomers;
