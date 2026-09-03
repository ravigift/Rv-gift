import { useState, useEffect } from "react";
import api from "../api/adminApi";
import {
    FaSave, FaPlus, FaTrashAlt, FaArrowUp, FaArrowDown,
    FaCheckCircle, FaExclamationCircle, FaListOl, FaUndo,
} from "react-icons/fa";

const inputClass =
    "w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm text-zinc-800 placeholder-zinc-400 " +
    "focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all bg-stone-50 focus:bg-white";

const DEFAULT_CONTENT = {
    eyebrow: "EASY 3-STEP PROCESS",
    heading: "How Custom Printing & Gifting Works",
    subheading: "Personalized gifts created in minutes, delivered right at your doorstep.",
    steps: [
        { icon: "🎁", label: "01", title: "Pick Your Gift", desc: "Choose from photo lamps, mugs, custom frames, t-shirts, cushions & 20+ categories." },
        { icon: "✨", label: "02", title: "Add Photo & Text", desc: "Upload your favorite photos, names, or special dates during checkout with live preview." },
        { icon: "🚀", label: "03", title: "Delivered With Love", desc: "We craft your order with laser-sharp quality and deliver safely to your doorstep." },
    ],
};

const MAX_STEPS = 6;

const AdminHomeContent = () => {
    const [form, setForm] = useState(DEFAULT_CONTENT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [lastSaved, setLastSaved] = useState(null);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/site/how-it-works");
                if (data?.data) {
                    setForm({
                        eyebrow: data.data.eyebrow ?? DEFAULT_CONTENT.eyebrow,
                        heading: data.data.heading ?? DEFAULT_CONTENT.heading,
                        subheading: data.data.subheading ?? DEFAULT_CONTENT.subheading,
                        steps: Array.isArray(data.data.steps) && data.data.steps.length
                            ? data.data.steps
                            : DEFAULT_CONTENT.steps,
                    });
                    setLastSaved(data.updatedAt || null);
                }
            } catch {
                /* keep defaults */
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const setStep = (idx, k, v) =>
        setForm((f) => ({
            ...f,
            steps: f.steps.map((s, i) => (i === idx ? { ...s, [k]: v } : s)),
        }));

    const addStep = () =>
        setForm((f) =>
            f.steps.length >= MAX_STEPS
                ? f
                : { ...f, steps: [...f.steps, { icon: "✨", label: String(f.steps.length + 1).padStart(2, "0"), title: "", desc: "" }] }
        );

    const removeStep = (idx) =>
        setForm((f) => ({ ...f, steps: f.steps.filter((_, i) => i !== idx) }));

    const moveStep = (idx, dir) =>
        setForm((f) => {
            const j = idx + dir;
            if (j < 0 || j >= f.steps.length) return f;
            const steps = [...f.steps];
            [steps[idx], steps[j]] = [steps[j], steps[idx]];
            return { ...f, steps };
        });

    const resetDefaults = () => {
        setForm(DEFAULT_CONTENT);
        showToast("info", "Reset to defaults — click Save to apply");
    };

    const save = async () => {
        if (!form.heading.trim()) return showToast("error", "Heading is required");
        const cleanSteps = form.steps
            .map((s) => ({
                icon: (s.icon || "✨").trim().slice(0, 8),
                label: (s.label || "").trim().slice(0, 6),
                title: (s.title || "").trim().slice(0, 80),
                desc: (s.desc || "").trim().slice(0, 240),
            }))
            .filter((s) => s.title || s.desc);

        if (cleanSteps.length === 0) return showToast("error", "Add at least one step with a title");

        try {
            setSaving(true);
            const { data } = await api.put("/site/how-it-works", {
                data: {
                    eyebrow: form.eyebrow.trim(),
                    heading: form.heading.trim(),
                    subheading: form.subheading.trim(),
                    steps: cleanSteps,
                },
            });
            setLastSaved(data.updatedAt || new Date().toISOString());
            showToast("success", "Home section updated — live on the storefront");
        } catch (err) {
            showToast("error", err.response?.data?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );

    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="max-w-3xl mx-auto px-4 py-6">
            {toast && (
                <div
                    style={{
                        position: "fixed", top: 24, right: 24, zIndex: 9999,
                        display: "flex", alignItems: "center", gap: 10, padding: "13px 20px",
                        background:
                            toast.type === "success" ? "linear-gradient(135deg,#10b981,#059669)"
                                : toast.type === "error" ? "linear-gradient(135deg,#ef4444,#dc2626)"
                                    : "linear-gradient(135deg,#f59e0b,#d97706)",
                        color: "#fff", borderRadius: 14, fontWeight: 700, fontSize: 14,
                        boxShadow: "0 8px 30px rgba(0,0,0,0.2)", minWidth: 240,
                    }}
                >
                    {toast.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
                    {toast.msg}
                </div>
            )}

            <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <FaListOl size={15} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-zinc-900">Home — “How It Works” Section</h1>
                    <p className="text-zinc-400 text-xs">
                        {lastSaved ? `Last updated ${new Date(lastSaved).toLocaleString("en-IN")}` : "Using built-in defaults"}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm mt-5 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
                <div className="p-6 space-y-5">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">Eyebrow / small label</label>
                        <input className={inputClass} value={form.eyebrow} maxLength={60}
                            onChange={(e) => setField("eyebrow", e.target.value)} placeholder="EASY 3-STEP PROCESS" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">Heading *</label>
                        <input className={inputClass} value={form.heading} maxLength={120}
                            onChange={(e) => setField("heading", e.target.value)} placeholder="How Custom Printing & Gifting Works" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">Sub-heading</label>
                        <textarea className={`${inputClass} resize-none`} rows={2} value={form.subheading} maxLength={240}
                            onChange={(e) => setField("subheading", e.target.value)}
                            placeholder="Personalized gifts created in minutes, delivered right at your doorstep." />
                    </div>

                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Steps ({form.steps.length}/{MAX_STEPS})</label>
                            <button type="button" onClick={addStep} disabled={form.steps.length >= MAX_STEPS}
                                className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 disabled:opacity-40 cursor-pointer">
                                <FaPlus size={9} /> Add step
                            </button>
                        </div>

                        <div className="space-y-3">
                            {form.steps.map((s, idx) => (
                                <div key={idx} className="border border-stone-200 rounded-xl p-3.5 bg-stone-50/60">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <span className="text-[11px] font-black text-zinc-400">STEP {idx + 1}</span>
                                        <div className="flex items-center gap-1">
                                            <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-stone-200 disabled:opacity-30 cursor-pointer">
                                                <FaArrowUp size={10} />
                                            </button>
                                            <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === form.steps.length - 1}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-stone-200 disabled:opacity-30 cursor-pointer">
                                                <FaArrowDown size={10} />
                                            </button>
                                            <button type="button" onClick={() => removeStep(idx)} disabled={form.steps.length <= 1}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer">
                                                <FaTrashAlt size={10} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-[64px_80px_1fr] gap-2 mb-2">
                                        <input className={inputClass} value={s.icon} maxLength={8}
                                            onChange={(e) => setStep(idx, "icon", e.target.value)} placeholder="🎁" />
                                        <input className={inputClass} value={s.label} maxLength={6}
                                            onChange={(e) => setStep(idx, "label", e.target.value)} placeholder="01" />
                                        <input className={inputClass} value={s.title} maxLength={80}
                                            onChange={(e) => setStep(idx, "title", e.target.value)} placeholder="Step title" />
                                    </div>
                                    <textarea className={`${inputClass} resize-none`} rows={2} value={s.desc} maxLength={240}
                                        onChange={(e) => setStep(idx, "desc", e.target.value)} placeholder="Short description shown under the title" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button onClick={save} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm shadow-amber-200">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : <><FaSave size={12} /> Save & Publish</>}
                        </button>
                        <button onClick={resetDefaults} type="button"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-zinc-500 font-bold text-sm hover:bg-stone-50 transition-all cursor-pointer">
                            <FaUndo size={11} /> Reset to defaults
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminHomeContent;
