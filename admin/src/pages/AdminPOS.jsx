import { useState, useEffect, useCallback } from "react";
import api from "../api/adminApi";
import {
    FaPlus, FaTrash, FaFileInvoice, FaSync, FaSearch,
    FaUser, FaPhone, FaShoppingCart,
    FaCheckCircle, FaHistory, FaTimes, FaCalendarAlt,
    FaCashRegister, FaMobileAlt, FaCreditCard, FaBoxOpen,
    FaReceipt, FaRupeeSign, FaEnvelope, FaPaperPlane,
} from "react-icons/fa";

const GST_RATES = [0, 5, 12, 18, 28];
const PAYMENT_MODES = [
    { value: "CASH", label: "Cash", icon: <FaCashRegister size={14} />, color: "bg-emerald-500" },
    { value: "UPI", label: "UPI", icon: <FaMobileAlt size={14} />, color: "bg-purple-500" },
    { value: "CARD", label: "Card", icon: <FaCreditCard size={14} />, color: "bg-blue-500" },
];
const emptyItem = () => ({ name: "", qty: 1, price: "", gstPercent: 0 });
const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const pmBadge = (m) =>
    m === "CASH" ? "bg-emerald-100 text-emerald-700" :
        m === "UPI" ? "bg-purple-100 text-purple-700" :
            "bg-blue-100 text-blue-700";

// ── Toast ──────────────────────────────────────────────────────
const Toast = ({ toast }) => {
    if (!toast) return null;
    return (
        <div style={{
            position: "fixed", top: 24, right: 24, zIndex: 9999,
            display: "flex", alignItems: "center", gap: 10,
            padding: "13px 20px",
            background: toast.type === "success"
                ? "linear-gradient(135deg,#10b981,#059669)"
                : "linear-gradient(135deg,#ef4444,#dc2626)",
            color: "#fff", borderRadius: 14, fontWeight: 700, fontSize: 14,
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            animation: "slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)",
            minWidth: 240, fontFamily: "'DM Sans',sans-serif",
        }}>
            <span>{toast.type === "success" ? "✅" : "❌"}</span>
            {toast.msg}
        </div>
    );
};

