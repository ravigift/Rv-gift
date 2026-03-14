import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/adminApi";
import { imgUrl } from "../utils/imageUrl"; // ✅ Cloudinary optimization
import {
    FaPlus, FaSync, FaEdit, FaTrash, FaSearch,
    FaBoxOpen, FaBoxes,
} from "react-icons/fa";

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [confirmId, setConfirmId] = useState(null);
    const [toast, setToast] = useState(null);
    const [editingStockId, setEditingStockId] = useState(null);
    const [stockInput, setStockInput] = useState("");
    const [savingStockId, setSavingStockId] = useState(null);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true); setError(null);
            const { data } = await api.get("/products");
            const list = Array.isArray(data) ? data : [];
            setProducts(list); setFiltered(list);
        } catch { setError("Failed to load products"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    useEffect(() => {
        if (!search.trim()) return setFiltered(products);
        const q = search.toLowerCase();
        setFiltered(products.filter(p =>
            p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
        ));
    }, [search, products]);

    const deleteHandler = async (id) => {
        try {
            setDeletingId(id);
            await api.delete(`/products/${id}`);
            setProducts(p => p.filter(x => x._id !== id));
            setFiltered(p => p.filter(x => x._id !== id));
            showToast("success", "Product deleted!");
        } catch { showToast("error", "Failed to delete"); }
        finally { setDeletingId(null); setConfirmId(null); }
    };

    const handleStockSave = async (product) => {
        const newStock = parseInt(stockInput, 10);
        if (isNaN(newStock) || newStock < 0) { showToast("error", "Invalid stock"); return; }
        try {
            setSavingStockId(product._id);
            const fd = new FormData();
            fd.append("name", product.name); fd.append("price", product.price);
            fd.append("category", product.category); fd.append("stock", newStock);
            fd.append("isCustomizable", product.isCustomizable ? "true" : "false");
            fd.append("sizes", JSON.stringify(product.sizes || []));
            fd.append("highlights", JSON.stringify(
                product.highlights instanceof Map ? Object.fromEntries(product.highlights) : (product.highlights || {})
            ));
            await api.put(`/products/${product._id}`, fd);
            const updated = { ...product, stock: newStock, inStock: newStock > 0 };
            setProducts(p => p.map(x => x._id === product._id ? updated : x));
            setFiltered(p => p.map(x => x._id === product._id ? updated : x));
            setEditingStockId(null);
            showToast("success", `Stock updated to ${newStock}`);
        } catch { showToast("error", "Failed to update stock"); }
        finally { setSavingStockId(null); }
    };

    const refreshProducts = async () => {
        setRefreshing(true);
        await fetchProducts();
        setTimeout(() => setRefreshing(false), 600);
    };

    const formatCat = (cat) =>
        cat?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "—";

    const stockBadge = (product) => {
        const n = Number(product.stock ?? 0);
        if (!product.inStock) return { label: "Out of Stock", cls: "text-red-500 bg-red-50 border-red-200" };
        if (n <= 5) return { label: `${n} left`, cls: "text-amber-600 bg-amber-50 border-amber-200" };
        return { label: `${n} left`, cls: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 40, height: 40, border: "3px solid #F59E0B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ color: "#94A3B8", fontSize: 13, fontWeight: 600 }}>Loading products...</p>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
            <div style={{ textAlign: "center", background: "#fff", borderRadius: 16, padding: 40, border: "1px solid #E2E8F0" }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>⚠️</p>
                <p style={{ color: "#374151", fontWeight: 700, marginBottom: 16 }}>{error}</p>
                <button onClick={fetchProducts} style={{
                    padding: "8px 20px", background: "#1E293B", color: "#fff",
                    borderRadius: 10, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer"
                }}>Retry</button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                @keyframes spin{to{transform:rotate(360deg)}}
                @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
            `}</style>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
                    zIndex: 9999, display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 18px", whiteSpace: "nowrap",
                    background: toast.type === "success" ? "#10B981" : "#EF4444",
                    color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 13,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)", animation: "fadeIn 0.2s ease"
                }}>
                    {toast.type === "success" ? "✓" : "✕"} {toast.msg}
                </div>
            )}

            <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 12px 40px" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                    <div>
                        <h1 style={{ fontWeight: 800, fontSize: 20, color: "#0F172A", margin: 0 }}>Products</h1>
                        <p style={{ fontSize: 12, color: "#94A3B8", margin: "3px 0 0", fontWeight: 500 }}>
                            {products.length} total · {filtered.length} showing
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={refreshProducts} disabled={refreshing} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 12px", background: "#fff",
                            border: "1px solid #E2E8F0", borderRadius: 9,
                            fontSize: 12, fontWeight: 600, color: "#64748B",
                            cursor: "pointer", opacity: refreshing ? 0.6 : 1
                        }}>
                            <FaSync size={11} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
                            Refresh
                        </button>
                        <Link to="/admin/products/new" style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 14px", background: "#F59E0B", color: "#fff",
                            borderRadius: 9, fontSize: 12, fontWeight: 700,
                            textDecoration: "none", boxShadow: "0 2px 8px rgba(245,158,11,0.3)"
                        }}>
                            <FaPlus size={11} /> Add Product
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
                    {[
                        { label: "Total", value: products.length, color: "#0F172A", bg: "#fff", border: "#E2E8F0" },
                        { label: "In Stock", value: products.filter(p => p.inStock).length, color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
                        { label: "Out of Stock", value: products.filter(p => !p.inStock).length, color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
                        { label: "Avg Price", value: `₹${products.length ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length).toLocaleString("en-IN") : 0}`, color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
                    ].map(({ label, value, color, bg, border }) => (
                        <div key={label} style={{
                            background: bg, border: `1px solid ${border}`,
                            borderRadius: 12, padding: "10px 12px"
                        }}>
                            <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, marginBottom: 4 }}>{label}</p>
                            <p style={{ fontSize: 18, fontWeight: 800, color, margin: 0 }}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div style={{ position: "relative", marginBottom: 14 }}>
                    <FaSearch size={12} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                    <input
                        type="text" value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or category..."
                        style={{
                            width: "100%", paddingLeft: 34, paddingRight: 32,
                            paddingTop: 10, paddingBottom: 10,
                            background: "#fff", border: "1px solid #E2E8F0",
                            borderRadius: 10, fontSize: 13, color: "#374151",
                            outline: "none", fontFamily: "inherit", boxSizing: "border-box"
                        }}
                    />
                    {search && (
                        <button onClick={() => setSearch("")} style={{
                            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 14
                        }}>✕</button>
                    )}
                </div>

                {/* Empty */}
                {filtered.length === 0 ? (
                    <div style={{
                        background: "#fff", border: "1px dashed #CBD5E1",
                        borderRadius: 16, padding: "48px 20px", textAlign: "center"
                    }}>
                        <FaBoxOpen size={32} style={{ color: "#CBD5E1", margin: "0 auto 12px" }} />
                        <p style={{ fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                            {search ? `No results for "${search}"` : "No products yet"}
                        </p>
                        <p style={{ fontSize: 12, color: "#94A3B8" }}>
                            {search ? "Try a different term" : "Add your first product"}
                        </p>
                    </div>
                ) : (
                    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>

                        {/* ── DESKTOP TABLE ── */}
                        <div className="hidden md:block">
                            {/* thead */}
                            <div style={{
                                display: "grid", gap: 8,
                                gridTemplateColumns: "28px 40px 1fr 100px 70px 120px 80px",
                                padding: "10px 16px", background: "#F8FAFC",
                                borderBottom: "1px solid #F1F5F9",
                                fontSize: 10, fontWeight: 700, color: "#94A3B8",
                                textTransform: "uppercase", letterSpacing: "0.06em"
                            }}>
                                <div>#</div><div>Img</div><div>Product</div>
                                <div>Category</div><div>Price</div><div>Stock</div>
                                <div style={{ textAlign: "right" }}>Actions</div>
                            </div>
                            <div>
                                {filtered.map((product, idx) => {
                                    // ✅ Optimized: 200px thumbnail — lazy load
                                    const rawImg = product.images?.[0]?.url || product.image || null;
                                    const img = rawImg ? imgUrl.thumbnail(rawImg) : null;
                                    const sb = stockBadge(product);
                                    const isES = editingStockId === product._id;
                                    const isIC = confirmId === product._id;
                                    return (
                                        <div key={product._id} style={{
                                            display: "grid", gap: 8,
                                            gridTemplateColumns: "28px 40px 1fr 100px 70px 120px 80px",
                                            padding: "10px 16px", alignItems: "center",
                                            borderBottom: "1px solid #F8FAFC",
                                            opacity: deletingId === product._id ? 0.5 : 1,
                                            transition: "background 0.1s"
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            <div style={{ fontSize: 11, color: "#CBD5E1", fontWeight: 600 }}>{idx + 1}</div>
                                            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F1F5F9", border: "1px solid #E2E8F0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {img
                                                    ? <img src={img} alt={product.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }} />
                                                    : <FaBoxOpen size={13} style={{ color: "#CBD5E1" }} />}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</p>
                                                <p style={{ fontSize: 11, color: "#94A3B8", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.description || "—"}</p>
                                            </div>
                                            <div>
                                                <span style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>
                                                    {formatCat(product.category)}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: 13, color: "#10B981" }}>
                                                ₹{Number(product.price || 0).toLocaleString("en-IN")}
                                            </div>
                                            <div>
                                                {isES ? (
                                                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                                        <input type="number" min="0" value={stockInput}
                                                            onChange={e => setStockInput(e.target.value)}
                                                            onKeyDown={e => { if (e.key === "Enter") handleStockSave(product); if (e.key === "Escape") setEditingStockId(null); }}
                                                            autoFocus
                                                            style={{ width: 52, padding: "3px 6px", border: "1px solid #F59E0B", borderRadius: 7, fontSize: 12, fontWeight: 700, outline: "none", fontFamily: "inherit" }} />
                                                        <button onClick={() => handleStockSave(product)} disabled={savingStockId === product._id}
                                                            style={{ padding: "3px 8px", background: "#10B981", color: "#fff", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>
                                                            {savingStockId === product._id ? "..." : "✓"}
                                                        </button>
                                                        <button onClick={() => setEditingStockId(null)}
                                                            style={{ padding: "3px 6px", background: "#F1F5F9", color: "#64748B", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>✕</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => { setEditingStockId(product._id); setStockInput(String(product.stock ?? 0)); }}
                                                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", border: `1px solid`, borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "transparent" }}
                                                        className={sb.cls}>
                                                        <FaBoxes size={9} /> {sb.label} <span style={{ fontSize: 9, opacity: 0.5 }}>✎</span>
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                                                <Link to={`/admin/products/${product._id}/edit`} style={{
                                                    width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                                                    background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, color: "#3B82F6", textDecoration: "none"
                                                }}>
                                                    <FaEdit size={11} />
                                                </Link>
                                                {isIC ? (
                                                    <div style={{ display: "flex", gap: 4 }}>
                                                        <button onClick={() => deleteHandler(product._id)}
                                                            style={{ padding: "4px 8px", background: "#EF4444", color: "#fff", borderRadius: 7, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>
                                                            Yes
                                                        </button>
                                                        <button onClick={() => setConfirmId(null)}
                                                            style={{ padding: "4px 8px", background: "#F1F5F9", color: "#64748B", borderRadius: 7, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>No</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setConfirmId(product._id)} style={{
                                                        width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                                                        background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#EF4444", cursor: "pointer"
                                                    }}>
                                                        <FaTrash size={11} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── MOBILE CARDS ── */}
                        <div className="md:hidden">
                            {filtered.map((product) => {
                                // ✅ Optimized: 200px thumbnail — lazy load
                                const rawImg = product.images?.[0]?.url || product.image || null;
                                const img = rawImg ? imgUrl.thumbnail(rawImg) : null;
                                const sb = stockBadge(product);
                                const isES = editingStockId === product._id;
                                const isIC = confirmId === product._id;
                                return (
                                    <div key={product._id} style={{
                                        padding: "12px 14px",
                                        borderBottom: "1px solid #F1F5F9",
                                        opacity: deletingId === product._id ? 0.5 : 1
                                    }}>
                                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                            <div style={{
                                                width: 48, height: 48, borderRadius: 10,
                                                background: "#F1F5F9", border: "1px solid #E2E8F0",
                                                overflow: "hidden", flexShrink: 0,
                                                display: "flex", alignItems: "center", justifyContent: "center"
                                            }}>
                                                {img
                                                    ? <img src={img} alt={product.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
                                                    : <FaBoxOpen size={16} style={{ color: "#CBD5E1" }} />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                                                    <p style={{ fontWeight: 700, fontSize: 14, color: "#0F172A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {product.name}
                                                    </p>
                                                    <p style={{ fontWeight: 800, fontSize: 13, color: "#10B981", flexShrink: 0, margin: 0 }}>
                                                        ₹{Number(product.price || 0).toLocaleString("en-IN")}
                                                    </p>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                                                    <span style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>
                                                        {formatCat(product.category)}
                                                    </span>
                                                    {isES ? (
                                                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                                            <input type="number" min="0" value={stockInput}
                                                                onChange={e => setStockInput(e.target.value)}
                                                                onKeyDown={e => { if (e.key === "Enter") handleStockSave(product); if (e.key === "Escape") setEditingStockId(null); }}
                                                                autoFocus
                                                                style={{ width: 48, padding: "2px 6px", border: "1px solid #F59E0B", borderRadius: 6, fontSize: 12, fontWeight: 700, outline: "none", fontFamily: "inherit" }} />
                                                            <button onClick={() => handleStockSave(product)} disabled={savingStockId === product._id}
                                                                style={{ padding: "2px 8px", background: "#10B981", color: "#fff", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>
                                                                {savingStockId === product._id ? "..." : "✓"}
                                                            </button>
                                                            <button onClick={() => setEditingStockId(null)}
                                                                style={{ padding: "2px 6px", background: "#F1F5F9", color: "#64748B", borderRadius: 6, fontSize: 11, border: "none", cursor: "pointer" }}>✕</button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => { setEditingStockId(product._id); setStockInput(String(product.stock ?? 0)); }}
                                                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "1px solid" }}
                                                            className={sb.cls}>
                                                            <FaBoxes size={8} /> {sb.label} <span style={{ fontSize: 9, opacity: 0.5 }}>✎</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                            <Link to={`/admin/products/${product._id}/edit`} style={{
                                                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                                                gap: 6, padding: "7px 0", borderRadius: 9,
                                                background: "#EFF6FF", border: "1px solid #BFDBFE",
                                                color: "#3B82F6", fontSize: 12, fontWeight: 700, textDecoration: "none"
                                            }}>
                                                <FaEdit size={11} /> Edit
                                            </Link>
                                            {isIC ? (
                                                <>
                                                    <button onClick={() => deleteHandler(product._id)} style={{
                                                        flex: 1, padding: "7px 0", background: "#EF4444",
                                                        color: "#fff", borderRadius: 9, fontSize: 12,
                                                        fontWeight: 700, border: "none", cursor: "pointer"
                                                    }}>
                                                        {deletingId === product._id ? "..." : "Confirm"}
                                                    </button>
                                                    <button onClick={() => setConfirmId(null)} style={{
                                                        flex: 1, padding: "7px 0", background: "#F1F5F9",
                                                        color: "#64748B", borderRadius: 9, fontSize: 12,
                                                        fontWeight: 700, border: "none", cursor: "pointer"
                                                    }}>Cancel</button>
                                                </>
                                            ) : (
                                                <button onClick={() => setConfirmId(product._id)} style={{
                                                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                                                    gap: 6, padding: "7px 0", borderRadius: 9,
                                                    background: "#FEF2F2", border: "1px solid #FECACA",
                                                    color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer"
                                                }}>
                                                    <FaTrash size={11} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "10px 14px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9"
                        }}>
                            <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
                                Showing <b style={{ color: "#475569" }}>{filtered.length}</b> of <b style={{ color: "#475569" }}>{products.length}</b>
                            </p>
                            <Link to="/admin/products/new" style={{
                                display: "flex", alignItems: "center", gap: 5,
                                fontSize: 12, color: "#F59E0B", fontWeight: 700, textDecoration: "none"
                            }}>
                                <FaPlus size={10} /> Add New
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProducts;