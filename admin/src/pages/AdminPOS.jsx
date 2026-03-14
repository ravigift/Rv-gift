import { useState, useEffect, useCallback } from "react";
import api from "../api/adminApi";
import upiQR from "../assets/image.png";
import {
    FaPlus, FaTrash, FaFileInvoice, FaSync, FaSearch,
    FaUser, FaPhone, FaShoppingCart,
    FaCheckCircle, FaHistory, FaTimes, FaCalendarAlt,
    FaCashRegister, FaMobileAlt, FaBoxOpen,
    FaReceipt, FaRupeeSign, FaEnvelope, FaPaperPlane, FaLock,
    FaCopy, FaQrcode,
} from "react-icons/fa";

const GST_RATES = [0, 5, 12, 18, 28];

const PAYMENT_MODES = [
    { value: "CASH", label: "Cash", icon: <FaCashRegister size={14} />, color: "bg-emerald-500" },
    { value: "UPI", label: "UPI", icon: <FaMobileAlt size={14} />, color: "bg-sky-500" },
];

const UPI_ID = "9792770976-2@ibl";
const UPI_QR_IMG = upiQR;

const emptyItem = () => ({ name: "", qty: 1, price: "", gstPercent: 0 });
const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const pmBadge = (m) =>
    m === "CASH" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700";

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

// ── UPI Payment Confirmation Modal ─────────────────────────────
// ✅ Dikhta hai sirf UPI select hone aur Generate Invoice press karne pe
// Admin ko confirm karna hoga ki payment mili — tabhi bill banega
const UPIConfirmModal = ({ amount, onConfirm, onCancel }) => (
    <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(3px)",
    }} onClick={onCancel}>
        <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: 28,
            width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            animation: "popIn .3s cubic-bezier(.16,1,.3,1)",
            fontFamily: "'DM Sans',sans-serif",
        }}>
            <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center">
                    <FaMobileAlt size={20} className="text-sky-600" />
                </div>
                <div>
                    <p className="font-black text-zinc-900 text-base">Confirm UPI Payment</p>
                    <p className="text-xs text-zinc-400">Verify payment before generating bill</p>
                </div>
            </div>

            <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: "linear-gradient(135deg,#e0f7ff,#e0f2fe)", border: "1.5px solid #7dd3fc" }}>
                <p className="text-xs font-bold text-sky-500 uppercase tracking-wide mb-1">Amount Received</p>
                <p className="text-3xl font-black text-sky-700">{fmt(amount)}</p>
            </div>

            <div className="bg-stone-50 rounded-xl border border-stone-200 px-4 py-3 mb-5">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">UPI ID</p>
                <p className="font-black text-zinc-800 text-sm">{UPI_ID}</p>
            </div>

            <p className="text-xs text-zinc-500 mb-4 text-center">
                ✅ Confirm only after verifying payment in your UPI app
            </p>

            <div className="flex gap-2">
                <button onClick={onCancel}
                    className="flex-1 py-3 rounded-xl border border-stone-200 text-sm font-bold text-zinc-600 hover:bg-stone-50 transition cursor-pointer">
                    ✗ Not Received
                </button>
                <button onClick={onConfirm}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-white text-sm font-black active:scale-95 transition-all cursor-pointer rounded-xl"
                    style={{ background: "linear-gradient(135deg,#0ea5e9,#22d3ee)", boxShadow: "0 4px 14px rgba(14,165,233,0.35)" }}>
                    <FaCheckCircle size={13} /> Payment Received
                </button>
            </div>
        </div>
    </div>
);