// ── Email Modal ────────────────────────────────────────────────
const EmailModal = ({ bill, onClose, onSent }) => {
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const handleSend = async () => {
        if (!email.trim()) return setError("Email address required");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Invalid email address");
        setSending(true); setError("");
        try {
            await api.post(`/walkin/${bill._id}/email`, { email });
            onSent(email);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send email");
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center",
        }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: "#fff", borderRadius: 20, padding: 28,
                    width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                    animation: "popIn .3s cubic-bezier(.16,1,.3,1)",
                    fontFamily: "'DM Sans',sans-serif",
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <FaEnvelope size={16} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="font-black text-zinc-900 text-base">Email Invoice</p>
                            <p className="text-xs text-zinc-400">{bill.billNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-zinc-500 hover:bg-stone-200 transition cursor-pointer">
                        <FaTimes size={12} />
                    </button>
                </div>

                {/* Bill summary */}
                <div className="bg-stone-50 rounded-xl p-3 mb-4 text-sm">
                    <div className="flex justify-between mb-1">
                        <span className="text-zinc-500">Customer</span>
                        <span className="font-bold text-zinc-800">{bill.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Amount</span>
                        <span className="font-black text-emerald-600">{fmt(bill.grandTotal)}</span>
                    </div>
                </div>

                {/* Email input */}
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">
                    Send to Email Address
                </label>
                <div className="relative mb-3">
                    <FaEnvelope size={12} className="absolute left-3 top-3.5 text-zinc-400" />
                    <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(""); }}
                        placeholder="customer@example.com"
                        onKeyDown={e => e.key === "Enter" && handleSend()}
                        autoFocus
                        className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                    />
                </div>

                {error && (
                    <p className="text-xs text-red-500 font-semibold mb-3">⚠ {error}</p>
                )}

                <div className="flex gap-2">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-zinc-600 hover:bg-stone-50 transition cursor-pointer">
                        Cancel
                    </button>
                    <button onClick={handleSend} disabled={sending}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-black hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-60 cursor-pointer shadow-md shadow-amber-200">
                        {sending ? (
                            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                        ) : (
                            <><FaPaperPlane size={12} /> Send Invoice</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
const AdminPOS = () => {
    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [items, setItems] = useState([emptyItem()]);
    const [paymentMode, setPaymentMode] = useState("CASH");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [successBill, setSuccessBill] = useState(null);
    const [toast, setToast] = useState(null);

    const [tab, setTab] = useState("new");
    const [bills, setBills] = useState([]);
    const [loadingBills, setLoadingBills] = useState(false);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [stats, setStats] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [emailBill, setEmailBill] = useState(null); // modal target

    const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
    const totalGST = items.reduce((s, i) => {
        const amt = (Number(i.price) || 0) * (Number(i.qty) || 0);
        return s + (amt * (Number(i.gstPercent) || 0)) / 100;
    }, 0);
    const grandTotal = subtotal + totalGST;
    const itemCount = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3200);
    };

    const fetchBills = useCallback(async () => {
        setLoadingBills(true);
        try {
            const params = {};
            if (search.trim()) params.search = search.trim();
            if (dateFilter) params.date = dateFilter;
            const { data } = await api.get("/walkin", { params });
            setBills(Array.isArray(data) ? data : []);
        } catch { setBills([]); }
        finally { setLoadingBills(false); }
    }, [search, dateFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.get("/walkin/stats");
            setStats(data);
        } catch { }
    }, []);

    useEffect(() => {
        fetchStats();
        if (tab === "history") fetchBills();
    }, [tab, fetchBills, fetchStats]);

    const updateItem = (idx, field, value) =>
        setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
    const addItem = () => setItems(prev => [...prev, emptyItem()]);
    const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

    const handleSubmit = async () => {
        if (items.some(i => !i.name.trim())) return showToast("error", "All item names are required");
        if (items.some(i => !i.price || Number(i.price) < 0)) return showToast("error", "All item prices are required");
        setSubmitting(true);
        try {
            const { data } = await api.post("/walkin", {
                customerName: customerName.trim() || "Walk-in Customer",
                phone: phone.trim(),
                items: items.map(i => ({
                    name: i.name.trim(), qty: Number(i.qty),
                    price: Number(i.price), gstPercent: Number(i.gstPercent),
                })),
                paymentMode, note: note.trim(),
            });
            setSuccessBill(data);
            fetchStats();
        } catch (err) {
            showToast("error", err.response?.data?.message || "Failed to create bill");
        } finally { setSubmitting(false); }
    };

    const handleNewBill = () => {
        setCustomerName(""); setPhone(""); setItems([emptyItem()]);
        setPaymentMode("CASH"); setNote(""); setSuccessBill(null);
    };

    const handleDownload = async (id, billNumber) => {
        setDownloadingId(id);
        try {
            const res = await api.get(`/walkin/${id}/bill`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `RVGifts_Bill_${billNumber}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
            showToast("success", `Bill ${billNumber} downloaded!`);
        } catch { showToast("error", "Failed to download bill"); }
        finally { setDownloadingId(null); }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await api.delete(`/walkin/${id}`);
            setBills(prev => prev.filter(b => b._id !== id));
            setConfirmDeleteId(null);
            fetchStats();
            showToast("success", "Bill deleted");
        } catch { showToast("error", "Failed to delete bill"); }
        finally { setDeletingId(null); }
    };

    // ─────────────────────────────────────────────
    // SUCCESS SCREEN
    // ─────────────────────────────────────────────
    if (successBill) return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <Toast toast={toast} />
            <style>{styles}</style>

            {emailBill && (
                <EmailModal
                    bill={emailBill}
                    onClose={() => setEmailBill(null)}
                    onSent={(to) => {
                        setEmailBill(null);
                        showToast("success", `Invoice sent to ${to} ✉️`);
                    }}
                />
            )}

            <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden"
                style={{ animation: "popIn .4s cubic-bezier(.16,1,.3,1)" }}>
                <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
                <div className="p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-5 relative">
                        <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                            <FaCheckCircle size={38} className="text-emerald-500" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 mb-1">Bill Created! 🎉</h2>
                    <p className="text-zinc-400 text-sm mb-4">Invoice is ready</p>

                    <div className="inline-block bg-amber-50 border border-amber-200 rounded-xl px-5 py-2 mb-5">
                        <p className="text-xs text-amber-600 font-semibold">Bill Number</p>
                        <p className="text-xl font-black text-amber-600 tracking-wider">{successBill.billNumber}</p>
                    </div>

                    <div className="bg-stone-50 rounded-2xl p-4 mb-5 text-left space-y-2.5">
                        {[
                            ["Customer", successBill.customerName],
                            ["Items", `${successBill.items?.length} item(s)`],
                            ["Payment", successBill.paymentMode],
                        ].map(([l, v]) => (
                            <div key={l} className="flex justify-between text-sm">
                                <span className="text-zinc-500">{l}</span>
                                <span className="font-bold text-zinc-800">{v}</span>
                            </div>
                        ))}
                        <div className="flex justify-between text-sm border-t border-stone-200 pt-2.5">
                            <span className="font-black text-zinc-700">Grand Total</span>
                            <span className="font-black text-emerald-600 text-lg">{fmt(successBill.grandTotal)}</span>
                        </div>
                    </div>

                    {/* 3 action buttons */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        <button
                            onClick={() => handleDownload(successBill._id, successBill.billNumber)}
                            disabled={downloadingId === successBill._id}
                            className="flex flex-col items-center gap-1.5 py-3 bg-amber-500 text-white rounded-xl font-bold text-xs hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-60 cursor-pointer shadow-md shadow-amber-200">
                            <FaFileInvoice size={16} />
                            {downloadingId === successBill._id ? "..." : "Download"}
                        </button>
                        <button
                            onClick={() => setEmailBill(successBill)}
                            className="flex flex-col items-center gap-1.5 py-3 bg-blue-500 text-white rounded-xl font-bold text-xs hover:bg-blue-600 active:scale-95 transition-all cursor-pointer shadow-md shadow-blue-200">
                            <FaEnvelope size={16} />
                            Email
                        </button>
                        <button
                            onClick={handleNewBill}
                            className="flex flex-col items-center gap-1.5 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer">
                            <FaPlus size={16} />
                            New Bill
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ─────────────────────────────────────────────
    // MAIN
    // ─────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <style>{styles}</style>
            <Toast toast={toast} />

            {emailBill && (
                <EmailModal
                    bill={emailBill}
                    onClose={() => setEmailBill(null)}
                    onSent={(to) => {
                        setEmailBill(null);
                        showToast("success", `Invoice sent to ${to} ✉️`);
                    }}
                />
            )}

            <div className="max-w-6xl mx-auto px-4 py-6">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200">
                            <FaCashRegister className="text-white" size={18} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-zinc-900">Shop POS</h1>
                            <p className="text-zinc-400 text-xs">Walk-in customer billing</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {[
                            { id: "new", icon: <FaReceipt size={11} />, label: "New Bill" },
                            { id: "history", icon: <FaHistory size={11} />, label: "Bill History" },
                        ].map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${tab === t.id
                                        ? "bg-zinc-900 text-white shadow-md"
                                        : "bg-white border border-stone-200 text-zinc-600 hover:bg-stone-50"
                                    }`}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {[
                            { label: "Today's Bills", value: stats.todayBills, color: "text-zinc-800", bg: "bg-white border-stone-200" },
                            { label: "Today's Revenue", value: fmt(stats.todayRevenue), color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
                            { label: "Total Bills", value: stats.totalBills, color: "text-zinc-800", bg: "bg-white border-stone-200" },
                            { label: "Total Revenue", value: fmt(stats.totalRevenue), color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                        ].map(({ label, value, color, bg }) => (
                            <div key={label} className={`${bg} border rounded-2xl px-4 py-3`}>
                                <p className="text-xs text-zinc-400 font-medium mb-0.5">{label}</p>
                                <p className={`text-lg font-black ${color}`}>{value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ══ NEW BILL TAB ══ */}
                {tab === "new" && (
                    <div className="grid md:grid-cols-3 gap-5">
                        <div className="md:col-span-2 space-y-4">

                            {/* Customer */}
                            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                                <SectionTitle icon={<FaUser size={11} className="text-amber-600" />} bg="bg-amber-100" title="Customer Info" />
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <Field label="Customer Name">
                                        <IconInput icon={<FaUser size={10} />} value={customerName}
                                            onChange={e => setCustomerName(e.target.value)} placeholder="Walk-in Customer" />
                                    </Field>
                                    <Field label="Phone (optional)">
                                        <IconInput icon={<FaPhone size={10} />} value={phone}
                                            onChange={e => setPhone(e.target.value)} placeholder="9876543210" maxLength={10} />
                                    </Field>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <SectionTitle icon={<FaBoxOpen size={11} className="text-blue-500" />} bg="bg-blue-50"
                                        title={`Items`} sub={`${items.length} line${items.length > 1 ? "s" : ""}`} />
                                    <button onClick={addItem}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 active:scale-95 transition-all cursor-pointer shadow-sm shadow-amber-200">
                                        <FaPlus size={9} /> Add Item
                                    </button>
                                </div>

                                {/* Column headers */}
                                <div className="grid gap-2 mt-4 mb-1 px-1"
                                    style={{ gridTemplateColumns: "1fr 56px 80px 68px 72px 24px" }}>
                                    {["Item Name", "Qty", "Rate (₹)", "GST %", "Total", ""].map(h => (
                                        <p key={h} className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">{h}</p>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    {items.map((item, idx) => {
                                        const lineTotal = (Number(item.price) || 0) * (Number(item.qty) || 0);
                                        const lineGST = lineTotal * (Number(item.gstPercent) || 0) / 100;
                                        return (
                                            <div key={idx} className="grid gap-2 items-center bg-stone-50 rounded-xl px-3 py-2 border border-stone-100"
                                                style={{ gridTemplateColumns: "1fr 56px 80px 68px 72px 24px" }}>
                                                <input
                                                    className="bg-white border border-stone-200 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                                                    placeholder="Item name"
                                                    value={item.name}
                                                    onChange={e => updateItem(idx, "name", e.target.value)} />
                                                <input type="number" min={1}
                                                    className="bg-white border border-stone-200 rounded-lg px-2 py-2 text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-center"
                                                    value={item.qty}
                                                    onChange={e => updateItem(idx, "qty", e.target.value)} />
                                                <input type="number" min={0}
                                                    className="bg-white border border-stone-200 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                                                    placeholder="0"
                                                    value={item.price}
                                                    onChange={e => updateItem(idx, "price", e.target.value)} />
                                                <select
                                                    className="bg-white border border-stone-200 rounded-lg px-2 py-2 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                                                    value={item.gstPercent}
                                                    onChange={e => updateItem(idx, "gstPercent", e.target.value)}>
                                                    {GST_RATES.map(r => (
                                                        <option key={r} value={r}>{r === 0 ? "No GST" : `${r}%`}</option>
                                                    ))}
                                                </select>
                                                <p className="text-xs font-black text-emerald-600 text-right pr-1">
                                                    ₹{(lineTotal + lineGST).toLocaleString("en-IN")}
                                                </p>
                                                <div className="flex justify-center">
                                                    {items.length > 1
                                                        ? <button onClick={() => removeItem(idx)}
                                                            className="w-6 h-6 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition cursor-pointer">
                                                            <FaTrash size={9} />
                                                        </button>
                                                        : <div className="w-6" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Note */}
                            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-wide mb-2 block">
                                    Note <span className="font-normal normal-case">(optional)</span>
                                </label>
                                <textarea value={note} onChange={e => setNote(e.target.value)}
                                    placeholder="Any special note for this bill..."
                                    rows={2}
                                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all resize-none" />
                            </div>
                        </div>

                        {/* RIGHT */}
                        <div className="space-y-4">
                            {/* Payment */}
                            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                                <SectionTitle icon={<FaCreditCard size={11} className="text-purple-500" />} bg="bg-purple-50" title="Payment Mode" />
                                <div className="space-y-2 mt-4">
                                    {PAYMENT_MODES.map(mode => (
                                        <button key={mode.value} onClick={() => setPaymentMode(mode.value)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${paymentMode === mode.value
                                                    ? "border-amber-400 bg-amber-50 text-amber-800"
                                                    : "border-stone-200 bg-white text-zinc-600 hover:bg-stone-50"
                                                }`}>
                                            <span className={`w-8 h-8 rounded-lg ${mode.color} text-white flex items-center justify-center shadow-sm`}>
                                                {mode.icon}
                                            </span>
                                            {mode.label}
                                            {paymentMode === mode.value && <FaCheckCircle className="ml-auto text-amber-500" size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                                <SectionTitle icon={<FaRupeeSign size={11} className="text-emerald-500" />} bg="bg-emerald-50" title="Bill Summary" />
                                <div className="space-y-3 mt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Items ({itemCount} units)</span>
                                        <span className="font-bold text-zinc-800">{fmt(subtotal)}</span>
                                    </div>
                                    {totalGST > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">GST</span>
                                            <span className="font-bold text-amber-600">{fmt(totalGST)}</span>
                                        </div>
                                    )}
                                    <div className="bg-zinc-900 rounded-xl px-4 py-3 flex justify-between items-center">
                                        <span className="font-black text-white text-sm">Grand Total</span>
                                        <span className="font-black text-amber-400 text-xl">{fmt(grandTotal)}</span>
                                    </div>
                                </div>

                                <button onClick={handleSubmit}
                                    disabled={submitting || items.every(i => !i.name.trim())}
                                    className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 text-white rounded-xl font-black text-sm hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-amber-200">
                                    <FaFileInvoice size={14} />
                                    {submitting ? "Creating Bill..." : "Generate Invoice"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ HISTORY TAB ══ */}
                {tab === "history" && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-wrap gap-3 items-center">
                            <div className="relative flex-1 min-w-48">
                                <FaSearch size={11} className="absolute left-3 top-3.5 text-zinc-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by name, phone, bill no..."
                                    className="w-full pl-8 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all" />
                            </div>
                            <div className="relative">
                                <FaCalendarAlt size={11} className="absolute left-3 top-3.5 text-zinc-400" />
                                <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                                    className="pl-8 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                            </div>
                            {(search || dateFilter) && (
                                <button onClick={() => { setSearch(""); setDateFilter(""); }}
                                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-zinc-500 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer">
                                    <FaTimes size={10} /> Clear
                                </button>
                            )}
                            <button onClick={fetchBills} disabled={loadingBills}
                                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-zinc-500 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer disabled:opacity-50">
                                <FaSync size={10} className={loadingBills ? "animate-spin" : ""} /> Refresh
                            </button>
                        </div>

                        {loadingBills ? (
                            <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
                                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-zinc-400 text-sm">Loading bills...</p>
                            </div>
                        ) : bills.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-16 text-center">
                                <FaShoppingCart size={32} className="text-stone-300 mx-auto mb-3" />
                                <p className="text-zinc-500 font-semibold">No bills found</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                                <div className="grid gap-2 px-5 py-3 bg-stone-50 border-b border-stone-100"
                                    style={{ gridTemplateColumns: "120px 1fr 130px 50px 70px 100px 110px" }}>
                                    {["Bill No", "Customer", "Date", "Items", "Payment", "Total", "Actions"].map(h => (
                                        <p key={h} className="text-[10px] font-black text-zinc-400 uppercase tracking-wide">{h}</p>
                                    ))}
                                </div>
                                <div className="divide-y divide-stone-50">
                                    {bills.map(bill => (
                                        <div key={bill._id} className="grid gap-2 px-5 py-3.5 items-center hover:bg-stone-50/70 transition-colors"
                                            style={{ gridTemplateColumns: "120px 1fr 130px 50px 70px 100px 110px" }}>
                                            <p className="font-mono font-bold text-xs text-amber-600 truncate">{bill.billNumber}</p>
                                            <div>
                                                <p className="font-bold text-zinc-800 text-sm truncate">{bill.customerName}</p>
                                                {bill.phone && <p className="text-xs text-zinc-400">{bill.phone}</p>}
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-zinc-600">
                                                    {new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                                <p className="text-[10px] text-zinc-400">
                                                    {new Date(bill.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-700">{bill.items?.length}</p>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-full w-fit ${pmBadge(bill.paymentMode)}`}>
                                                {bill.paymentMode}
                                            </span>
                                            <p className="font-black text-emerald-600 text-sm">
                                                ₹{Number(bill.grandTotal).toLocaleString("en-IN")}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                {/* Download */}
                                                <button onClick={() => handleDownload(bill._id, bill.billNumber)}
                                                    disabled={downloadingId === bill._id}
                                                    className="p-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 transition disabled:opacity-50 cursor-pointer"
                                                    title="Download PDF">
                                                    <FaFileInvoice size={11} />
                                                </button>
                                                {/* Email */}
                                                <button onClick={() => setEmailBill(bill)}
                                                    className="p-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                                                    title="Email Invoice">
                                                    <FaEnvelope size={11} />
                                                </button>
                                                {/* Delete */}
                                                {confirmDeleteId === bill._id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => handleDelete(bill._id)} disabled={deletingId === bill._id}
                                                            className="px-2 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition disabled:opacity-60 cursor-pointer">
                                                            {deletingId === bill._id ? "..." : "Yes"}
                                                        </button>
                                                        <button onClick={() => setConfirmDeleteId(null)}
                                                            className="px-2 py-1.5 bg-stone-100 text-zinc-600 text-xs font-bold rounded-lg hover:bg-stone-200 transition cursor-pointer">
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setConfirmDeleteId(bill._id)}
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                        title="Delete">
                                                        <FaTrash size={11} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-5 py-3 bg-stone-50 border-t border-stone-100">
                                    <p className="text-xs text-zinc-400">
                                        Showing <span className="font-semibold text-zinc-600">{bills.length}</span> bills
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Small helper components ────────────────────────────────────
const SectionTitle = ({ icon, bg, title, sub }) => (
    <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
        <p className="text-sm font-black text-zinc-700">
            {title}
            {sub && <span className="ml-1.5 text-xs font-bold text-zinc-400">({sub})</span>}
        </p>
    </div>
);

const Field = ({ label, children }) => (
    <div>
        <label className="text-xs font-bold text-zinc-400 mb-1.5 block">{label}</label>
        {children}
    </div>
);

const IconInput = ({ icon, ...props }) => (
    <div className="relative">
        <span className="absolute left-3 top-3 text-zinc-400">{icon}</span>
        <input
            className="w-full pl-8 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
            {...props}
        />
    </div>
);

// ── Shared CSS ─────────────────────────────────────────────────
const styles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
    @keyframes slideInRight { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
    @keyframes popIn        { from{opacity:0;transform:scale(.75)}        to{opacity:1;transform:scale(1)}     }
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none;margin:0; }
`;

export default AdminPOS;