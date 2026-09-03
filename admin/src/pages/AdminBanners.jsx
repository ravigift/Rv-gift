import { useState, useEffect, useRef } from "react";
import api from "../api/adminApi";
import {
    FaPlus, FaEdit, FaTrashAlt, FaImage, FaEye, FaToggleOn, FaToggleOff,
    FaArrowRight, FaCheckCircle, FaExclamationCircle, FaTimes, FaLayerGroup,
    FaPaintBrush, FaTag, FaLink, FaSortNumericDown, FaBolt, FaUpload
} from "react-icons/fa";

const THEMES = [
    { id: "dark-luxury", name: "Dark Luxury", bg: "linear-gradient(135deg,#0a0f1a 0%,#111827 50%,#1a1207 100%)", text: "#fff", accent: "#f59e0b" },
    { id: "amber-gold", name: "Amber Glow", bg: "linear-gradient(135deg,#78350f 0%,#b45309 50%,#d97706 100%)", text: "#fff", accent: "#fef08a" },
    { id: "royal-indigo", name: "Royal Indigo", bg: "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%)", text: "#fff", accent: "#a5b4fc" },
    { id: "rose-romance", name: "Rose Romance", bg: "linear-gradient(135deg,#831843 0%,#9d174d 50%,#be185d 100%)", text: "#fff", accent: "#fbcfe8" },
    { id: "emerald-festive", name: "Emerald Festive", bg: "linear-gradient(135deg,#064e3b 0%,#047857 50%,#059669 100%)", text: "#fff", accent: "#6ee7b7" },
];

const QUICK_LINKS = [
    { label: "All Products", link: "#products-section" },
    { label: "Customizable Gifts", link: "/?customizable=true" },
    { label: "Photo Frames", link: "/?category=photo-frame" },
    { label: "Printed Mugs", link: "/?category=mug-bottle" },
    { label: "LED Lamps", link: "/?category=led-lamp" },
    { label: "T-Shirts", link: "/?category=custom-tshirt" },
    { label: "Contact Us", link: "/contact" },
];

const INITIAL_FORM = {
    title: "",
    highlightText: "",
    subtitle: "",
    badgeText: "",           // Badge pill (e.g. ✨ Premium Gift Store) — Leave empty for none
    offerTag: "",
    ctaText: "Shop Now",
    ctaLink: "#products-section",
    secondaryCtaText: "Customize 🎨",
    secondaryCtaLink: "/?customizable=true",
    theme: "dark-luxury",
    bannerType: "image-only", // "image-only" (pure original image) | "with-text" (text overlay)
    overlayStyle: "none",    // "none" | "subtle" | "dark"
    textColor: "#ffffff",    // "#ffffff" (White) | "#0f172a" (Dark / Charcoal) or custom hex
    accentColor: "#f59e0b",  // Accent/highlight font color
    isActive: true,
    order: 0,
};

