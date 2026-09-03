import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { useCart } from "../hooks/useCart";
import {
    FaSearch, FaFilter, FaTimes, FaFire, FaPencilAlt,
    FaArrowRight, FaChevronRight, FaSlidersH, FaCheck
} from "react-icons/fa";
import { CATEGORIES } from "../data/categories";
import { ProductCardSkeleton } from "../components/Loader";
import ProductCard from "../components/ProductCard";

const formatCat = (cat) => {
    if (!cat) return "";
    return cat.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// ─── Main Products Catalog Page ──────────────────────────────────────────────
const Products = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { addItem } = useCart();

    const searchQuery = searchParams.get("search") || "";
    const activeCategory = searchParams.get("category") || "";
    const showCustomizable = searchParams.get("customizable") === "true";
    const sortBy = searchParams.get("sort") || "newest";

    const allProducts = useSelector((state) => state.products.items || []);
    const status = useSelector((state) => state.products.status);
    const error = useSelector((state) => state.products.error);
    const loading = status === "loading" || status === "idle";

    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [searchInput, setSearchInput] = useState(searchQuery);

    useEffect(() => {
        if (status === "idle") dispatch(fetchProducts());
    }, [dispatch, status]);

    useEffect(() => {
        setSearchInput(searchQuery);
    }, [searchQuery]);

    // Derived Categories
    const categories = useMemo(() => {
        return [...new Set(allProducts.map((p) => p.category).filter(Boolean))];
    }, [allProducts]);

    const customizableCount = useMemo(() => {
        return allProducts.filter((p) => p.isCustomizable).length;
    }, [allProducts]);

    // Filter & Sort Logic
    const filteredProducts = useMemo(() => {
        let list = [...allProducts];

        if (showCustomizable) {
            list = list.filter((p) => p.isCustomizable === true);
        } else if (activeCategory) {
            list = list.filter(
                (p) => p.category?.toLowerCase() === activeCategory.toLowerCase()
            );
        }

        if (searchQuery.trim().length >= 2) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter(
                (p) =>
                    p.name?.toLowerCase().includes(q) ||
                    p.description?.toLowerCase().includes(q) ||
                    p.tags?.some((t) => t.toLowerCase().includes(q))
            );
        }

        // Sorting
        switch (sortBy) {
            case "price_asc":
                list.sort((a, b) => Number(a.price) - Number(b.price));
                break;
            case "price_desc":
                list.sort((a, b) => Number(b.price) - Number(a.price));
                break;
            case "rating":
                list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
                break;
            case "newest":
            default:
                list.sort((a, b) => {
                    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return tb - ta;
                });
                break;
        }

        return list;
    }, [allProducts, searchQuery, activeCategory, showCustomizable, sortBy]);

    // Handlers
    const handleAddToCart = useCallback((product) => addItem(product), [addItem]);
    const handleBuyNow = useCallback(
        (product) => {
            navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1 } } });
        },
        [navigate]
    );

    const updateFilter = useCallback(
        (updates) => {
            const current = Object.fromEntries(searchParams.entries());
            const merged = { ...current, ...updates };

            // Clean up empty params
            Object.keys(merged).forEach((k) => {
                if (!merged[k] || merged[k] === "false" || (merged[k] === "newest" && k === "sort")) {
                    delete merged[k];
                }
            });

            setSearchParams(merged);
        },
        [searchParams, setSearchParams]
    );

    const clearAllFilters = useCallback(() => {
        setSearchParams({});
        setSearchInput("");
    }, [setSearchParams]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        updateFilter({ search: searchInput.trim() });
    };

    // Active Category Object
    const activeCategoryObj = useMemo(() => {
        if (!activeCategory) return null;
        return (
            CATEGORIES.find(
                (c) => c.value?.toLowerCase() === activeCategory.toLowerCase()
            ) || { name: formatCat(activeCategory), icon: "🎁" }
        );
    }, [activeCategory]);

    // Dynamic Header Info
    const headerDetails = useMemo(() => {
        if (searchQuery) {
            return {
                badge: "SEARCH RESULTS",
                title: `Search: "${searchQuery}"`,
                subtitle: `Found ${filteredProducts.length} matching gift${filteredProducts.length !== 1 ? "s" : ""} in our store.`,
                breadcrumb: `Search: "${searchQuery}"`,
                icon: "🔍",
            };
        }
        if (showCustomizable) {
            return {
                badge: "CUSTOM PRINTING & GIFTS",
                title: "Personalized & Custom Gifts",
                subtitle: `Browse ${customizableCount} custom-made items. Upload your photos, names & memories to create unique gifts.`,
                breadcrumb: "Customizable Gifts",
                icon: "✏️",
            };
        }
        if (activeCategoryObj) {
            return {
                badge: "CATEGORY COLLECTION",
                title: `${activeCategoryObj.icon} ${activeCategoryObj.name}`,
                subtitle: `Explore handcrafted ${activeCategoryObj.name} gifts with express pan-India dispatch and premium print finish.`,
                breadcrumb: activeCategoryObj.name,
                icon: activeCategoryObj.icon,
            };
        }
        return {
            badge: "EXPLORE COLLECTION",
            title: "Personalized Gifts & Handcrafted Keepsakes",
            subtitle: `Discover ${allProducts.length}+ gifts for birthdays, anniversaries, photo lamps, mugs, custom wearables & festive specials.`,
            breadcrumb: "All Products Store",
            icon: "🎁",
        };
    }, [searchQuery, showCustomizable, activeCategoryObj, filteredProducts.length, customizableCount, allProducts.length]);

    // Dynamic Document Title
    useEffect(() => {
        if (activeCategoryObj) {
            document.title = `${activeCategoryObj.name} Gifts | RV Gift & Printing`;
        } else if (showCustomizable) {
            document.title = "Customizable Gifts | RV Gift & Printing";
        } else if (searchQuery) {
            document.title = `Search: ${searchQuery} | RV Gift & Printing`;
        } else {
            document.title = "All Products & Customized Gifts | RV Gift & Printing";
        }
    }, [activeCategoryObj, showCustomizable, searchQuery]);

    return (
        <div className="min-h-screen bg-stone-50 py-8 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* BREADCRUMB */}
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4 flex-wrap">
                    <Link to="/" className="hover:text-amber-600 transition-colors">Home</Link>
                    <FaChevronRight size={8} />
                    <Link to="/products" className={`${activeCategory || showCustomizable || searchQuery ? "hover:text-amber-600" : "text-zinc-800 font-bold"} transition-colors`}>
                        Products
                    </Link>
                    {(activeCategory || showCustomizable || searchQuery) && (
                        <>
                            <FaChevronRight size={8} />
                            <span className="text-zinc-800 font-bold">{headerDetails.breadcrumb}</span>
                        </>
                    )}
                </div>

                {/* DYNAMIC PAGE HEADER BANNER */}
                <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-md relative overflow-hidden transition-all duration-300">
                    <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 max-w-2xl">
                        <span className="text-amber-400 text-xs font-black tracking-widest uppercase mb-1.5 inline-flex items-center gap-1.5">
                            <span>{headerDetails.icon}</span>
                            <span>{headerDetails.badge}</span>
                        </span>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                            {headerDetails.title}
                        </h1>
                        <p className="text-zinc-400 text-xs sm:text-sm mt-2 leading-relaxed">
                            {headerDetails.subtitle}
                        </p>
                    </div>
                </div>

                {/* SEARCH & CONTROLS BAR */}
                <div className="bg-white rounded-2xl border border-stone-200/80 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Search bar */}
                    <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search gifts, lamps, mugs, frames..."
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                        />
                        <FaSearch size={13} className="absolute left-3.5 top-3.5 text-zinc-400" />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchInput("");
                                    updateFilter({ search: "" });
                                }}
                                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                            >
                                <FaTimes size={12} />
                            </button>
                        )}
                    </form>

                    {/* Filter & Sort buttons */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        {/* Mobile Filter Toggle */}
                        <button
                            onClick={() => setMobileFilterOpen(true)}
                            className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-zinc-700 cursor-pointer active:scale-95"
                        >
                            <FaSlidersH size={12} /> Filter Options
                        </button>

                        {/* Sort Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400 hidden sm:inline font-medium">Sort By:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => updateFilter({ sort: e.target.value })}
                                className="px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="rating">Top Rated ⭐</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA (Sidebar + Product Grid) */}
                <div className="flex gap-6 items-start">

                    {/* DESKTOP SIDEBAR FILTER */}
                    <aside className="hidden md:block w-64 shrink-0 bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm sticky top-24">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                                <FaFilter size={12} className="text-amber-500" /> Filters
                            </h3>
                            {(activeCategory || showCustomizable || searchQuery) && (
                                <button
                                    onClick={clearAllFilters}
                                    className="text-[11px] text-amber-600 font-bold hover:underline cursor-pointer"
                                >
                                    Reset All
                                </button>
                            )}
                        </div>

                        {/* Customizable Quick Filter */}
                        <div className="mb-5">
                            <label
                                onClick={() => updateFilter({ customizable: showCustomizable ? "false" : "true", category: "" })}
                                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${showCustomizable ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold" : "bg-stone-50 border-stone-200 text-zinc-700 hover:bg-stone-100"}`}
                            >
                                <span className="text-xs flex items-center gap-1.5 font-bold">
                                    ✏️ Customizable Only
                                </span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black">
                                    {customizableCount}
                                </span>
                            </label>
                        </div>

                        {/* Categories List */}
                        <div>
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                                Categories
                            </h4>
                            <div className="flex flex-col gap-1 max-h-96 overflow-y-auto pr-1">
                                <button
                                    onClick={() => updateFilter({ category: "", customizable: "false" })}
                                    className={`text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${!activeCategory && !showCustomizable ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-stone-100"}`}
                                >
                                    All Categories ({allProducts.length})
                                </button>

                                {CATEGORIES.map((cat) => {
                                    const count = allProducts.filter((p) => p.category?.toLowerCase() === cat.value?.toLowerCase()).length;
                                    const isActive = activeCategory?.toLowerCase() === cat.value?.toLowerCase();

                                    return (
                                        <button
                                            key={cat.value}
                                            onClick={() => updateFilter({ category: cat.value, customizable: "false" })}
                                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${isActive ? "bg-amber-500 text-white font-bold shadow-sm" : "text-zinc-600 hover:bg-stone-100 font-medium"}`}
                                        >
                                            <span className="flex items-center gap-2 truncate">
                                                <span>{cat.icon}</span>
                                                <span className="truncate">{cat.name}</span>
                                            </span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "text-zinc-400"}`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                    {/* PRODUCTS GRID */}
                    <div className="flex-1 min-w-0">

                        {/* Active Filter Chips */}
                        {(activeCategory || showCustomizable || searchQuery) && (
                            <div className="flex flex-wrap items-center gap-2 mb-5">
                                <span className="text-xs text-zinc-400 font-semibold">Active:</span>

                                {searchQuery && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                                        Search: "{searchQuery}"
                                        <FaTimes size={10} className="cursor-pointer hover:text-amber-900" onClick={() => updateFilter({ search: "" })} />
                                    </span>
                                )}

                                {showCustomizable && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                                        ✏️ Customizable
                                        <FaTimes size={10} className="cursor-pointer hover:text-emerald-900" onClick={() => updateFilter({ customizable: "false" })} />
                                    </span>
                                )}

                                {activeCategory && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                                        Category: {formatCat(activeCategory)}
                                        <FaTimes size={10} className="cursor-pointer hover:text-amber-900" onClick={() => updateFilter({ category: "" })} />
                                    </span>
                                )}

                                <button
                                    onClick={clearAllFilters}
                                    className="text-xs text-zinc-500 hover:text-zinc-800 underline ml-2 cursor-pointer font-medium"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}

                        {/* Results Count */}
                        <div className="mb-4">
                            <p className="text-xs text-zinc-500 font-medium">
                                Showing <strong className="text-zinc-900">{filteredProducts.length}</strong> products
                            </p>
                        </div>

                        {/* Loading Skeletons */}
                        {loading && (
                            <ProductCardSkeleton count={8} />
                        )}

                        {/* Error state */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                                <p className="text-red-600 font-bold mb-3">⚠️ {error}</p>
                                <button
                                    onClick={() => dispatch(fetchProducts())}
                                    className="bg-zinc-900 text-white px-5 py-2 rounded-xl text-sm font-bold cursor-pointer"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && !error && filteredProducts.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-300">
                                <p className="text-5xl mb-3">🎁</p>
                                <h3 className="text-base font-bold text-zinc-800 mb-1">No products match your filter</h3>
                                <p className="text-xs text-zinc-400 mb-5">Try choosing another category or clearing search filters.</p>
                                <button
                                    onClick={clearAllFilters}
                                    className="bg-amber-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-amber-600 transition-all cursor-pointer"
                                >
                                    View All Products
                                </button>
                            </div>
                        )}

                        {/* Products Grid */}
                        {!loading && !error && filteredProducts.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
                                {filteredProducts.map((product, idx) => (
                                    <ProductCard
                                        key={product._id}
                                        product={product}
                                        index={idx}
                                        onAddToCart={handleAddToCart}
                                        onBuyNow={handleBuyNow}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MOBILE FILTER MODAL / DRAWER */}
            {mobileFilterOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
                    <div className="w-4/5 max-w-sm bg-white h-full p-5 overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right">
                        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
                            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                                <FaFilter size={14} className="text-amber-500" /> Filter Store
                            </h3>
                            <button
                                onClick={() => setMobileFilterOpen(false)}
                                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-zinc-500 hover:text-zinc-800 cursor-pointer"
                            >
                                <FaTimes size={13} />
                            </button>
                        </div>

                        {/* Customizable Filter */}
                        <div className="mb-4">
                            <button
                                onClick={() => {
                                    updateFilter({ customizable: showCustomizable ? "false" : "true", category: "" });
                                    setMobileFilterOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer ${showCustomizable ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold" : "bg-stone-50 border-stone-200 text-zinc-700"}`}
                            >
                                <span className="text-xs font-bold">✏️ Customizable Only</span>
                                {showCustomizable && <FaCheck size={11} className="text-emerald-600" />}
                            </button>
                        </div>

                        {/* Categories */}
                        <div className="flex-1 overflow-y-auto">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                Categories
                            </h4>
                            <div className="flex flex-col gap-1.5">
                                <button
                                    onClick={() => {
                                        updateFilter({ category: "", customizable: "false" });
                                        setMobileFilterOpen(false);
                                    }}
                                    className={`text-left px-3 py-2.5 rounded-xl text-xs font-bold ${!activeCategory && !showCustomizable ? "bg-zinc-900 text-white" : "bg-stone-50 text-zinc-700"}`}
                                >
                                    All Categories ({allProducts.length})
                                </button>

                                {CATEGORIES.map((cat) => {
                                    const count = allProducts.filter((p) => p.category?.toLowerCase() === cat.value?.toLowerCase()).length;
                                    const isActive = activeCategory?.toLowerCase() === cat.value?.toLowerCase();

                                    return (
                                        <button
                                            key={cat.value}
                                            onClick={() => {
                                                updateFilter({ category: cat.value, customizable: "false" });
                                                setMobileFilterOpen(false);
                                            }}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs ${isActive ? "bg-amber-500 text-white font-bold" : "bg-stone-50 text-zinc-700 font-medium"}`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>{cat.icon}</span>
                                                <span>{cat.name}</span>
                                            </span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "text-zinc-400"}`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer Reset */}
                        <div className="pt-4 border-t border-stone-100 mt-4">
                            <button
                                onClick={() => {
                                    clearAllFilters();
                                    setMobileFilterOpen(false);
                                }}
                                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
