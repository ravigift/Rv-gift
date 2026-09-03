import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
    FaUser, FaEnvelope, FaPhone, FaBox, FaArrowRight,
    FaMapMarkerAlt, FaSignOutAlt, FaLock, FaKey,
    FaPlus, FaEdit, FaTrash, FaCheck, FaTimes,
    FaSpinner, FaShieldAlt, FaEye, FaEyeSlash,
    FaShoppingBag, FaTruck, FaClock, FaCheckCircle,
} from "react-icons/fa";
import { imgUrl } from "../utils/imageUrl";

const STATUS_CONFIG = {
    PLACED: { label: "Placed", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-800 border-blue-200" },
    PACKED: { label: "Packed", color: "bg-purple-100 text-purple-800 border-purple-200" },
    SHIPPED: { label: "Shipped", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-orange-100 text-orange-800 border-orange-200" },
    DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200" },
};

const Profile = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("details"); // 'details' | 'addresses' | 'orders' | 'security'
    const [profileData, setProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // Profile Details Form State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

    // Addresses State
    const [addresses, setAddresses] = useState([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [addressModalOpen, setAddressModalOpen] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressForm, setAddressForm] = useState({
        label: "Home",
        name: "",
        phone: "",
        house: "",
        area: "",
        landmark: "",
        city: "",
        state: "",
        pincode: "",
        isDefault: false,
    });
    const [savingAddress, setSavingAddress] = useState(false);
    const [addressError, setAddressError] = useState("");

    // Recent Orders State
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Change Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrPass, setShowCurrPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

    // ── Fetch User Profile ──
    const fetchUserProfile = useCallback(async () => {
        try {
            setLoadingProfile(true);
            const { data } = await api.get("/auth/profile");
            setProfileData(data);
            setName(data.name || "");
            setPhone(data.phone || "");
            setAddresses(data.addresses || []);
        } catch {
            // fallback to auth context user
            if (user) {
                setName(user.name || "");
                setPhone(user.phone || "");
            }
        } finally {
            setLoadingProfile(false);
        }
    }, [user]);

    // ── Fetch Orders ──
    const fetchRecentOrders = useCallback(async () => {
        try {
            setLoadingOrders(true);
            const { data } = await api.get("/orders/my?limit=5");
            setOrders(Array.isArray(data) ? data : []);
        } catch {
            setOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    }, []);

    // ── Fetch Addresses ──
    const fetchAddresses = useCallback(async () => {
        try {
            setLoadingAddresses(true);
            const { data } = await api.get("/addresses");
            setAddresses(Array.isArray(data) ? data : []);
        } catch {
            // silent
        } finally {
            setLoadingAddresses(false);
        }
    }, []);

    useEffect(() => {
        document.title = "My Account & Profile | RV Gift & Printing";
        fetchUserProfile();
        fetchRecentOrders();
    }, [fetchUserProfile, fetchRecentOrders]);

    // ── Handle Profile Update ──
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setProfileMsg({ type: "", text: "" });

        if (!name.trim()) {
            setProfileMsg({ type: "error", text: "Please enter your full name." });
            return;
        }

        if (phone && !/^[6-9]\d{9}$/.test(phone.trim())) {
            setProfileMsg({ type: "error", text: "Please enter a valid 10-digit Indian phone number." });
            return;
        }

        try {
            setSavingProfile(true);
            const { data } = await api.put("/auth/profile", {
                name: name.trim(),
                phone: phone.trim(),
            });

            if (data.user) {
                updateUser(data.user);
                setProfileData(data.user);
            }
            setProfileMsg({ type: "success", text: "Profile details updated successfully!" });
            setTimeout(() => setProfileMsg({ type: "", text: "" }), 4000);
        } catch (err) {
            setProfileMsg({
                type: "error",
                text: err.response?.data?.message || "Failed to update profile.",
            });
        } finally {
            setSavingProfile(false);
        }
    };

    // ── Handle Address Save (Create or Update) ──
    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setAddressError("");

        const { label, name: addrName, phone: addrPhone, house, area, city, state, pincode } = addressForm;

        if (!addrName.trim() || !addrPhone.trim() || !house.trim() || !area.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
            setAddressError("Please fill all required address fields.");
            return;
        }

        if (!/^[6-9]\d{9}$/.test(addrPhone.trim())) {
            setAddressError("Please enter a valid 10-digit mobile number.");
            return;
        }

        if (!/^\d{6}$/.test(pincode.trim())) {
            setAddressError("Please enter a valid 6-digit PIN code.");
            return;
        }

        try {
            setSavingAddress(true);
            if (editingAddressId) {
                const { data } = await api.put(`/addresses/${editingAddressId}`, addressForm);
                setAddresses(data.addresses || []);
            } else {
                const { data } = await api.post("/addresses", addressForm);
                setAddresses(data.addresses || []);
            }
            setAddressModalOpen(false);
            setEditingAddressId(null);
        } catch (err) {
            setAddressError(err.response?.data?.message || "Failed to save address.");
        } finally {
            setSavingAddress(false);
        }
    };

    // ── Handle Delete Address ──
    const handleDeleteAddress = async (addrId) => {
        if (!window.confirm("Are you sure you want to delete this address?")) return;
        try {
            const { data } = await api.delete(`/addresses/${addrId}`);
            setAddresses(data.addresses || []);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete address.");
        }
    };

    // ── Handle Set Default Address ──
    const handleSetDefaultAddress = async (addrId) => {
        try {
            const { data } = await api.put(`/addresses/${addrId}/default`);
            setAddresses(data.addresses || []);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to set default address.");
        }
    };

    const openAddAddressModal = () => {
        setEditingAddressId(null);
        setAddressForm({
            label: "Home",
            name: name || user?.name || "",
            phone: phone || user?.phone || "",
            house: "",
            area: "",
            landmark: "",
            city: "",
            state: "",
            pincode: "",
            isDefault: addresses.length === 0,
        });
        setAddressError("");
        setAddressModalOpen(true);
    };

    const openEditAddressModal = (addr) => {
        setEditingAddressId(addr._id);
        setAddressForm({
            label: addr.label || "Home",
            name: addr.name || "",
            phone: addr.phone || "",
            house: addr.house || "",
            area: addr.area || "",
            landmark: addr.landmark || "",
            city: addr.city || "",
            state: addr.state || "",
            pincode: addr.pincode || "",
            isDefault: addr.isDefault || false,
        });
        setAddressError("");
        setAddressModalOpen(true);
    };

    // ── Handle Change Password ──
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMsg({ type: "", text: "" });

        if (!currentPassword || !newPassword) {
            setPasswordMsg({ type: "error", text: "Please enter current and new password." });
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMsg({ type: "error", text: "New password must be at least 8 characters long." });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: "error", text: "New password and confirmation do not match." });
            return;
        }

        try {
            setChangingPassword(true);
            const { data } = await api.put("/auth/change-password", {
                currentPassword,
                newPassword,
            });
            setPasswordMsg({ type: "success", text: data.message || "Password changed successfully!" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setPasswordMsg({ type: "", text: "" }), 5000);
        } catch (err) {
            setPasswordMsg({
                type: "error",
                text: err.response?.data?.message || "Failed to change password. Please check your current password.",
            });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const memberSinceDate = profileData?.createdAt
        ? new Date(profileData.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
        : null;

    const inTransitOrdersCount = orders.filter(
        (o) => ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(o.orderStatus)
    ).length;

    return (
        <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 font-sans">
            <div className="max-w-5xl mx-auto">

                {/* USER PROFILE HEADER CARD */}
                <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-4 sm:gap-5">
                            {/* Avatar */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md shadow-amber-200/50 shrink-0">
                                {user?.name?.[0]?.toUpperCase() || "U"}
                            </div>

                            {/* Name & Badges */}
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl sm:text-2xl font-black text-zinc-900">
                                        {user?.name || "Customer"}
                                    </h1>
                                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <FaCheckCircle size={8} /> Verified
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                    <FaEnvelope size={10} className="text-zinc-400" /> {user?.email}
                                </p>
                                {memberSinceDate && (
                                    <p className="text-[11px] text-zinc-400 mt-0.5">
                                        Member since {memberSinceDate}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Logout & Quick CTA */}
                        <div className="flex items-center gap-3 self-start sm:self-center">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all cursor-pointer active:scale-95"
                            >
                                <FaSignOutAlt size={12} /> Logout
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-stone-100">
                        <div
                            onClick={() => setActiveTab("orders")}
                            className="bg-stone-50 hover:bg-amber-50/60 p-3 sm:p-4 rounded-2xl border border-stone-200/60 cursor-pointer transition-colors"
                        >
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Orders</span>
                            <span className="text-lg sm:text-xl font-black text-zinc-900 mt-0.5 block">{orders.length}</span>
                        </div>

                        <div
                            onClick={() => setActiveTab("orders")}
                            className="bg-stone-50 hover:bg-amber-50/60 p-3 sm:p-4 rounded-2xl border border-stone-200/60 cursor-pointer transition-colors"
                        >
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">In-Transit</span>
                            <span className="text-lg sm:text-xl font-black text-amber-600 mt-0.5 block">{inTransitOrdersCount}</span>
                        </div>

                        <div
                            onClick={() => setActiveTab("addresses")}
                            className="bg-stone-50 hover:bg-amber-50/60 p-3 sm:p-4 rounded-2xl border border-stone-200/60 cursor-pointer transition-colors"
                        >
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Saved Addresses</span>
                            <span className="text-lg sm:text-xl font-black text-zinc-900 mt-0.5 block">{addresses.length}</span>
                        </div>

                        <Link
                            to="/contact"
                            className="bg-stone-50 hover:bg-amber-50/60 p-3 sm:p-4 rounded-2xl border border-stone-200/60 cursor-pointer transition-colors block"
                        >
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Support</span>
                            <span className="text-xs sm:text-sm font-bold text-emerald-600 mt-1 block">Help Center ↗</span>
                        </Link>
                    </div>
                </div>

                {/* TAB NAVIGATION */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
                    {[
                        { key: "details", label: "👤 Personal Details" },
                        { key: "addresses", label: `📍 Saved Addresses (${addresses.length})` },
                        { key: "orders", label: `📦 Recent Orders (${orders.length})` },
                        { key: "security", label: "🔒 Security & Password" },
                    ].map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${isActive
                                    ? "bg-zinc-900 text-white shadow-sm shadow-zinc-300"
                                    : "bg-white text-zinc-600 border border-stone-200/80 hover:bg-stone-50"
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB 1: PERSONAL DETAILS (EDIT PROFILE) */}
                {activeTab === "details" && (
                    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8">
                        <div className="pb-4 border-b border-stone-100 mb-6">
                            <h2 className="text-base font-black text-zinc-900">Personal Information</h2>
                            <p className="text-xs text-zinc-400 mt-0.5">Manage your personal profile details and contact number.</p>
                        </div>

                        {profileMsg.text && (
                            <div className={`p-3.5 rounded-xl text-xs font-bold mb-5 flex items-center gap-2 ${profileMsg.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                                {profileMsg.type === "success" ? <FaCheck size={11} /> : <FaTimes size={11} />}
                                <span>{profileMsg.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                            <div>
                                <label className="text-xs font-bold text-zinc-700 block mb-1">Full Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your full name"
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                                    />
                                    <FaUser size={12} className="absolute left-3.5 top-3.5 text-zinc-400" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-700 block mb-1">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={user?.email || ""}
                                        disabled
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-xs sm:text-sm font-medium text-zinc-500 cursor-not-allowed"
                                    />
                                    <FaEnvelope size={12} className="absolute left-3.5 top-3.5 text-zinc-400" />
                                </div>
                                <span className="text-[10px] text-zinc-400 mt-1 block">
                                    Email is linked to your account authentication and cannot be changed directly.
                                </span>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-700 block mb-1">Mobile Phone Number</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="10-digit phone number (e.g. 9876543210)"
                                        maxLength={10}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                                    />
                                    <FaPhone size={12} className="absolute left-3.5 top-3.5 text-zinc-400" />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-2"
                                >
                                    {savingProfile ? (
                                        <><FaSpinner size={11} className="animate-spin" /> Saving Changes...</>
                                    ) : (
                                        "Save Profile Changes"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB 2: SAVED ADDRESSES (FULL CRUD) */}
                {activeTab === "addresses" && (
                    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 mb-6">
                            <div>
                                <h2 className="text-base font-black text-zinc-900">Saved Delivery Addresses</h2>
                                <p className="text-xs text-zinc-400 mt-0.5">Manage delivery addresses for quick 1-click checkout.</p>
                            </div>

                            {addresses.length < 5 && (
                                <button
                                    onClick={openAddAddressModal}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 self-start sm:self-auto"
                                >
                                    <FaPlus size={10} /> Add New Address
                                </button>
                            )}
                        </div>

                        {loadingAddresses ? (
                            <div className="py-12 text-center text-zinc-400 text-xs">
                                <FaSpinner size={16} className="animate-spin mx-auto mb-2 text-amber-500" />
                                Loading addresses...
                            </div>
                        ) : addresses.length === 0 ? (
                            <div className="text-center py-12 bg-stone-50/70 rounded-2xl border border-dashed border-stone-200">
                                <FaMapMarkerAlt size={28} className="text-stone-300 mx-auto mb-2" />
                                <p className="text-xs font-bold text-zinc-700">No saved addresses yet</p>
                                <p className="text-[11px] text-zinc-400 mt-0.5 mb-4">Add your home or office address for faster checkout.</p>
                                <button
                                    onClick={openAddAddressModal}
                                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    + Add Address
                                </button>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {addresses.map((addr) => (
                                    <div
                                        key={addr._id}
                                        className={`rounded-2xl border p-4.5 flex flex-col justify-between transition-all ${addr.isDefault ? "bg-amber-50/30 border-amber-300 ring-1 ring-amber-300/30 shadow-xs" : "bg-stone-50/60 border-stone-200"}`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-white">
                                                    {addr.label || "Home"}
                                                </span>
                                                {addr.isDefault && (
                                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                                                        Default
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="font-bold text-zinc-900 text-xs sm:text-sm">{addr.name}</h4>
                                            <p className="text-xs text-zinc-500 mt-0.5 font-medium">{addr.phone}</p>
                                            <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                                                {addr.house}, {addr.area}
                                                {addr.landmark ? `, Near ${addr.landmark}` : ""}
                                                <br />
                                                {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-200/70 text-xs">
                                            {!addr.isDefault ? (
                                                <button
                                                    onClick={() => handleSetDefaultAddress(addr._id)}
                                                    className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
                                                >
                                                    Set as Default
                                                </button>
                                            ) : <span className="text-[10px] text-zinc-400">Primary Delivery</span>}

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditAddressModal(addr)}
                                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-stone-200/50 cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <FaEdit size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAddress(addr._id)}
                                                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <FaTrash size={11} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: RECENT ORDERS */}
                {activeTab === "orders" && (
                    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8">
                        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
                            <div>
                                <h2 className="text-base font-black text-zinc-900">Recent Orders</h2>
                                <p className="text-xs text-zinc-400 mt-0.5">Track your orders and past gift purchases.</p>
                            </div>
                            <Link
                                to="/orders"
                                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                            >
                                View All Orders <FaArrowRight size={10} />
                            </Link>
                        </div>

                        {loadingOrders ? (
                            <div className="py-12 text-center text-zinc-400 text-xs">
                                <FaSpinner size={16} className="animate-spin mx-auto mb-2 text-amber-500" />
                                Loading your orders...
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-12 bg-stone-50/70 rounded-2xl border border-dashed border-stone-200">
                                <FaShoppingBag size={28} className="text-stone-300 mx-auto mb-2" />
                                <p className="text-xs font-bold text-zinc-700">No orders placed yet</p>
                                <p className="text-[11px] text-zinc-400 mt-0.5 mb-4">Discover personalized photo lamps, mugs & customized gifts.</p>
                                <Link
                                    to="/products"
                                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs inline-block"
                                >
                                    Start Shopping
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {orders.map((order) => {
                                    const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED;
                                    return (
                                        <div
                                            key={order._id}
                                            onClick={() => navigate(`/orders/${order._id}`)}
                                            className="p-4 rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                                                    {order.items?.[0]?.image ? (
                                                        <img
                                                            src={imgUrl.thumbnail(order.items[0].image)}
                                                            alt={order.items[0].name}
                                                            className="w-full h-full object-contain p-1"
                                                        />
                                                    ) : (
                                                        <FaBox size={16} className="text-stone-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-zinc-900 text-xs sm:text-sm">
                                                            Order #{order._id.slice(-6).toUpperCase()}
                                                        </h4>
                                                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${cfg.color}`}>
                                                            {cfg.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-zinc-400 mt-0.5">
                                                        {order.items?.length || 1} item(s) · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-stone-200">
                                                <p className="font-black text-zinc-900 text-sm">
                                                    ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                                                </p>
                                                <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                                                    Track <FaArrowRight size={9} />
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: SECURITY & CHANGE PASSWORD */}
                {activeTab === "security" && (
                    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8">
                        <div className="pb-4 border-b border-stone-100 mb-6">
                            <h2 className="text-base font-black text-zinc-900">Security & Password</h2>
                            <p className="text-xs text-zinc-400 mt-0.5">Ensure your account is protected with a secure password.</p>
                        </div>

                        {passwordMsg.text && (
                            <div className={`p-3.5 rounded-xl text-xs font-bold mb-5 flex items-center gap-2 ${passwordMsg.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                                {passwordMsg.type === "success" ? <FaCheck size={11} /> : <FaTimes size={11} />}
                                <span>{passwordMsg.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                            <div>
                                <label className="text-xs font-bold text-zinc-700 block mb-1">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showCurrPass ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                                    />
                                    <FaKey size={12} className="absolute left-3.5 top-3.5 text-zinc-400" />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrPass(!showCurrPass)}
                                        className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-600"
                                    >
                                        {showCurrPass ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-700 block mb-1">New Password (Min 8 Characters)</label>
                                <div className="relative">
                                    <input
                                        type={showNewPass ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                                    />
                                    <FaLock size={12} className="absolute left-3.5 top-3.5 text-zinc-400" />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPass(!showNewPass)}
                                        className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-600"
                                    >
                                        {showNewPass ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-700 block mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter new password"
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                                    />
                                    <FaShieldAlt size={12} className="absolute left-3.5 top-3.5 text-zinc-400" />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={changingPassword}
                                    className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-2"
                                >
                                    {changingPassword ? (
                                        <><FaSpinner size={11} className="animate-spin" /> Updating Password...</>
                                    ) : (
                                        "Update Password"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>

            {/* ADDRESS MODAL (ADD / EDIT) */}
            {addressModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                                <FaMapMarkerAlt className="text-amber-500" />
                                {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                            </h3>
                            <button
                                onClick={() => setAddressModalOpen(false)}
                                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700"
                            >
                                <FaTimes size={11} />
                            </button>
                        </div>

                        {addressError && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                                {addressError}
                            </div>
                        )}

                        <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
                            {/* Address Type Label */}
                            <div>
                                <label className="font-bold text-zinc-700 block mb-1">Address Label</label>
                                <div className="flex gap-2">
                                    {["Home", "Work", "Other"].map((lbl) => (
                                        <button
                                            type="button"
                                            key={lbl}
                                            onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                                            className={`flex-1 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${addressForm.label === lbl ? "bg-amber-500 text-white border-amber-500 shadow-xs" : "bg-stone-50 border-stone-200 text-zinc-700 hover:bg-stone-100"}`}
                                        >
                                            {lbl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-zinc-700 block mb-1">Contact Name *</label>
                                    <input
                                        type="text"
                                        value={addressForm.name}
                                        onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                                        placeholder="Full name"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-zinc-700 block mb-1">Phone Number *</label>
                                    <input
                                        type="tel"
                                        value={addressForm.phone}
                                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                                        placeholder="10-digit number"
                                        maxLength={10}
                                        className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-zinc-700 block mb-1">House / Flat / Building No. *</label>
                                <input
                                    type="text"
                                    value={addressForm.house}
                                    onChange={(e) => setAddressForm({ ...addressForm, house: e.target.value })}
                                    placeholder="e.g. Flat 302, Green Heights"
                                    className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-zinc-700 block mb-1">Street / Area / Colony *</label>
                                <input
                                    type="text"
                                    value={addressForm.area}
                                    onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                                    placeholder="e.g. Near Shiv Mandir, Main Road"
                                    className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-zinc-700 block mb-1">Landmark (Optional)</label>
                                <input
                                    type="text"
                                    value={addressForm.landmark}
                                    onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                                    placeholder="e.g. Opposite City Hospital"
                                    className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="font-bold text-zinc-700 block mb-1">City *</label>
                                    <input
                                        type="text"
                                        value={addressForm.city}
                                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                        placeholder="City"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-zinc-700 block mb-1">State *</label>
                                    <input
                                        type="text"
                                        value={addressForm.state}
                                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                        placeholder="State"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-zinc-700 block mb-1">PIN Code *</label>
                                    <input
                                        type="text"
                                        value={addressForm.pincode}
                                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                        placeholder="6 digits"
                                        maxLength={6}
                                        className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={addressForm.isDefault}
                                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                                        className="rounded text-amber-500 focus:ring-amber-400"
                                    />
                                    <span className="text-xs font-bold text-zinc-700">Set as Default Delivery Address</span>
                                </label>
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-stone-100">
                                <button
                                    type="submit"
                                    disabled={savingAddress}
                                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    {savingAddress ? (
                                        <><FaSpinner size={10} className="animate-spin" /> Saving...</>
                                    ) : (
                                        "Save Address"
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAddressModalOpen(false)}
                                    className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;