const AdminBanners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const fileInputRef = useRef(null);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const res = await api.get("/banners/admin");
            if (res.data?.success) {
                setBanners(res.data.banners || []);
            }
        } catch (err) {
            console.error("Fetch Banners Error:", err);
            showToast("error", err.response?.data?.message || "Failed to load banners");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const openAddModal = () => {
        setEditingBanner(null);
        setForm({
            ...INITIAL_FORM,
            order: banners.length,
        });
        setImageFile(null);
        setImagePreview("");
        setError("");
        setModalOpen(true);
    };

    const openEditModal = (banner) => {
        setEditingBanner(banner);
        setForm({
            title: banner.title || "",
            highlightText: banner.highlightText || "",
            subtitle: banner.subtitle || "",
            badgeText: banner.badgeText || "",
            offerTag: banner.offerTag || "",
            ctaText: banner.ctaText || "Shop Now",
            ctaLink: banner.ctaLink || "#products-section",
            secondaryCtaText: banner.secondaryCtaText || "Customize 🎨",
            secondaryCtaLink: banner.secondaryCtaLink || "/?customizable=true",
            theme: banner.theme || "dark-luxury",
            bannerType: banner.bannerType || (banner.image?.url && !banner.subtitle ? "image-only" : "with-text"),
            overlayStyle: banner.overlayStyle || "none",
            textColor: banner.textColor || "#ffffff",
            accentColor: banner.accentColor || "#f59e0b",
            isActive: banner.isActive !== undefined ? banner.isActive : true,
            order: banner.order || 0,
        });
        setImageFile(null);
        setImagePreview(banner.image?.url || "");
        setError("");
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingBanner(null);
        setImageFile(null);
        setImagePreview("");
        setError("");
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file (PNG, JPG, WEBP)");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5MB");
            return;
        }

        setError("");
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) {
            setError("Banner title / internal name is required");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("highlightText", form.highlightText);
            formData.append("subtitle", form.subtitle);
            formData.append("badgeText", form.badgeText);
            formData.append("offerTag", form.offerTag);
            formData.append("ctaText", form.ctaText);
            formData.append("ctaLink", form.ctaLink);
            formData.append("secondaryCtaText", form.secondaryCtaText);
            formData.append("secondaryCtaLink", form.secondaryCtaLink);
            formData.append("theme", form.theme);
            formData.append("bannerType", form.bannerType);
            formData.append("overlayStyle", form.overlayStyle);
            formData.append("textColor", form.textColor);
            formData.append("accentColor", form.accentColor);
            formData.append("isActive", form.isActive);
            formData.append("order", form.order);

            if (imageFile) {
                formData.append("image", imageFile);
            }

            if (editingBanner) {
                const res = await api.put(`/banners/${editingBanner._id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                if (res.data?.success) {
                    showToast("success", "Banner updated successfully!");
                    closeModal();
                    fetchBanners();
                }
            } else {
                const res = await api.post("/banners", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                if (res.data?.success) {
                    showToast("success", "Hero Banner created successfully!");
                    closeModal();
                    fetchBanners();
                }
            }
        } catch (err) {
            console.error("Save Banner Error:", err);
            setError(err.response?.data?.message || "Failed to save banner");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (banner) => {
        try {
            const res = await api.patch(`/banners/${banner._id}/toggle`);
            if (res.data?.success) {
                setBanners((prev) =>
                    prev.map((b) =>
                        b._id === banner._id ? { ...b, isActive: !b.isActive } : b
                    )
                );
                showToast(
                    "success",
                    `Banner ${!banner.isActive ? "activated" : "deactivated"}!`
                );
            }
        } catch (err) {
            console.error("Toggle Error:", err);
            showToast("error", "Failed to update banner status");
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await api.delete(`/banners/${id}`);
            if (res.data?.success) {
                setBanners((prev) => prev.filter((b) => b._id !== id));
                showToast("success", "Banner deleted successfully!");
                setDeleteConfirmId(null);
            }
        } catch (err) {
            console.error("Delete Error:", err);
            showToast("error", "Failed to delete banner");
        }
    };

    const activeCount = banners.filter((b) => b.isActive).length;
    const currentTheme = THEMES.find((t) => t.id === form.theme) || THEMES[0];

    return (
        <div style={{ padding: "24px 20px", maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
            {/* TOAST */}
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: 20,
                        right: 20,
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 18px",
                        borderRadius: 12,
                        background: toast.type === "success" ? "#065F46" : "#991B1B",
                        color: "#fff",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                        fontSize: 13,
                        fontWeight: 600,
                        animation: "slideIn 0.3s ease",
                    }}
                >
                    {toast.type === "success" ? <FaCheckCircle size={15} /> : <FaExclamationCircle size={15} />}
                    {toast.msg}
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 20 }}>🖼️</span>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                            Home Hero Banners
                        </h1>
                    </div>
                    <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                        Manage dynamic homepage hero banners, promotional offers, images, and CTA buttons.
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", gap: 8, background: "#fff", padding: "6px 12px", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: 12, color: "#64748B" }}>
                            Total: <strong style={{ color: "#0F172A" }}>{banners.length}</strong>
                        </div>
                        <span style={{ color: "#CBD5E1" }}>|</span>
                        <div style={{ fontSize: 12, color: "#10B981" }}>
                            Active: <strong>{activeCount}</strong>
                        </div>
                    </div>

                    <button
                        onClick={openAddModal}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 18px",
                            background: "linear-gradient(135deg, #F59E0B, #D97706)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                            boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                            transition: "all 0.15s ease",
                        }}
                    >
                        <FaPlus size={11} /> Add New Banner
                    </button>
                </div>
            </div>

            {/* BANNER LIST */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <div style={{ width: 36, height: 36, border: "3px solid #F59E0B", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
                    <p style={{ color: "#64748B", fontSize: 13 }}>Loading banners...</p>
                </div>
            ) : banners.length === 0 ? (
                <div
                    style={{
                        background: "#fff",
                        borderRadius: 20,
                        border: "2px dashed #CBD5E1",
                        padding: "48px 24px",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
                        No Custom Banners Yet
                    </h3>
                    <p style={{ fontSize: 13, color: "#64748B", maxWidth: 450, margin: "0 auto 20px" }}>
                        Currently the default store banner is shown on the homepage. Create your first dynamic hero banner with custom images and promotions!
                    </p>
                    <button
                        onClick={openAddModal}
                        style={{
                            padding: "10px 20px",
                            background: "#F59E0B",
                            color: "#fff",
                            border: "none",
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                        }}
                    >
                        + Create First Banner
                    </button>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
                    {banners.map((banner, index) => {
                        const themeObj = THEMES.find((t) => t.id === banner.theme) || THEMES[0];
                        return (
                            <div
                                key={banner._id}
                                style={{
                                    background: "#fff",
                                    borderRadius: 18,
                                    border: "1px solid #E2E8F0",
                                    overflow: "hidden",
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                                    display: "flex",
                                    flexDirection: "column",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {/* MINI PREVIEW HEADER */}
                                <div
                                    style={{
                                        background: themeObj.bg,
                                        padding: "20px 18px",
                                        position: "relative",
                                        minHeight: 140,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div style={{ flex: 1, zIndex: 2, paddingRight: 10 }}>
                                        {banner.badgeText && (
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    fontSize: 10,
                                                    fontWeight: 800,
                                                    color: themeObj.accent,
                                                    background: "rgba(255,255,255,0.1)",
                                                    padding: "2px 8px",
                                                    borderRadius: 20,
                                                    border: `1px solid ${themeObj.accent}40`,
                                                    marginBottom: 6,
                                                }}
                                            >
                                                {banner.badgeText}
                                            </span>
                                        )}
                                        <h3
                                            style={{
                                                fontSize: 16,
                                                fontWeight: 800,
                                                color: themeObj.text,
                                                margin: "0 0 4px",
                                                lineHeight: 1.25,
                                            }}
                                        >
                                            {banner.title}{" "}
                                            {banner.highlightText && (
                                                <span style={{ color: themeObj.accent, fontStyle: "italic" }}>
                                                    {banner.highlightText}
                                                </span>
                                            )}
                                        </h3>
                                        {banner.subtitle && (
                                            <p
                                                style={{
                                                    fontSize: 11,
                                                    color: "rgba(255,255,255,0.7)",
                                                    margin: 0,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {banner.subtitle}
                                            </p>
                                        )}
                                    </div>

                                    {/* Image Thumbnail */}
                                    <div
                                        style={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: 12,
                                            background: "rgba(255,255,255,0.1)",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                            overflow: "hidden",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            zIndex: 2,
                                        }}
                                    >
                                        {banner.image?.url ? (
                                            <img
                                                src={banner.image.url}
                                                alt={banner.title}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <FaImage color="rgba(255,255,255,0.4)" size={24} />
                                        )}
                                    </div>
                                </div>

                                {/* DETAILS */}
                                <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {banner.offerTag && (
                                            <span style={{ fontSize: 10, fontWeight: 700, background: "#FEF3C7", color: "#B45309", padding: "2px 8px", borderRadius: 6 }}>
                                                🏷️ {banner.offerTag}
                                            </span>
                                        )}
                                        <span style={{ fontSize: 10, fontWeight: 600, background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: 6 }}>
                                            Theme: {themeObj.name}
                                        </span>
                                        <span style={{ fontSize: 10, fontWeight: 600, background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: 6 }}>
                                            Order: #{banner.order}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: 11, color: "#64748B", display: "flex", gap: 8, alignItems: "center" }}>
                                        <span>CTA: <strong>{banner.ctaText}</strong> ({banner.ctaLink})</span>
                                    </div>

                                    {/* ACTIONS BAR */}
                                    <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        {/* ACTIVE STATUS TOGGLE */}
                                        <button
                                            onClick={() => handleToggleActive(banner)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                padding: "5px 10px",
                                                borderRadius: 8,
                                                border: "none",
                                                background: banner.isActive ? "#ECFDF5" : "#FEF2F2",
                                                color: banner.isActive ? "#059669" : "#DC2626",
                                                fontSize: 11,
                                                fontWeight: 700,
                                                cursor: "pointer",
                                            }}
                                        >
                                            {banner.isActive ? <FaToggleOn size={16} /> : <FaToggleOff size={16} />}
                                            {banner.isActive ? "Active (Visible)" : "Hidden"}
                                        </button>

                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button
                                                onClick={() => openEditModal(banner)}
                                                style={{
                                                    padding: "7px 12px",
                                                    borderRadius: 8,
                                                    background: "#F8FAFC",
                                                    border: "1px solid #CBD5E1",
                                                    color: "#334155",
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 5,
                                                }}
                                            >
                                                <FaEdit size={11} /> Edit
                                            </button>

                                            {deleteConfirmId === banner._id ? (
                                                <div style={{ display: "flex", gap: 4 }}>
                                                    <button
                                                        onClick={() => handleDelete(banner._id)}
                                                        style={{
                                                            padding: "7px 10px",
                                                            borderRadius: 8,
                                                            background: "#DC2626",
                                                            border: "none",
                                                            color: "#fff",
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(null)}
                                                        style={{
                                                            padding: "7px 10px",
                                                            borderRadius: 8,
                                                            background: "#F1F5F9",
                                                            border: "none",
                                                            color: "#64748B",
                                                            fontSize: 11,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteConfirmId(banner._id)}
                                                    style={{
                                                        padding: "7px 10px",
                                                        borderRadius: 8,
                                                        background: "#FEF2F2",
                                                        border: "1px solid #FCA5A5",
                                                        color: "#DC2626",
                                                        fontSize: 12,
                                                        cursor: "pointer",
                                                    }}
                                                    title="Delete Banner"
                                                >
                                                    <FaTrashAlt size={11} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ADD / EDIT BANNER MODAL */}
            {modalOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1000,
                        background: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: 20,
                            maxWidth: 800,
                            width: "100%",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {/* MODAL HEADER */}
                        <div
                            style={{
                                padding: "18px 24px",
                                borderBottom: "1px solid #E2E8F0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                position: "sticky",
                                top: 0,
                                background: "#fff",
                                zIndex: 10,
                            }}
                        >
                            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                                {editingBanner ? "Edit Hero Banner" : "Create New Hero Banner"}
                            </h2>
                            <button
                                onClick={closeModal}
                                style={{
                                    background: "#F1F5F9",
                                    border: "none",
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: "#64748B",
                                }}
                            >
                                <FaTimes size={13} />
                            </button>
                        </div>

                        {/* MODAL FORM */}
                        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
                            {error && (
                                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 18 }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* BANNER MODE SELECTOR */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#1E293B", marginBottom: 8 }}>
                                    Banner Display Type:
                                </label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div
                                        onClick={() => setForm(prev => ({ ...prev, bannerType: "image-only" }))}
                                        style={{
                                            border: form.bannerType === "image-only" ? "2px solid #F59E0B" : "2px solid #E2E8F0",
                                            background: form.bannerType === "image-only" ? "#FFFBEB" : "#F8FAFC",
                                            borderRadius: 14,
                                            padding: "14px 16px",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontSize: 18 }}>🖼️</span>
                                            <span style={{ fontWeight: 800, fontSize: 13, color: form.bannerType === "image-only" ? "#92400E" : "#334155" }}>
                                                Original Image Only
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                                            Pure original photo/poster. <strong>0 Dark Shadow</strong>, no text overlay. Entire banner is clickable!
                                        </p>
                                    </div>

                                    <div
                                        onClick={() => setForm(prev => ({ ...prev, bannerType: "with-text" }))}
                                        style={{
                                            border: form.bannerType === "with-text" ? "2px solid #F59E0B" : "2px solid #E2E8F0",
                                            background: form.bannerType === "with-text" ? "#FFFBEB" : "#F8FAFC",
                                            borderRadius: 14,
                                            padding: "14px 16px",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontSize: 18 }}>🎨</span>
                                            <span style={{ fontWeight: 800, fontSize: 13, color: form.bannerType === "with-text" ? "#92400E" : "#334155" }}>
                                                Text & Theme Overlay
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                                            Show Title, Subtitle, Badges & "Shop Now" buttons over color theme or photo.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* LIVE PREVIEW SECTION */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                                    Live Preview:
                                </label>
                                {form.bannerType === "image-only" ? (
                                    <div
                                        style={{
                                            borderRadius: 16,
                                            overflow: "hidden",
                                            minHeight: 180,
                                            maxHeight: 220,
                                            background: "#1E293B",
                                            position: "relative",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                                        }}
                                    >
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Original Banner Preview"
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <div style={{ textAlign: "center", color: "#94A3B8", padding: 20 }}>
                                                <FaImage size={32} style={{ margin: "0 auto 8px" }} />
                                                <div style={{ fontSize: 13, fontWeight: 700 }}>Upload an image to see pure original preview</div>
                                                <div style={{ fontSize: 11 }}>Will show at 100% full original brightness with 0 dark shadow</div>
                                            </div>
                                        )}
                                        <div style={{ position: "absolute", bottom: 10, right: 12, background: "rgba(0,0,0,0.7)", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800 }}>
                                            🔗 Links to: {form.ctaLink || "#products-section"}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            background: currentTheme.bg,
                                            borderRadius: 16,
                                            padding: "24px 20px",
                                            color: currentTheme.text,
                                            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                                            display: "flex",
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 20,
                                            minHeight: 180,
                                            position: "relative",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {imagePreview && (
                                            <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: form.overlayStyle === "none" ? 0.9 : 0.6 }}>
                                                <img src={imagePreview} alt="bg" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                {form.overlayStyle === "dark" && (
                                                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
                                                )}
                                                {form.overlayStyle === "subtle" && (
                                                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.7), transparent)" }} />
                                                )}
                                            </div>
                                        )}
                                        <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                                            <div style={{
                                                display: "inline-block",
                                                background: form.textColor === "#0f172a" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.4)",
                                                border: `1px solid ${form.accentColor || currentTheme.accent}60`,
                                                color: form.accentColor || currentTheme.accent,
                                                fontSize: 10,
                                                fontWeight: 800,
                                                padding: "2px 8px",
                                                borderRadius: 20,
                                                marginBottom: 8,
                                                backdropFilter: "blur(4px)",
                                            }}>
                                                {form.badgeText || "✨ Premium Gift Store"}
                                            </div>
                                            <h3 style={{
                                                fontSize: 20,
                                                fontWeight: 900,
                                                margin: "0 0 6px",
                                                lineHeight: 1.2,
                                                color: form.textColor || "#ffffff",
                                                textShadow: form.textColor === "#ffffff" ? "0 2px 8px rgba(0,0,0,0.6)" : "0 1px 4px rgba(255,255,255,0.8)",
                                            }}>
                                                {form.title || "Banner Title Here"}{" "}
                                                {form.highlightText && (
                                                    <span style={{ color: form.accentColor || currentTheme.accent, fontStyle: "italic" }}>
                                                        {form.highlightText}
                                                    </span>
                                                )}
                                            </h3>
                                            <p style={{
                                                fontSize: 12,
                                                color: form.textColor === "#0f172a" ? "#334155" : "rgba(255,255,255,0.9)",
                                                margin: "0 0 14px",
                                                maxWidth: 380,
                                                textShadow: form.textColor === "#ffffff" ? "0 1px 4px rgba(0,0,0,0.6)" : "none",
                                            }}>
                                                {form.subtitle || "Subtitle description will appear here on customer homepage."}
                                            </p>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <span style={{
                                                    background: form.accentColor || currentTheme.accent,
                                                    color: "#111",
                                                    padding: "6px 14px",
                                                    borderRadius: 10,
                                                    fontSize: 11,
                                                    fontWeight: 800,
                                                    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                                                }}>
                                                    {form.ctaText || "Shop Now"} →
                                                </span>
                                                {form.secondaryCtaText && (
                                                    <span style={{
                                                        background: form.textColor === "#0f172a" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.4)",
                                                        color: form.textColor || "#fff",
                                                        border: `1px solid ${form.textColor === "#0f172a" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)"}`,
                                                        padding: "6px 14px",
                                                        borderRadius: 10,
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        backdropFilter: "blur(4px)",
                                                    }}>
                                                        {form.secondaryCtaText}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* IMAGE UPLOAD SECTION (Prominent for both modes) */}
                            <div style={{ marginBottom: 18 }}>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                    Banner Image {form.bannerType === "image-only" ? <span style={{ color: "#DC2626" }}>* (Required for original image mode)</span> : "(Optional)"}
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: "2px dashed #CBD5E1",
                                        borderRadius: 12,
                                        padding: "20px",
                                        textAlign: "center",
                                        cursor: "pointer",
                                        background: imagePreview ? "#F0FDF4" : "#F8FAFC",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: "none" }}
                                    />
                                    <FaUpload size={22} color={imagePreview ? "#10B981" : "#F59E0B"} style={{ marginBottom: 6 }} />
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: "0 0 4px" }}>
                                        {imageFile ? imageFile.name : imagePreview ? "Click to change banner image" : "Click to select or drag banner image"}
                                    </p>
                                    <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
                                        PNG, JPG, WEBP (Max 5MB) — Recommended 1920x600 or 1600x500 for full width hero!
                                    </p>
                                </div>
                            </div>

                            {/* FORM FIELDS BASED ON MODE */}
                            {form.bannerType === "image-only" ? (
                                /* SIMPLIFIED FIELDS FOR ORIGINAL IMAGE MODE */
                                <div style={{ marginBottom: 18, background: "#F8FAFC", padding: 16, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                                    <div style={{ marginBottom: 14 }}>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                            Internal Banner Name <span style={{ color: "#DC2626" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={form.title}
                                            onChange={handleFormChange}
                                            placeholder="e.g. Festive Offer Big Banner"
                                            required
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                                        />
                                        <span style={{ fontSize: 11, color: "#64748B", marginTop: 4, display: "block" }}>
                                            Used in admin list and image alt tag. Will not be drawn over the image.
                                        </span>
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                            Click Destination URL / Link
                                        </label>
                                        <input
                                            type="text"
                                            name="ctaLink"
                                            value={form.ctaLink}
                                            onChange={handleFormChange}
                                            placeholder="e.g. #products-section or /?category=photo-frame"
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* EXPANDED FIELDS FOR TEXT & THEME OVERLAY MODE */
                                <>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 18 }}>
                                        {/* Title */}
                                        <div>
                                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                                Heading Title <span style={{ color: "#DC2626" }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={form.title}
                                                onChange={handleFormChange}
                                                placeholder="e.g. Gifts That Speak"
                                                required
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                                            />
                                        </div>

                                        {/* Highlight Text */}
                                        <div>
                                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                                Highlight / Shimmer Text
                                            </label>
                                            <input
                                                type="text"
                                                name="highlightText"
                                                value={form.highlightText}
                                                onChange={handleFormChange}
                                                placeholder="e.g. From The Heart"
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                                            />
                                        </div>
                                    </div>

                                    {/* Subtitle */}
                                    <div style={{ marginBottom: 18 }}>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                            Subtitle / Tagline Description
                                        </label>
                                        <textarea
                                            name="subtitle"
                                            value={form.subtitle}
                                            onChange={handleFormChange}
                                            rows={2}
                                            placeholder="e.g. Handpicked gifts for every occasion. Personalize with your own touch."
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                                        />
                                    </div>

                                    {/* Badge & Offer Tag */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 18 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                                Top Badge Pill
                                            </label>
                                            <input
                                                type="text"
                                                name="badgeText"
                                                value={form.badgeText}
                                                onChange={handleFormChange}
                                                placeholder="e.g. ✨ Premium Gift Store"
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                                Offer Tag / Discount
                                            </label>
                                            <input
                                                type="text"
                                                name="offerTag"
                                                value={form.offerTag}
                                                onChange={handleFormChange}
                                                placeholder="e.g. Up to 40% OFF"
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                                            />
                                        </div>
                                    </div>

                                    {/* Overlay Style, Theme & Typography Colors */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 18 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                                Shadow / Overlay:
                                            </label>
                                            <select
                                                name="overlayStyle"
                                                value={form.overlayStyle}
                                                onChange={handleFormChange}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, background: "#fff" }}
                                            >
                                                <option value="none">None (0 Dark Shadow — Pure Bright Image)</option>
                                                <option value="subtle">Subtle Shadow (Gentle Gradient)</option>
                                                <option value="dark">Dark Luxury Overlay</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                                Color Palette Theme:
                                            </label>
                                            <select
                                                name="theme"
                                                value={form.theme}
                                                onChange={handleFormChange}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, background: "#fff" }}
                                            >
                                                {THEMES.map(th => (
                                                    <option key={th.id} value={th.id}>{th.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Main Text / Font Color */}
                                        <div>
                                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                                🔤 Title & Subtitle Font Color:
                                            </label>
                                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(p => ({ ...p, textColor: "#ffffff" }))}
                                                    style={{
                                                        padding: "7px 12px",
                                                        borderRadius: 8,
                                                        border: form.textColor === "#ffffff" ? "2px solid #F59E0B" : "1px solid #CBD5E1",
                                                        background: "#0F172A",
                                                        color: "#fff",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    ⚪ White
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(p => ({ ...p, textColor: "#0f172a" }))}
                                                    style={{
                                                        padding: "7px 12px",
                                                        borderRadius: 8,
                                                        border: form.textColor === "#0f172a" ? "2px solid #F59E0B" : "1px solid #CBD5E1",
                                                        background: "#F8FAFC",
                                                        color: "#0F172A",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    ⚫ Dark / Black
                                                </button>
                                                <input
                                                    type="color"
                                                    name="textColor"
                                                    value={form.textColor?.startsWith("#") ? form.textColor : "#ffffff"}
                                                    onChange={handleFormChange}
                                                    title="Custom Color"
                                                    style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #CBD5E1", cursor: "pointer", padding: 1 }}
                                                />
                                            </div>
                                        </div>

                                        {/* Highlight Accent Color */}
                                        <div>
                                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                                ✨ Highlight Text Color:
                                            </label>
                                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(p => ({ ...p, accentColor: "#f59e0b" }))}
                                                    style={{
                                                        padding: "7px 10px",
                                                        borderRadius: 8,
                                                        border: form.accentColor === "#f59e0b" ? "2px solid #0F172A" : "1px solid #CBD5E1",
                                                        background: "#FEF3C7",
                                                        color: "#D97706",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    🟡 Gold
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(p => ({ ...p, accentColor: "#ef4444" }))}
                                                    style={{
                                                        padding: "7px 10px",
                                                        borderRadius: 8,
                                                        border: form.accentColor === "#ef4444" ? "2px solid #0F172A" : "1px solid #CBD5E1",
                                                        background: "#FEE2E2",
                                                        color: "#DC2626",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    🔴 Red
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(p => ({ ...p, accentColor: "#10b981" }))}
                                                    style={{
                                                        padding: "7px 10px",
                                                        borderRadius: 8,
                                                        border: form.accentColor === "#10b981" ? "2px solid #0F172A" : "1px solid #CBD5E1",
                                                        background: "#D1FAE5",
                                                        color: "#059669",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    🟢 Green
                                                </button>
                                                <input
                                                    type="color"
                                                    name="accentColor"
                                                    value={form.accentColor?.startsWith("#") ? form.accentColor : "#f59e0b"}
                                                    onChange={handleFormChange}
                                                    title="Custom Accent Color"
                                                    style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #CBD5E1", cursor: "pointer", padding: 1 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Quick Link Helper (If in with-text mode) */}
                            {form.bannerType === "with-text" && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 18 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                            Primary Button Text
                                        </label>
                                        <input
                                            type="text"
                                            name="ctaText"
                                            value={form.ctaText}
                                            onChange={handleFormChange}
                                            placeholder="e.g. Shop Now"
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                            Primary Button Link
                                        </label>
                                        <input
                                            type="text"
                                            name="ctaLink"
                                            value={form.ctaLink}
                                            onChange={handleFormChange}
                                            placeholder="e.g. #products-section or /?category=photo-frame"
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Quick Link Helper */}
                            <div style={{ marginBottom: 18 }}>
                                <span style={{ fontSize: 11, color: "#64748B", marginRight: 8 }}>Quick Destination Links:</span>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                                    {QUICK_LINKS.map((ql) => (
                                        <button
                                            key={ql.label}
                                            type="button"
                                            onClick={() => setForm((prev) => ({ ...prev, ctaLink: ql.link }))}
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                background: "#F1F5F9",
                                                border: "1px solid #E2E8F0",
                                                padding: "3px 8px",
                                                borderRadius: 6,
                                                color: "#334155",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {ql.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {form.bannerType === "with-text" && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 18 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                            Secondary Button Text (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="secondaryCtaText"
                                            value={form.secondaryCtaText}
                                            onChange={handleFormChange}
                                            placeholder="e.g. Customize 🎨"
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                            Secondary Button Link
                                        </label>
                                        <input
                                            type="text"
                                            name="secondaryCtaLink"
                                            value={form.secondaryCtaLink}
                                            onChange={handleFormChange}
                                            placeholder="e.g. /?customizable=true"
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Order & Active Status */}
                            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                                        Display Order:
                                    </label>
                                    <input
                                        type="number"
                                        name="order"
                                        value={form.order}
                                        onChange={handleFormChange}
                                        min="0"
                                        style={{ width: 70, padding: "6px 10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13 }}
                                    />
                                </div>

                                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#334155" }}>
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={form.isActive}
                                        onChange={handleFormChange}
                                        style={{ width: 16, height: 16, accentColor: "#F59E0B" }}
                                    />
                                    Active (Show on Home Page)
                                </label>
                            </div>

                            {/* SUBMIT BUTTONS */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    style={{
                                        padding: "10px 18px",
                                        borderRadius: 10,
                                        border: "1px solid #CBD5E1",
                                        background: "#fff",
                                        color: "#64748B",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{
                                        padding: "10px 24px",
                                        borderRadius: 10,
                                        border: "none",
                                        background: "linear-gradient(135deg,#F59E0B,#D97706)",
                                        color: "#fff",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: saving ? "not-allowed" : "pointer",
                                        boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
                                        opacity: saving ? 0.7 : 1,
                                    }}
                                >
                                    {saving ? "Saving..." : editingBanner ? "Update Banner" : "Create Banner"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBanners;