// ── UPI Payment Panel ──────────────────────────────────────────
const UPIPanel = ({ amount }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(UPI_ID).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="mt-4 rounded-2xl p-4 space-y-3" style={{ background: "linear-gradient(135deg,#e0f7ff,#e0f2fe)", border: "1.5px solid #bae6fd" }}>
            <div className="flex items-center gap-2 mb-1">
                <FaQrcode size={14} className="text-sky-600" />
                <p className="text-sm font-black text-sky-800">Scan & Pay</p>
            </div>

            <div className="flex justify-center">
                <div className="bg-white rounded-2xl p-3 shadow-sm" style={{ border: "2px solid #7dd3fc" }}>
                    <img src={UPI_QR_IMG} alt="UPI QR Code"
                        className="w-44 h-44 object-contain"
                        onError={e => { e.target.style.display = "none"; }} />
                </div>
            </div>

            <div className="bg-white rounded-xl px-3 py-2.5" style={{ border: "1px solid #7dd3fc" }}>
                <p className="text-[10px] font-bold text-sky-400 uppercase tracking-wide mb-1">UPI ID</p>
                <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-sky-800 text-sm tracking-wide">{UPI_ID}</p>
                    <button onClick={handleCopy}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${copied
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-sky-100 text-sky-700 border border-sky-200 hover:bg-sky-200"
                            }`}>
                        <FaCopy size={9} />
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
            </div>

            {amount > 0 && (
                <div className="bg-white rounded-xl px-3 py-2 flex items-center justify-between" style={{ border: "1px solid #7dd3fc" }}>
                    <span className="text-xs font-bold text-sky-600">Amount to Pay</span>
                    <span className="font-black text-sky-700 text-base">{fmt(amount)}</span>
                </div>
            )}

            <p className="text-[10px] text-sky-400 text-center font-medium">
                Ask customer to scan QR or enter UPI ID manually
            </p>
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
        } finally { setSending(false); }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 28, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "popIn .3s cubic-bezier(.16,1,.3,1)", fontFamily: "'DM Sans',sans-serif" }}>
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                            <FaEnvelope size={16} className="text-sky-600" />
                        </div>
                        <div>
                            <p className="font-black text-zinc-900 text-base">Email Invoice</p>
                            <p className="text-xs text-zinc-400">{bill.billNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-zinc-500 hover:bg-stone-200 transition cursor-pointer">
                        <FaTimes size={12} />
                    </button>
                </div>
                <div className="bg-stone-50 rounded-xl p-3 mb-4 text-sm">
                    <div className="flex justify-between mb-1"><span className="text-zinc-500">Customer</span><span className="font-bold text-zinc-800">{bill.customerName}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Amount</span><span className="font-black text-emerald-600">{fmt(bill.grandTotal)}</span></div>
                </div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">Send to Email Address</label>
                <div className="relative mb-3">
                    <FaEnvelope size={12} className="absolute left-3 top-3.5 text-zinc-400" />
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                        placeholder="customer@example.com" onKeyDown={e => e.key === "Enter" && handleSend()} autoFocus
                        className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all" />
                </div>
                {error && <p className="text-xs text-red-500 font-semibold mb-3">⚠ {error}</p>}
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-zinc-600 hover:bg-stone-50 transition cursor-pointer">Cancel</button>
                    <button onClick={handleSend} disabled={sending}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white text-sm font-black active:scale-95 transition-all disabled:opacity-60 cursor-pointer rounded-xl"
                        style={{ background: "linear-gradient(135deg,#0ea5e9,#22d3ee)", boxShadow: "0 4px 12px rgba(14,165,233,0.3)" }}>
                        {sending ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</> : <><FaPaperPlane size={12} /> Send Invoice</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Delete Confirm Modal ───────────────────────────────────────
const DeleteModal = ({ bill, onClose, onConfirm, deleting }) => {
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const handleDelete = () => { if (!pin.trim()) return setError("PIN is required"); onConfirm(bill._id, pin, setError); };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "popIn .3s cubic-bezier(.16,1,.3,1)", fontFamily: "'DM Sans',sans-serif" }}>
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><FaTrash size={15} className="text-red-500" /></div>
                        <div><p className="font-black text-zinc-900 text-base">Delete Bill</p><p className="text-xs text-zinc-400">{bill.billNumber}</p></div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-zinc-500 hover:bg-stone-200 transition cursor-pointer"><FaTimes size={12} /></button>
                </div>
                <div className="bg-stone-50 rounded-xl p-3 mb-4 text-sm">
                    <div className="flex justify-between mb-1"><span className="text-zinc-500">Customer</span><span className="font-bold text-zinc-800">{bill.customerName}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Amount</span><span className="font-black text-red-500">{fmt(bill.grandTotal)}</span></div>
                </div>
                <p className="text-xs text-zinc-500 mb-3">⚠️ This action cannot be undone. Enter your admin PIN to confirm deletion.</p>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">Admin PIN</label>
                <div className="relative mb-3">
                    <FaLock size={11} className="absolute left-3 top-3.5 text-zinc-400" />
                    <input type="password" value={pin} onChange={e => { setPin(e.target.value); setError(""); }}
                        placeholder="Enter PIN" maxLength={6} inputMode="numeric"
                        onKeyDown={e => e.key === "Enter" && handleDelete()} autoFocus
                        className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all tracking-widest" />
                </div>
                {error && <p className="text-xs text-red-500 font-semibold mb-3">⚠ {error}</p>}
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-zinc-600 hover:bg-stone-50 transition cursor-pointer">Cancel</button>
                    <button onClick={handleDelete} disabled={deleting}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white text-sm font-black hover:bg-red-600 active:scale-95 transition-all disabled:opacity-60 cursor-pointer shadow-md shadow-red-200">
                        {deleting ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting...</> : <><FaTrash size={12} /> Delete Bill</>}
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
    const [showUPIConfirm, setShowUPIConfirm] = useState(false); // ✅ UPI confirm gate

    const [tab, setTab] = useState("new");
    const [bills, setBills] = useState([]);
    const [loadingBills, setLoadingBills] = useState(false);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [stats, setStats] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [deleteBill, setDeleteBill] = useState(null);
    const [emailBill, setEmailBill] = useState(null);

    const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
    const totalGST = items.reduce((s, i) => {
        const amt = (Number(i.price) || 0) * (Number(i.qty) || 0);
        return s + (amt * (Number(i.gstPercent) || 0)) / 100;
    }, 0);
    const grandTotal = subtotal + totalGST;
    const itemCount = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);

    const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3200); };

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
        try { const { data } = await api.get("/walkin/stats"); setStats(data); } catch { }
    }, []);

    useEffect(() => {
        fetchStats();
        if (tab === "history") fetchBills();
    }, [tab, fetchBills, fetchStats]);

    const updateItem = (idx, field, value) =>
        setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
    const addItem = () => setItems(prev => [...prev, emptyItem()]);
    const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

    // ✅ Step 1: Validate
    // ✅ Step 2: UPI → show confirm modal | CASH → seedha submit
    const handleGenerateClick = () => {
        if (items.some(i => !i.name.trim())) return showToast("error", "All item names are required");
        if (items.some(i => !i.price || Number(i.price) < 0)) return showToast("error", "All item prices are required");
        if (grandTotal <= 0) return showToast("error", "Bill amount must be greater than ₹0");
        if (paymentMode === "UPI") {
            setShowUPIConfirm(true); // ← admin confirms payment received
        } else {
            doSubmit(); // ← CASH: no confirmation needed
        }
    };

    // ✅ Step 3: Actual API call — runs only after confirmation
    const doSubmit = async () => {
        setShowUPIConfirm(false);
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
            link.href = url; link.setAttribute("download", `RVGifts_Bill_${billNumber}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
            showToast("success", `Bill ${billNumber} downloaded!`);
        } catch { showToast("error", "Failed to download bill"); }
        finally { setDownloadingId(null); }
    };

    const handleDelete = async (id, pin, setError) => {
        setDeletingId(id);
        try {
            await api.delete(`/walkin/${id}`, { data: { pin } });
            setBills(prev => prev.filter(b => b._id !== id));
            setDeleteBill(null); fetchStats();
            showToast("success", "Bill deleted");
        } catch (err) { setError(err.response?.data?.message || "Invalid PIN"); }
        finally { setDeletingId(null); }
    };

    // ─────────────────────────────────────────────
    // SUCCESS SCREEN
    // ─────────────────────────────────────────────
    if (successBill) return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ background: "linear-gradient(135deg,#e0f7ff 0%,#f0f9ff 50%,#ecfeff 100%)", fontFamily: "'DM Sans', sans-serif" }}>
            <Toast toast={toast} />
            <style>{styles}</style>
            {emailBill && <EmailModal bill={emailBill} onClose={() => setEmailBill(null)} onSent={(to) => { setEmailBill(null); showToast("success", `Invoice sent to ${to} ✉️`); }} />}

            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                style={{ border: "1.5px solid #bae6fd", animation: "popIn .4s cubic-bezier(.16,1,.3,1)" }}>
                <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#0ea5e9,#22d3ee,#0ea5e9)" }} />
                <div className="p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-5 relative">
                        <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: "#bae6fd" }} />
                        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#e0f2fe" }}>
                            <FaCheckCircle size={38} className="text-sky-500" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 mb-1">Bill Created! 🎉</h2>
                    <p className="text-zinc-400 text-sm mb-4">Invoice is ready</p>
                    <div className="inline-block rounded-xl px-5 py-2 mb-5" style={{ background: "#e0f2fe", border: "1px solid #7dd3fc" }}>
                        <p className="text-xs font-semibold text-sky-600">Bill Number</p>
                        <p className="text-xl font-black text-sky-700 tracking-wider">{successBill.billNumber}</p>
                    </div>
                    <div className="bg-stone-50 rounded-2xl p-4 mb-5 text-left space-y-2.5">
                        {[["Customer", successBill.customerName], ["Items", `${successBill.items?.length} item(s)`], ["Payment", successBill.paymentMode]].map(([l, v]) => (
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
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        <button onClick={() => handleDownload(successBill._id, successBill.billNumber)}
                            disabled={downloadingId === successBill._id}
                            className="flex flex-col items-center gap-1.5 py-3 text-white rounded-xl font-bold text-xs active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                            style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)", boxShadow: "0 4px 14px rgba(14,165,233,0.35)" }}>
                            <FaFileInvoice size={16} />
                            {downloadingId === successBill._id ? "..." : "Download"}
                        </button>
                        <button onClick={() => setEmailBill(successBill)}
                            className="flex flex-col items-center gap-1.5 py-3 text-white rounded-xl font-bold text-xs active:scale-95 transition-all cursor-pointer"
                            style={{ background: "linear-gradient(135deg,#22d3ee,#0891b2)", boxShadow: "0 4px 14px rgba(34,211,238,0.35)" }}>
                            <FaEnvelope size={16} />Email
                        </button>
                        <button onClick={handleNewBill}
                            className="flex flex-col items-center gap-1.5 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer">
                            <FaPlus size={16} />New Bill
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
        <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#f0f9ff 0%,#e0f7ff 50%,#f0fdff 100%)", fontFamily: "'DM Sans', sans-serif" }}>
            <style>{styles}</style>
            <Toast toast={toast} />

            {/* ✅ UPI payment must be confirmed before bill is created */}
            {showUPIConfirm && <UPIConfirmModal amount={grandTotal} onConfirm={doSubmit} onCancel={() => setShowUPIConfirm(false)} />}

            {emailBill && <EmailModal bill={emailBill} onClose={() => setEmailBill(null)} onSent={(to) => { setEmailBill(null); showToast("success", `Invoice sent to ${to} ✉️`); }} />}
            {deleteBill && <DeleteModal bill={deleteBill} onClose={() => setDeleteBill(null)} onConfirm={handleDelete} deleting={deletingId === deleteBill._id} />}

            <div className="max-w-6xl mx-auto px-4 py-6">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg,#0ea5e9,#22d3ee)", boxShadow: "0 4px 16px rgba(14,165,233,0.35)" }}>
                            <FaCashRegister className="text-white" size={18} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-zinc-900">Shop POS</h1>
                            <p className="text-zinc-400 text-xs">Walk-in customer billing</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {[{ id: "new", icon: <FaReceipt size={11} />, label: "New Bill" }, { id: "history", icon: <FaHistory size={11} />, label: "Bill History" }].map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${tab !== t.id ? "bg-white border border-sky-100 text-zinc-600 hover:bg-sky-50" : "text-white"}`}
                                style={tab === t.id ? { background: "linear-gradient(135deg,#0ea5e9,#22d3ee)", boxShadow: "0 4px 14px rgba(14,165,233,0.3)" } : {}}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {[
                            { label: "Today's Bills", value: stats.todayBills, color: "text-zinc-800", bg: "bg-white", border: "#e2e8f0" },
                            { label: "Today's Revenue", value: fmt(stats.todayRevenue), color: "text-emerald-600", bg: "bg-emerald-50", border: "#a7f3d0" },
                            { label: "Total Bills", value: stats.totalBills, color: "text-sky-700", bg: "bg-sky-50", border: "#7dd3fc" },
                            { label: "Total Revenue", value: fmt(stats.totalRevenue), color: "text-cyan-700", bg: "bg-cyan-50", border: "#67e8f9" },
                        ].map(({ label, value, color, bg, border }) => (
                            <div key={label} className={`${bg} rounded-2xl px-4 py-3`} style={{ border: `1px solid ${border}` }}>
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
                            <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-sm">
                                <SectionTitle icon={<FaUser size={11} className="text-sky-600" />} bg="bg-sky-100" title="Customer Info" />
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <Field label="Customer Name">
                                        <IconInput icon={<FaUser size={10} />} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Walk-in Customer" />
                                    </Field>
                                    <Field label="Phone (optional)">
                                        <IconInput icon={<FaPhone size={10} />} value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" maxLength={10} />
                                    </Field>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <SectionTitle icon={<FaBoxOpen size={11} className="text-cyan-600" />} bg="bg-cyan-50" title="Items" sub={`${items.length} line${items.length > 1 ? "s" : ""}`} />
                                    <button onClick={addItem}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-bold rounded-lg active:scale-95 transition-all cursor-pointer"
                                        style={{ background: "linear-gradient(135deg,#0ea5e9,#22d3ee)", boxShadow: "0 2px 8px rgba(14,165,233,0.3)" }}>
                                        <FaPlus size={9} /> Add Item
                                    </button>
                                </div>
                                <div className="grid gap-2 mt-4 mb-1 px-1" style={{ gridTemplateColumns: "1fr 56px 80px 68px 72px 24px" }}>
                                    {["Item Name", "Qty", "Rate (₹)", "GST %", "Total", ""].map(h => (
                                        <p key={h} className="text-[9px] font-black text-sky-400 uppercase tracking-wider">{h}</p>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    {items.map((item, idx) => {
                                        const lineTotal = (Number(item.price) || 0) * (Number(item.qty) || 0);
                                        const lineGST = lineTotal * (Number(item.gstPercent) || 0) / 100;
                                        return (
                                            <div key={idx} className="grid gap-2 items-center rounded-xl px-3 py-2"
                                                style={{ gridTemplateColumns: "1fr 56px 80px 68px 72px 24px", background: "#f0f9ff", border: "1px solid #bae6fd" }}>
                                                <input className="bg-white border border-sky-100 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
                                                    placeholder="Item name" value={item.name} onChange={e => updateItem(idx, "name", e.target.value)} />
                                                <input type="number" min={1}
                                                    className="bg-white border border-sky-100 rounded-lg px-2 py-2 text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all text-center"
                                                    value={item.qty} onChange={e => updateItem(idx, "qty", e.target.value)} />
                                                <input type="number" min={0}
                                                    className="bg-white border border-sky-100 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
                                                    placeholder="0" value={item.price} onChange={e => updateItem(idx, "price", e.target.value)} />
                                                <select className="bg-white border border-sky-100 rounded-lg px-2 py-2 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
                                                    value={item.gstPercent} onChange={e => updateItem(idx, "gstPercent", e.target.value)}>
                                                    {GST_RATES.map(r => <option key={r} value={r}>{r === 0 ? "No GST" : `${r}%`}</option>)}
                                                </select>
                                                <p className="text-xs font-black text-sky-600 text-right pr-1">₹{(lineTotal + lineGST).toLocaleString("en-IN")}</p>
                                                <div className="flex justify-center">
                                                    {items.length > 1
                                                        ? <button onClick={() => removeItem(idx)} className="w-6 h-6 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition cursor-pointer"><FaTrash size={9} /></button>
                                                        : <div className="w-6" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Note */}
                            <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-sm">
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-wide mb-2 block">Note <span className="font-normal normal-case">(optional)</span></label>
                                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Any special note for this bill..." rows={2}
                                    className="w-full border border-sky-100 rounded-xl px-3 py-2.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all resize-none" />
                            </div>
                        </div>

                        {/* RIGHT PANEL */}
                        <div className="space-y-4">
                            {/* Payment */}
                            <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-sm">
                                <SectionTitle icon={<FaMobileAlt size={11} className="text-sky-500" />} bg="bg-sky-50" title="Payment Mode" />
                                <div className="space-y-2 mt-4">
                                    {PAYMENT_MODES.map(mode => (
                                        <button key={mode.value} onClick={() => setPaymentMode(mode.value)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${paymentMode === mode.value ? "border-sky-400 text-sky-800" : "border-stone-200 bg-white text-zinc-600 hover:bg-sky-50 hover:border-sky-200"}`}
                                            style={paymentMode === mode.value ? { background: "linear-gradient(135deg,#e0f7ff,#e0f2fe)" } : {}}>
                                            <span className={`w-8 h-8 rounded-lg ${mode.color} text-white flex items-center justify-center shadow-sm`}>{mode.icon}</span>
                                            {mode.label}
                                            {paymentMode === mode.value && <FaCheckCircle className="ml-auto text-sky-500" size={14} />}
                                        </button>
                                    ))}
                                </div>
                                {paymentMode === "UPI" && <UPIPanel amount={grandTotal} />}
                            </div>

                            {/* Summary */}
                            <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-sm">
                                <SectionTitle icon={<FaRupeeSign size={11} className="text-emerald-500" />} bg="bg-emerald-50" title="Bill Summary" />
                                <div className="space-y-3 mt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Items ({itemCount} units)</span>
                                        <span className="font-bold text-zinc-800">{fmt(subtotal)}</span>
                                    </div>
                                    {totalGST > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">GST</span>
                                            <span className="font-bold text-sky-600">{fmt(totalGST)}</span>
                                        </div>
                                    )}
                                    <div className="rounded-xl px-4 py-3 flex justify-between items-center"
                                        style={{ background: "linear-gradient(135deg,#0c4a6e,#0369a1)" }}>
                                        <span className="font-black text-white text-sm">Grand Total</span>
                                        <span className="font-black text-cyan-300 text-xl">{fmt(grandTotal)}</span>
                                    </div>
                                </div>

                                {/* ✅ Generate Invoice button — UPI → confirm modal, CASH → direct */}
                                <button onClick={handleGenerateClick}
                                    disabled={submitting || items.every(i => !i.name.trim())}
                                    className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 text-white rounded-xl font-black text-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    style={{ background: "linear-gradient(135deg,#0ea5e9,#22d3ee)", boxShadow: "0 4px 18px rgba(14,165,233,0.4)" }}>
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
                        <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-sm flex flex-wrap gap-3 items-center">
                            <div className="relative flex-1 min-w-48">
                                <FaSearch size={11} className="absolute left-3 top-3.5 text-zinc-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, bill no..."
                                    className="w-full pl-8 pr-3 py-2.5 border border-sky-100 rounded-xl text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all" />
                            </div>
                            <div className="relative">
                                <FaCalendarAlt size={11} className="absolute left-3 top-3.5 text-zinc-400" />
                                <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                                    className="pl-8 pr-3 py-2.5 border border-sky-100 rounded-xl text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent" />
                            </div>
                            {(search || dateFilter) && (
                                <button onClick={() => { setSearch(""); setDateFilter(""); }}
                                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-zinc-500 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer">
                                    <FaTimes size={10} /> Clear
                                </button>
                            )}
                            <button onClick={fetchBills} disabled={loadingBills}
                                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-sky-600 border border-sky-200 rounded-xl hover:bg-sky-50 transition cursor-pointer disabled:opacity-50">
                                <FaSync size={10} className={loadingBills ? "animate-spin" : ""} /> Refresh
                            </button>
                        </div>

                        {loadingBills ? (
                            <div className="bg-white rounded-2xl border border-sky-100 p-16 text-center">
                                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "#7dd3fc", borderTopColor: "transparent" }} />
                                <p className="text-zinc-400 text-sm">Loading bills...</p>
                            </div>
                        ) : bills.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-sky-200 p-16 text-center">
                                <FaShoppingCart size={32} className="text-sky-200 mx-auto mb-3" />
                                <p className="text-zinc-500 font-semibold">No bills found</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
                                <div className="grid gap-2 px-5 py-3 border-b border-sky-50"
                                    style={{ gridTemplateColumns: "120px 1fr 130px 50px 70px 100px 90px", background: "linear-gradient(135deg,#f0f9ff,#e0f7ff)" }}>
                                    {["Bill No", "Customer", "Date", "Items", "Payment", "Total", "Actions"].map(h => (
                                        <p key={h} className="text-[10px] font-black text-sky-600 uppercase tracking-wide">{h}</p>
                                    ))}
                                </div>
                                <div className="divide-y divide-sky-50">
                                    {bills.map(bill => (
                                        <div key={bill._id} className="grid gap-2 px-5 py-3.5 items-center hover:bg-sky-50/50 transition-colors"
                                            style={{ gridTemplateColumns: "120px 1fr 130px 50px 70px 100px 90px" }}>
                                            <p className="font-mono font-bold text-xs text-sky-600 truncate">{bill.billNumber}</p>
                                            <div>
                                                <p className="font-bold text-zinc-800 text-sm truncate">{bill.customerName}</p>
                                                {bill.phone && <p className="text-xs text-zinc-400">{bill.phone}</p>}
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-zinc-600">{new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                                                <p className="text-[10px] text-zinc-400">{new Date(bill.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-700">{bill.items?.length}</p>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-full w-fit ${pmBadge(bill.paymentMode)}`}>{bill.paymentMode}</span>
                                            <p className="font-black text-emerald-600 text-sm">₹{Number(bill.grandTotal).toLocaleString("en-IN")}</p>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => handleDownload(bill._id, bill.billNumber)} disabled={downloadingId === bill._id}
                                                    className="p-1.5 rounded-lg hover:opacity-80 transition disabled:opacity-50 cursor-pointer"
                                                    style={{ background: "#e0f2fe", border: "1px solid #7dd3fc", color: "#0369a1" }} title="Download PDF">
                                                    <FaFileInvoice size={11} />
                                                </button>
                                                <button onClick={() => setEmailBill(bill)}
                                                    className="p-1.5 rounded-lg hover:opacity-80 transition cursor-pointer"
                                                    style={{ background: "#ecfeff", border: "1px solid #67e8f9", color: "#0e7490" }} title="Email Invoice">
                                                    <FaEnvelope size={11} />
                                                </button>
                                                <button onClick={() => setDeleteBill(bill)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition cursor-pointer" title="Delete">
                                                    <FaTrash size={11} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-5 py-3 border-t border-sky-50" style={{ background: "linear-gradient(135deg,#f0f9ff,#e0f7ff)" }}>
                                    <p className="text-xs text-zinc-400">Showing <span className="font-semibold text-sky-600">{bills.length}</span> bills</p>
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
            {title}{sub && <span className="ml-1.5 text-xs font-bold text-zinc-400">({sub})</span>}
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
        <input className="w-full pl-8 pr-3 py-2.5 border border-sky-100 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all" {...props} />
    </div>
);

const styles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
    @keyframes slideInRight { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
    @keyframes popIn        { from{opacity:0;transform:scale(.75)}        to{opacity:1;transform:scale(1)}     }
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none;margin:0; }
`;

export default AdminPOS;