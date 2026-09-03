/**
 * AdminContactQueries.jsx
 * Dedicated page for managing contact queries / customer messages
 */
import { useEffect, useState, useCallback } from "react";
import api from "../api/adminApi";
import {
    FaEnvelope, FaEnvelopeOpen, FaSync, FaSearch,
    FaPhone, FaUser, FaTag, FaTimesCircle, FaWhatsapp,
    FaCheck, FaClock, FaChevronDown, FaChevronUp,
    FaTrash, FaExclamationCircle,
} from "react-icons/fa";

const AdminContactQueries = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all"); // 'all' | 'unread' | 'read'
    const [expandedId, setExpandedId] = useState(null);

    const fetchQueries = useCallback(async () => {
        try {
            setError("");
            setLoading(true);
            const { data } = await api.get("/contact");
            setQueries(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.status === 403
                ? "Access denied."
                : "Failed to load contact queries.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchQueries(); }, [fetchQueries]);

    const refresh = async () => {
        setRefreshing(true);
        await fetchQueries();
        setRefreshing(false);
    };

    const markAsRead = async (id) => {
        const query = queries.find(q => q._id === id);
        if (!query || query.isRead) return;
        setQueries(prev => prev.map(q => q._id === id ? { ...q, isRead: true } : q));
        try {
            await api.patch(`/contact/${id}/read`);
        } catch { /* rollback */
            setQueries(prev => prev.map(q => q._id === id ? { ...q, isRead: false } : q));
        }
    };

    const filtered = queries.filter(q => {
        const matchFilter = filter === "all" || (filter === "unread" && !q.isRead) || (filter === "read" && q.isRead);
        if (!matchFilter) return false;
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return q.name?.toLowerCase().includes(s) || q.email?.toLowerCase().includes(s) || q.subject?.toLowerCase().includes(s) || q.message?.toLowerCase().includes(s);
    });

    const unreadCount = queries.filter(q => !q.isRead).length;

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-zinc-400 text-xs font-bold">Loading contact queries...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] py-6 font-sans">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-zinc-900">Contact Queries</h1>
                            {unreadCount > 0 && (
                                <span className="bg-red-100 text-red-700 border border-red-200 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>
                        <p className="text-zinc-500 text-xs mt-0.5">Customer messages from the contact form.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <FaSearch size={11} className="absolute left-3 top-3 text-zinc-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search queries..."
                                className="pl-8 pr-8 py-2 border border-stone-200 rounded-xl text-xs bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400 w-48 transition-all"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700">
                                    <FaTimesCircle size={11} />
                                </button>
                            )}
                        </div>
                        <button onClick={refresh} disabled={refreshing}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 text-zinc-700 rounded-xl text-xs font-bold hover:bg-stone-50 transition-all cursor-pointer shadow-xs">
                            <FaSync size={10} className={refreshing ? "animate-spin text-amber-500" : ""} />
                            Sync
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-5">
                    {[
                        { key: "all", label: `All (${queries.length})` },
                        { key: "unread", label: `Unread (${unreadCount})` },
                        { key: "read", label: `Read (${queries.length - unreadCount})` },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${filter === tab.key
                                ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                                : "bg-white text-zinc-600 border-stone-200 hover:border-stone-300"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 mb-4">
                        <FaExclamationCircle /> {error}
                    </div>
                )}

                {filtered.length === 0 && !loading && (
                    <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center">
                        <FaEnvelope size={32} className="text-stone-300 mx-auto mb-3" />
                        <p className="text-zinc-700 font-bold text-sm">No queries found</p>
                        <p className="text-zinc-400 text-xs mt-1">
                            {filter === "unread" ? "No unread messages. You're all caught up! ✅" : "No messages in this category."}
                        </p>
                    </div>
                )}

                {/* Query List */}
                <div className="space-y-3">
                    {filtered.map(q => {
                        const isExpanded = expandedId === q._id;
                        return (
                            <div
                                key={q._id}
                                className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all ${!q.isRead ? "border-amber-300 ring-1 ring-amber-300/20" : isExpanded ? "border-zinc-300" : "border-stone-200"}`}
                            >
                                <div
                                    onClick={() => {
                                        setExpandedId(isExpanded ? null : q._id);
                                        if (!q.isRead) markAsRead(q._id);
                                    }}
                                    className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-stone-50/60 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${q.isRead ? "bg-stone-100 text-stone-500" : "bg-amber-100 text-amber-600"}`}>
                                            {q.isRead ? <FaEnvelopeOpen size={14} /> : <FaEnvelope size={14} />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className={`text-sm truncate ${!q.isRead ? "font-black text-zinc-900" : "font-bold text-zinc-700"}`}>
                                                    {q.name || "Customer"}
                                                </p>
                                                {!q.isRead && (
                                                    <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shrink-0">NEW</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                                                {q.subject || "No Subject"} · {q.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-zinc-400 hidden sm:block">
                                            <FaClock size={9} className="inline mr-1" />
                                            {new Date(q.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                        {isExpanded ? <FaChevronUp size={10} className="text-zinc-400" /> : <FaChevronDown size={10} className="text-zinc-400" />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-stone-100 p-4 sm:p-5 bg-stone-50/50 space-y-4">
                                        {/* Contact Info */}
                                        <div className="grid sm:grid-cols-3 gap-3 text-xs">
                                            <div className="flex items-center gap-2 text-zinc-700">
                                                <FaUser size={10} className="text-amber-500" /> {q.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-700">
                                                <FaEnvelope size={10} className="text-amber-500" />
                                                <a href={`mailto:${q.email}`} className="text-blue-600 hover:underline">{q.email}</a>
                                            </div>
                                            {q.phone && (
                                                <div className="flex items-center gap-2">
                                                    <FaPhone size={10} className="text-amber-500" />
                                                    <a href={`https://wa.me/91${q.phone}`} target="_blank" rel="noreferrer"
                                                        className="flex items-center gap-1 text-emerald-700 hover:underline font-bold">
                                                        <FaWhatsapp size={11} /> {q.phone}
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {/* Subject */}
                                        {q.subject && (
                                            <div className="bg-white rounded-xl border border-stone-200 p-3">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <FaTag size={8} /> Subject
                                                </p>
                                                <p className="text-xs font-bold text-zinc-800">{q.subject}</p>
                                            </div>
                                        )}

                                        {/* Message */}
                                        <div className="bg-white rounded-xl border border-stone-200 p-3">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Message</p>
                                            <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">{q.message}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-wrap pt-1">
                                            <a
                                                href={`mailto:${q.email}?subject=Re: ${encodeURIComponent(q.subject || "Your Inquiry")} — RV Gift Shop`}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                                            >
                                                <FaEnvelope size={10} /> Reply via Email
                                            </a>
                                            {q.phone && (
                                                <a
                                                    href={`https://wa.me/91${q.phone}?text=${encodeURIComponent(`Hi ${q.name}, thank you for contacting RV Gift Shop! Regarding your query: "${q.subject || "your inquiry"}" — `)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                                                >
                                                    <FaWhatsapp size={10} /> WhatsApp Reply
                                                </a>
                                            )}
                                            {!q.isRead && (
                                                <button
                                                    onClick={() => markAsRead(q._id)}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                                >
                                                    <FaCheck size={10} /> Mark as Read
                                                </button>
                                            )}
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

export default AdminContactQueries;
