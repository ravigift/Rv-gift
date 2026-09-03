import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/adminApi";
import {
    FaArrowLeft, FaUpload, FaTimes, FaPlus,
    FaTag, FaRupeeSign, FaList, FaBoxes, FaStar
} from "react-icons/fa";
import { CATEGORIES } from "../data/categories";

const inputClass = "w-full px-4 py-3 border border-stone-200 rounded-xl text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all bg-stone-50 focus:bg-white";

const MAX_IMAGES = 5;
const fileKey = (f) => `${f.name}_${f.size}_${f.lastModified}`;

const OPTION_LABEL_SUGGESTIONS = ["Size", "Volume", "Weight", "Dimensions", "Pack", "Color", "Flavour", "Length", "Wattage", "Model"];
const OPTION_VALUE_PRESETS = {
    Size: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
    Volume: ["50 ml", "100 ml", "200 ml", "500 ml", "1 L"],
    Pack: ["Pack of 1", "Pack of 2", "Pack of 3", "Pack of 6"],
    Dimensions: ['4x6 in', '5x7 in', '6x8 in', '8x10 in', '8x12 in', 'A4'],
};
const SPEC_KEY_SUGGESTIONS = [
    "Material", "Color", "Brand", "Pack of", "Fabric", "Fit", "Pattern",
    "Fragrance", "Volume", "Bulb Type", "Wattage", "Power Source", "Battery",
    "Warranty", "Occasion", "Care", "Country of Origin", "Finish", "Shape", "Theme",
];

const AdminEditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "", description: "", price: "", mrp: "",
        category: "", isCustomizable: false, tags: "", stock: "", sku: "", isPublished: true,
        sizeLabel: "Size",
        weight: "500", length: "10", breadth: "10", height: "10",
    });
    const [dirty, setDirty] = useState(false);

    const [images, setImages] = useState([]);
    const [currentImages, setCurrentImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [sizeInput, setSizeInput] = useState("");
    const [highlights, setHighlights] = useState([{ key: "", value: "" }]);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    /* ── Load Product ── */
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/products/${id}`);
                setForm({
                    name: data.name || "",
                    description: data.description || "",
                    price: data.price?.toString() || "",
                    mrp: data.mrp?.toString() || "",
                    category: data.category || "",
                    isCustomizable: Boolean(data.isCustomizable),
                    tags: data.tags?.join(", ") || "",
                    stock: data.stock?.toString() ?? "0",
                    sku: data.sku || "",
                    isPublished: data.isPublished !== false,
                    sizeLabel: data.sizeLabel || "Size",
                    weight: (data.weight ?? 500).toString(),
                    length: (data.dimensions?.length ?? 10).toString(),
                    breadth: (data.dimensions?.breadth ?? 10).toString(),
                    height: (data.dimensions?.height ?? 10).toString(),
                });
                setCurrentImages(data.images || []);
                if (data.sizes?.length > 0) setSelectedSizes(data.sizes);
                if (data.highlights && Object.keys(data.highlights).length > 0) {
                    const entries = data.highlights instanceof Map
                        ? [...data.highlights.entries()]
                        : Object.entries(data.highlights);
                    setHighlights(entries.map(([key, value]) => ({ key, value })));
                }
            } catch {
                setError("Failed to load product");
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
        setError("");
        setDirty(true);
    };

    useEffect(() => {
        const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    const addSizeOption = (raw) => {
        const v = String(raw).replace(/\s+/g, " ").trim().slice(0, 24);
        if (!v) return;
        setSelectedSizes(prev =>
            prev.some(s => s.toLowerCase() === v.toLowerCase()) || prev.length >= 15 ? prev : [...prev, v]
        );
        setSizeInput("");
        setDirty(true);
    };
    const removeSizeOption = (v) => {
        setSelectedSizes(prev => prev.filter(s => s !== v));
        setDirty(true);
    };
    const handleSizeKeyDown = (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addSizeOption(sizeInput);
        } else if (e.key === "Backspace" && !sizeInput && selectedSizes.length) {
            removeSizeOption(selectedSizes[selectedSizes.length - 1]);
        }
    };

    const updateHighlight = (idx, field, value) => {
        setHighlights(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
    };

    const addHighlight = () => setHighlights(prev => [...prev, { key: "", value: "" }]);
    const removeHighlight = (idx) => setHighlights(prev => prev.filter((_, i) => i !== idx));

    // Previews stay in sync with `images` — rebuilt on every change, old blob URLs revoked
    useEffect(() => {
        const urls = images.map(f => URL.createObjectURL(f));
        setPreviewImages(urls);
        return () => urls.forEach(u => URL.revokeObjectURL(u));
    }, [images]);

    const handleImageChange = (e) => {
        const picked = Array.from(e.target.files);
        e.target.value = ""; // allow re-selecting the same file later
        if (!picked.length) return;

        const valid = [];
        for (const file of picked) {
            if (!file.type.startsWith("image/")) { setError(`${file.name} is not an image`); continue; }
            if (file.size / (1024 * 1024) > 5) { setError(`${file.name} exceeds 5MB limit`); continue; }
            valid.push(file);
        }
        if (!valid.length) return;

        setImages(prev => {
            const seen = new Set(prev.map(fileKey));
            const merged = [...prev];
            for (const f of valid) {
                if (seen.has(fileKey(f))) continue;
                seen.add(fileKey(f));
                merged.push(f);
            }
            if (merged.length > MAX_IMAGES) {
                setError(`Maximum ${MAX_IMAGES} images allowed — extra images skipped`);
                return merged.slice(0, MAX_IMAGES);
            }
            setError("");
            return merged;
        });
    };

    const removeNewImage = (idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
        setError("");
    };

    // Move a new image to the front — it becomes the "Main" / cover image
    const makeMain = (idx) => {
        setImages(prev => {
            if (idx <= 0 || idx >= prev.length) return prev;
            const next = [...prev];
            const [picked] = next.splice(idx, 1);
            next.unshift(picked);
            return next;
        });
    };

    // ✅ Live discount preview
    const discountPct = form.mrp && form.price && Number(form.mrp) > Number(form.price)
        ? Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100)
        : null;

    /* ── Submit ── */
    const submitHandler = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || form.name.trim().length < 2) return setError("Product name must be at least 2 characters");
        if (form.name.length > 300) return setError("Product name is too long (max 300)");
        if (form.description.length > 5000) return setError("Description is too long (max 5000)");
        if (form.sku.trim() && !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,39}$/.test(form.sku.trim()))
            return setError("SKU may use letters, numbers, - . _ / (max 40 chars)");
        if (!form.price || Number(form.price) <= 0) return setError("Enter a valid price");
        if (!form.category) return setError("Please select a category");
        if (!CATEGORIES.some(c => c.value === form.category)) return setError("Please select a valid category");
        if (form.mrp && Number(form.mrp) < Number(form.price)) return setError("MRP cannot be less than selling price");
        if (form.stock === "" || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0)
            return setError("Enter a valid whole-number stock quantity (0 or more)");
        if (!form.weight || Number(form.weight) < 1 || Number(form.weight) > 30000)
            return setError("Enter a valid weight in grams (1–30000)");
        for (const [k, label] of [["length", "Length"], ["breadth", "Breadth"], ["height", "Height"]]) {
            const n = Number(form[k]);
            if (!n || n < 1 || n > 200) return setError(`${label} must be between 1 and 200 cm`);
        }

        try {
            setSaving(true);
            setError("");

            const formData = new FormData();
            formData.append("name", form.name.trim());
            formData.append("description", form.description.trim());
            formData.append("price", Number(form.price));
            if (form.mrp && Number(form.mrp) > 0) formData.append("mrp", Number(form.mrp));
            else formData.append("mrp", "");
            formData.append("category", form.category);
            formData.append("sku", form.sku.trim()); // empty string → backend clears it
            formData.append("isPublished", form.isPublished ? "true" : "false");
            formData.append("isCustomizable", form.isCustomizable ? "true" : "false");
            formData.append("stock", Number(form.stock));
            formData.append("weight", Number(form.weight));
            formData.append("length", Number(form.length));
            formData.append("breadth", Number(form.breadth));
            formData.append("height", Number(form.height));
            if (form.tags.trim()) formData.append("tags", form.tags.trim());
            images.forEach(img => formData.append("images", img));
            {
                const pending = sizeInput.replace(/\s+/g, " ").trim();
                const allSizes = pending && !selectedSizes.some(s => s.toLowerCase() === pending.toLowerCase())
                    ? [...selectedSizes, pending]
                    : selectedSizes;
                formData.append("sizeLabel", (form.sizeLabel || "Size").trim());
                formData.append("sizes", JSON.stringify(allSizes));
            }

            const validHighlights = highlights.filter(h => h.key.trim() && h.value.trim());
            const highlightObj = {};
            validHighlights.forEach(h => { highlightObj[h.key.trim()] = h.value.trim(); });
            formData.append("highlights", JSON.stringify(highlightObj));

            await api.put(`/products/${id}`, formData);
            setDirty(false);
            showToast("success", "Product updated successfully! ✨");
            setTimeout(() => navigate("/admin/products"), 1500);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update product");
            showToast("error", "Failed to update product");
        } finally {
            setSaving(false);
        }
    };

    const stockNum = Number(form.stock);
    const stockStatus = form.stock === ""
        ? null
        : stockNum === 0
            ? { label: "Out of Stock — product will be hidden from store", color: "text-red-500 bg-red-50 border-red-200" }
            : stockNum <= 5
                ? { label: `Low Stock — only ${stockNum} left`, color: "text-amber-600 bg-amber-50 border-amber-200" }
                : { label: `In Stock — ${stockNum} units available`, color: "text-emerald-600 bg-emerald-50 border-emerald-200" };

    if (loading) return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(60px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>

            {toast && (
                <div style={{
                    position: "fixed", top: 24, right: 24, zIndex: 9999,
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "13px 20px",
                    background: toast.type === "success"
                        ? "linear-gradient(135deg,#f59e0b,#f97316)"
                        : "linear-gradient(135deg,#ef4444,#dc2626)",
                    color: "#fff", borderRadius: 14, fontWeight: 700, fontSize: 14,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                    animation: "slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)",
                    fontFamily: "'DM Sans', sans-serif", minWidth: 240,
                }}>
                    <span style={{ fontSize: 20 }}>{toast.type === "success" ? "✅" : "❌"}</span>
                    {toast.msg}
                </div>
            )}

            <div className="max-w-3xl mx-auto px-4 py-8">

                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate("/admin/products")}
                        className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer">
                        <FaArrowLeft size={13} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900">Edit Product</h1>
                        <p className="text-zinc-400 text-sm">Update product details below</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

                    <form onSubmit={submitHandler} className="p-6 space-y-5">

                        {/* Name */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide block">Product Name *</label>
                                <span className={`text-[11px] ${form.name.length > 300 ? "text-red-500" : "text-zinc-400"}`}>{form.name.length}/300</span>
                            </div>
                            <input name="name" value={form.name} onChange={handleChange} maxLength={320}
                                placeholder="e.g. Premium Leather Wallet" className={inputClass} />
                        </div>

                        {/* Description */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide block">Description</label>
                                <span className={`text-[11px] ${form.description.length > 5000 ? "text-red-500" : "text-zinc-400"}`}>{form.description.length}/5000</span>
                            </div>
                            <textarea name="description" value={form.description} onChange={handleChange} maxLength={5200}
                                placeholder="Describe your product..." rows={3}
                                className={`${inputClass} resize-none`} />
                        </div>

                        {/* SKU + Publish */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">
                                    SKU <span className="text-zinc-400 font-normal normal-case">(optional, unique)</span>
                                </label>
                                <input name="sku" value={form.sku} onChange={handleChange} maxLength={40}
                                    placeholder="e.g. WALLET-BRN-01"
                                    className={inputClass} style={{ textTransform: "uppercase" }} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">Visibility</label>
                                <button type="button"
                                    onClick={() => { setForm(p => ({ ...p, isPublished: !p.isPublished })); setDirty(true); }}
                                    className={`w-full h-[46px] rounded-xl border text-sm font-bold transition-all cursor-pointer ${form.isPublished ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-stone-100 border-stone-300 text-zinc-500"}`}>
                                    {form.isPublished ? "● Published (live)" : "○ Draft (hidden)"}
                                </button>
                            </div>
                        </div>

                        {/* ✅ Price + MRP */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">Selling Price (₹) *</label>
                                <div className="relative">
                                    <FaRupeeSign size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input type="number" name="price" value={form.price} onChange={handleChange}
                                        placeholder="0" min="1" className={`${inputClass} pl-9`} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">
                                    MRP / Original Price (₹)
                                    <span className="text-zinc-400 font-normal normal-case ml-1">(optional)</span>
                                </label>
                                <div className="relative">
                                    <FaRupeeSign size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input type="number" name="mrp" value={form.mrp} onChange={handleChange}
                                        placeholder="0" min="1" className={`${inputClass} pl-9`} />
                                </div>
                            </div>
                        </div>

                        {/* ✅ Live discount preview */}
                        {discountPct && (
                            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                                <span className="text-emerald-700 font-black text-sm">🏷️ {discountPct}% off</span>
                                <span className="text-zinc-400 text-xs">·</span>
                                <span className="text-emerald-600 text-xs font-semibold">
                                    Customer saves ₹{(Number(form.mrp) - Number(form.price)).toLocaleString("en-IN")}
                                </span>
                            </div>
                        )}

                        {/* Category */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">Category *</label>
                            <div className="relative">
                                <FaList size={11} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <select name="category" value={form.category} onChange={handleChange}
                                    className={`${inputClass} pl-9 appearance-none cursor-pointer`}>
                                    <option value="">Select category</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Stock */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">Stock Quantity *</label>
                            <div className="relative">
                                <FaBoxes size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input type="number" name="stock" value={form.stock} onChange={handleChange}
                                    placeholder="e.g. 10" min="0" className={`${inputClass} pl-9`} />
                            </div>
                            {stockStatus && (
                                <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${stockStatus.color}`}>
                                    <FaBoxes size={9} />
                                    {stockStatus.label}
                                </div>
                            )}
                        </div>

                        {/* Shipping — weight & dimensions */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">
                                Shipping Details *
                                <span className="text-zinc-400 font-normal normal-case ml-1">(used to calculate delivery / courier cost)</span>
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <span className="text-[11px] text-zinc-400 font-semibold mb-1 block">Weight (g)</span>
                                    <input type="number" name="weight" value={form.weight} onChange={handleChange}
                                        min="1" max="30000" placeholder="500" className={inputClass} />
                                </div>
                                <div>
                                    <span className="text-[11px] text-zinc-400 font-semibold mb-1 block">Length (cm)</span>
                                    <input type="number" name="length" value={form.length} onChange={handleChange}
                                        min="1" max="200" placeholder="10" className={inputClass} />
                                </div>
                                <div>
                                    <span className="text-[11px] text-zinc-400 font-semibold mb-1 block">Breadth (cm)</span>
                                    <input type="number" name="breadth" value={form.breadth} onChange={handleChange}
                                        min="1" max="200" placeholder="10" className={inputClass} />
                                </div>
                                <div>
                                    <span className="text-[11px] text-zinc-400 font-semibold mb-1 block">Height (cm)</span>
                                    <input type="number" name="height" value={form.height} onChange={handleChange}
                                        min="1" max="200" placeholder="10" className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">
                                Tags <span className="text-zinc-400 font-normal normal-case">(comma separated)</span>
                            </label>
                            <div className="relative">
                                <FaTag size={11} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input name="tags" value={form.tags} onChange={handleChange}
                                    placeholder="e.g. gift, birthday, men" className={`${inputClass} pl-9`} />
                            </div>
                        </div>

                        {/* Variant Options — custom per product */}
                        <datalist id="opt-label-list">
                            {OPTION_LABEL_SUGGESTIONS.map(l => <option key={l} value={l} />)}
                        </datalist>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2 block">
                                Variant Options <span className="text-zinc-400 font-normal normal-case">(optional — e.g. Size, Volume, Pack)</span>
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input list="opt-label-list" value={form.sizeLabel} name="sizeLabel" onChange={handleChange}
                                    placeholder="Option name (Size / Volume …)"
                                    className={`${inputClass} max-w-[200px]`} maxLength={24} />
                            </div>
                            <div className="flex flex-wrap items-center gap-2 px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 focus-within:ring-2 focus-within:ring-amber-400 min-h-[46px]">
                                {selectedSizes.map(s => (
                                    <span key={s} className="inline-flex items-center gap-1 bg-zinc-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                                        {s}
                                        <button type="button" onClick={() => removeSizeOption(s)} className="hover:text-red-300 cursor-pointer">
                                            <FaTimes size={9} />
                                        </button>
                                    </span>
                                ))}
                                <input value={sizeInput}
                                    onChange={e => setSizeInput(e.target.value)}
                                    onKeyDown={handleSizeKeyDown}
                                    onBlur={() => sizeInput.trim() && addSizeOption(sizeInput)}
                                    placeholder={selectedSizes.length ? "Add another…" : `Type a ${(form.sizeLabel || "size").toLowerCase()} value, press Enter`}
                                    className="flex-1 min-w-[140px] bg-transparent text-sm outline-none py-1"
                                    maxLength={24} />
                            </div>
                            {OPTION_VALUE_PRESETS[form.sizeLabel]?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {OPTION_VALUE_PRESETS[form.sizeLabel]
                                        .filter(p => !selectedSizes.some(s => s.toLowerCase() === p.toLowerCase()))
                                        .map(p => (
                                            <button key={p} type="button" onClick={() => addSizeOption(p)}
                                                className="text-[11px] font-semibold text-zinc-500 border border-dashed border-stone-300 rounded-lg px-2 py-0.5 hover:border-amber-400 hover:text-amber-600 cursor-pointer">
                                                + {p}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* Specifications — free-form key/value */}
                        <datalist id="spec-key-list">
                            {SPEC_KEY_SUGGESTIONS.map(k => <option key={k} value={k} />)}
                        </datalist>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2 block">
                                Specifications <span className="text-zinc-400 font-normal normal-case">(optional — any key / value)</span>
                            </label>
                            <div className="space-y-2">
                                {highlights.map((h, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input list="spec-key-list" value={h.key} onChange={e => updateHighlight(idx, "key", e.target.value)}
                                            placeholder="Key (e.g. Material)" maxLength={40}
                                            className="flex-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-zinc-700" />
                                        <input value={h.value} onChange={e => updateHighlight(idx, "value", e.target.value)}
                                            placeholder="Value" maxLength={200}
                                            className="flex-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-zinc-700" />
                                        {highlights.length > 1 && (
                                            <button type="button" onClick={() => removeHighlight(idx)}
                                                className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer">
                                                <FaTimes size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addHighlight}
                                    className="flex items-center gap-1.5 text-xs text-amber-600 font-bold hover:text-amber-700 mt-1 cursor-pointer">
                                    <FaPlus size={9} /> Add specification
                                </button>
                            </div>
                        </div>

                        {/* Current Images */}
                        {currentImages.length > 0 && previewImages.length === 0 && (
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">Current Images</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {currentImages.map((img, i) => (
                                        <div key={i} className="relative">
                                            <img src={img.url} alt={`product ${i + 1}`}
                                                className="w-full h-20 object-cover rounded-xl border border-stone-200" />
                                            {i === 0 && (
                                                <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Main</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-zinc-400 mt-2">Upload new images below to replace current ones</p>
                            </div>
                        )}

                        {/* Upload New Images */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">
                                {previewImages.length > 0 ? "New Images (will replace current)" : "Replace Images"}
                                <span className="text-zinc-400 font-normal normal-case"> (optional, max {MAX_IMAGES} · {images.length}/{MAX_IMAGES} selected)</span>
                            </label>
                            {images.length < MAX_IMAGES && (
                                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all group">
                                    <FaUpload size={18} className="text-stone-400 group-hover:text-amber-500 mb-2 transition-colors" />
                                    <p className="text-sm text-zinc-500 group-hover:text-amber-600 font-medium">
                                        {images.length === 0 ? "Click to upload new images" : "Click to add more images"}
                                    </p>
                                    <p className="text-xs text-zinc-400 mt-0.5">PNG, JPG, WEBP · Max 5MB each</p>
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            )}
                            {previewImages.length > 0 && (
                                <div className="grid grid-cols-4 gap-3 mt-3">
                                    {previewImages.map((img, i) => (
                                        <div key={i} className="relative group">
                                            <img src={img} alt={`preview ${i + 1}`}
                                                className="w-full h-20 object-cover rounded-xl border border-stone-200" />
                                            <button type="button" onClick={() => removeNewImage(i)}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                <FaTimes size={8} />
                                            </button>
                                            {i === 0 ? (
                                                <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Main</span>
                                            ) : (
                                                <button type="button" onClick={() => makeMain(i)}
                                                    className="absolute bottom-1 left-1 flex items-center gap-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                    <FaStar size={7} /> Set main
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {previewImages.length < MAX_IMAGES && (
                                        <label className="w-full h-20 border-2 border-dashed border-stone-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-amber-400 transition-colors">
                                            <FaPlus size={16} className="text-stone-400" />
                                            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Customizable Toggle */}
                        <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
                            <div>
                                <p className="font-semibold text-zinc-700 text-sm">Customizable Product</p>
                                <p className="text-xs text-zinc-400 mt-0.5">Customers can request custom designs</p>
                            </div>
                            <button type="button"
                                onClick={() => setForm(prev => ({ ...prev, isCustomizable: !prev.isCustomizable }))}
                                className={`relative w-11 h-6 rounded-full transition-all duration-300 cursor-pointer ${form.isCustomizable ? "bg-amber-500" : "bg-stone-300"}`}>
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${form.isCustomizable ? "left-5" : "left-0.5"}`} />
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => navigate("/admin/products")}
                                className="flex-1 py-3 rounded-xl border border-stone-200 text-zinc-600 font-semibold text-sm hover:bg-stone-50 transition-all cursor-pointer">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving}
                                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-all active:scale-95 disabled:opacity-60 shadow-md shadow-amber-200 flex items-center justify-center gap-2 cursor-pointer">
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Updating...
                                    </>
                                ) : "Update Product"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminEditProduct;