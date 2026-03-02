import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/adminApi";
import {
    FaArrowLeft, FaUpload, FaTimes, FaPlus,
    FaTag, FaRupeeSign, FaList, FaCheckCircle
} from "react-icons/fa";
import { CATEGORIES } from "../data/categories";

const inputClass = "w-full px-4 py-3 border border-stone-200 rounded-xl text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all bg-stone-50 focus:bg-white";

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const HIGHLIGHT_KEYS = ["Fabric", "Sleeve", "Pattern", "Color", "Pack of", "Collar", "Fit", "Material", "Brand"];

const AdminEditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "", description: "", price: "",
        category: "", isCustomizable: false, tags: "",
    });

    const [images, setImages] = useState([]);
    const [currentImages, setCurrentImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // ✅ Sizes
    const [selectedSizes, setSelectedSizes] = useState([]);

    // ✅ Highlights
    const [highlights, setHighlights] = useState([{ key: "", value: "" }]);

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
                    category: data.category || "",
                    isCustomizable: Boolean(data.isCustomizable),
                    tags: data.tags?.join(", ") || "",
                });
                setCurrentImages(data.images || []);

                // ✅ Load existing sizes
                if (data.sizes?.length > 0) {
                    setSelectedSizes(data.sizes);
                }

                // ✅ Load existing highlights
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
    };

    const toggleSize = (size) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const updateHighlight = (idx, field, value) => {
        setHighlights(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
    };

    const addHighlight = () => setHighlights(prev => [...prev, { key: "", value: "" }]);
    const removeHighlight = (idx) => setHighlights(prev => prev.filter((_, i) => i !== idx));

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        if (files.length > 5) return setError("Maximum 5 images allowed");
        for (const file of files) {
            if (file.size / (1024 * 1024) > 5) return setError(`${file.name} exceeds 5MB limit`);
        }
        setImages(files);
        setPreviewImages(files.map(f => URL.createObjectURL(f)));
        setError("");
    };

    const removeNewImage = (idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
        setPreviewImages(prev => prev.filter((_, i) => i !== idx));
    };

    /* ── Submit ── */
    const submitHandler = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return setError("Product name is required");
        if (!form.price || Number(form.price) <= 0) return setError("Enter a valid price");
        if (!form.category) return setError("Please select a category");

        try {
            setSaving(true);
            setError("");

            const formData = new FormData();
            formData.append("name", form.name.trim());
            formData.append("description", form.description.trim());
            formData.append("price", Number(form.price));
            formData.append("category", form.category);
            formData.append("isCustomizable", form.isCustomizable ? "true" : "false");
            if (form.tags.trim()) formData.append("tags", form.tags.trim());
            images.forEach(img => formData.append("images", img));

            // ✅ Sizes
            formData.append("sizes", JSON.stringify(selectedSizes));

            // ✅ Highlights — only non-empty pairs
            const validHighlights = highlights.filter(h => h.key.trim() && h.value.trim());
            const highlightObj = {};
            validHighlights.forEach(h => { highlightObj[h.key.trim()] = h.value.trim(); });
            formData.append("highlights", JSON.stringify(highlightObj));

            await api.put(`/products/${id}`, formData);
            setSuccess(true);
            setTimeout(() => navigate("/admin/products"), 1200);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update product");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

            <div className="max-w-3xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate("/admin/products")}
                        className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all">
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
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">Product Name *</label>
                            <input name="name" value={form.name} onChange={handleChange}
                                placeholder="e.g. Premium Leather Wallet" className={inputClass} />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">Description</label>
                            <textarea name="description" value={form.description} onChange={handleChange}
                                placeholder="Describe your product..." rows={3} className={`${inputClass} resize-none`} />
                        </div>

                        {/* Price + Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5 block">Price (₹) *</label>
                                <div className="relative">
                                    <FaRupeeSign size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input type="number" name="price" value={form.price} onChange={handleChange}
                                        placeholder="0" min="1" className={`${inputClass} pl-9`} />
                                </div>
                            </div>
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

                        {/* ✅ SIZES */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2 block">
                                Available Sizes <span className="text-zinc-400 font-normal normal-case">(optional)</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {ALL_SIZES.map(size => (
                                    <button key={size} type="button" onClick={() => toggleSize(size)}
                                        className={`w-12 h-10 rounded-xl text-sm font-bold border transition-all ${selectedSizes.includes(size)
                                                ? "bg-zinc-900 text-white border-zinc-900"
                                                : "bg-white text-zinc-600 border-stone-200 hover:border-zinc-400"
                                            }`}>
                                        {size}
                                    </button>
                                ))}
                            </div>
                            {selectedSizes.length > 0 && (
                                <p className="text-xs text-zinc-400 mt-1.5">
                                    Selected: <span className="font-bold text-zinc-600">{selectedSizes.join(", ")}</span>
                                </p>
                            )}
                        </div>

                        {/* ✅ HIGHLIGHTS */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2 block">
                                Product Highlights <span className="text-zinc-400 font-normal normal-case">(optional)</span>
                            </label>
                            <div className="space-y-2">
                                {highlights.map((h, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <select value={h.key} onChange={e => updateHighlight(idx, "key", e.target.value)}
                                            className="flex-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-zinc-700">
                                            <option value="">Select key</option>
                                            {HIGHLIGHT_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                        <input value={h.value} onChange={e => updateHighlight(idx, "value", e.target.value)}
                                            placeholder="Value"
                                            className="flex-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-zinc-700" />
                                        {highlights.length > 1 && (
                                            <button type="button" onClick={() => removeHighlight(idx)}
                                                className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all">
                                                <FaTimes size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addHighlight}
                                    className="flex items-center gap-1.5 text-xs text-amber-600 font-bold hover:text-amber-700 mt-1">
                                    <FaPlus size={9} /> Add highlight
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
                                            <img src={img.url} alt={`product ${i + 1}`} className="w-full h-20 object-cover rounded-xl border border-stone-200" />
                                            {i === 0 && <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Main</span>}
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
                                <span className="text-zinc-400 font-normal normal-case"> (optional, max 5)</span>
                            </label>
                            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all group">
                                <FaUpload size={18} className="text-stone-400 group-hover:text-amber-500 mb-2 transition-colors" />
                                <p className="text-sm text-zinc-500 group-hover:text-amber-600 font-medium">Click to upload new images</p>
                                <p className="text-xs text-zinc-400 mt-0.5">PNG, JPG, WEBP · Max 5MB each</p>
                                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>

                            {previewImages.length > 0 && (
                                <div className="grid grid-cols-4 gap-3 mt-3">
                                    {previewImages.map((img, i) => (
                                        <div key={i} className="relative group">
                                            <img src={img} alt={`preview ${i + 1}`} className="w-full h-20 object-cover rounded-xl border border-stone-200" />
                                            <button type="button" onClick={() => removeNewImage(i)}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FaTimes size={8} />
                                            </button>
                                            {i === 0 && <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Main</span>}
                                        </div>
                                    ))}
                                    {previewImages.length < 5 && (
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
                                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.isCustomizable ? "bg-amber-500" : "bg-stone-300"}`}>
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${form.isCustomizable ? "left-5" : "left-0.5"}`} />
                            </button>
                        </div>

                        {/* Error / Success */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">⚠️ {error}</div>
                        )}
                        {success && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                                <FaCheckCircle /> Product updated! Redirecting...
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => navigate("/admin/products")}
                                className="flex-1 py-3 rounded-xl border border-stone-200 text-zinc-600 font-semibold text-sm hover:bg-stone-50 transition-all">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving}
                                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-all active:scale-95 disabled:opacity-60 shadow-md shadow-amber-200 flex items-center justify-center gap-2">
                                {saving ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</>
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