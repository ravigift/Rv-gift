import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import {
    FaArrowLeft, FaShieldAlt, FaTruck, FaCheckCircle,
    FaWhatsapp, FaUser, FaMapMarkerAlt, FaClipboardList,
    FaPencilAlt, FaCreditCard, FaLock, FaRedo, FaMoneyBillWave,
    FaImage, FaLocationArrow, FaSpinner, FaTimesCircle,
    FaBookmark, FaPlus, FaEdit, FaTrash,
    FaHome, FaBriefcase, FaShippingFast,
} from "react-icons/fa";

/* ─────────────────────────────────────
   CONSTANTS
   BUG FIX: FREE_DELIVERY_ABOVE = 0 matlab har order FREE tha
   Sahi values set karo yahan
───────────────────────────────────── */
const PLATFORM_FEE = 0;
const FREE_DELIVERY_ABOVE = 0;   // ← orders above ₹499 = free delivery
const DEFAULT_DELIVERY = 0;    // ← default if Shiprocket rate fetch fails

const LABEL_ICONS = {
    Home: <FaHome size={10} />,
    Work: <FaBriefcase size={10} />,
    Other: <FaMapMarkerAlt size={10} />,
};

const inputClass =
    "w-full px-4 py-3 rounded-xl bg-white border border-stone-200 text-zinc-800 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200";

const emptyForm = () => ({
    label: "Home", name: "", phone: "", house: "",
    area: "", landmark: "", city: "", state: "", pincode: "",
});

const loadRazorpay = () =>
    new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });

const serializeItems = (items) =>
    items.map((item) => ({
        productId: item.productId || item._id,
        name: item.name,
        price: item.price,
        qty: item.quantity || item.qty || 1,
        image: typeof item.image === "string" ? item.image : item.images?.[0]?.url || "",
        customization: {
            text: item.customization?.text?.trim() || "",
            imageUrl: item.customization?.imageUrl?.trim() || "",
            note: item.customization?.note?.trim() || "",
        },
        selectedSize: item.selectedSize || "",
    }));

/* ─────────────────────────────────────
   ADDRESS FORM
───────────────────────────────────── */
const AddressForm = ({ initial = emptyForm(), onSave, onCancel, saving }) => {
    const [form, setForm] = useState(initial);
    const [pincodeMsg, setPincodeMsg] = useState({ text: "", ok: null });
    const [pincodeLoad, setPincodeLoad] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsMsg, setGpsMsg] = useState("");
    const [formError, setFormError] = useState("");
    const pincodeTimer = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        setFormError("");
        if (name === "pincode") {
            setPincodeMsg({ text: "", ok: null });
            clearTimeout(pincodeTimer.current);
            if (/^\d{6}$/.test(value))
                pincodeTimer.current = setTimeout(() => checkPincode(value), 400);
        }
    };

    const checkPincode = async (pin) => {
        try {
            setPincodeLoad(true);
            const { data } = await api.get(`/addresses/pincode/${pin}`);
            setForm(f => ({ ...f, city: data.city, state: data.state }));
            setPincodeMsg({ text: `✓ ${data.city}, ${data.state}`, ok: true });
        } catch (err) {
            setPincodeMsg({ text: err.response?.data?.message || "Invalid pincode", ok: false });
        } finally { setPincodeLoad(false); }
    };

    const handleGPS = () => {
        if (!navigator.geolocation) { setGpsMsg("Not supported"); return; }
        setGpsLoading(true); setGpsMsg("");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    const addr = data.address || {};
                    const detectedPin = addr.postcode || "";
                    setForm(f => ({
                        ...f,
                        area: addr.suburb || addr.neighbourhood || addr.road || f.area,
                        city: addr.city || addr.town || addr.village || f.city,
                        state: addr.state || f.state,
                        pincode: detectedPin || f.pincode,
                    }));
                    setGpsMsg(`📍 ${addr.city || addr.town || "Location"} detected`);
                    if (/^\d{6}$/.test(detectedPin)) checkPincode(detectedPin);
                } catch { setGpsMsg("Could not get address"); }
                setGpsLoading(false);
            },
            () => { setGpsMsg("Permission denied"); setGpsLoading(false); },
            { timeout: 10000 }
        );
    };

    const handleSubmit = () => {
        if (!form.name.trim()) return setFormError("Name is required");
        if (!/^[6-9]\d{9}$/.test(form.phone.trim())) return setFormError("Enter valid 10-digit mobile number");
        if (!form.house.trim()) return setFormError("House/Flat is required");
        if (!form.area.trim()) return setFormError("Area is required");
        if (!/^\d{6}$/.test(form.pincode.trim())) return setFormError("Enter valid 6-digit pincode");
        if (!form.city.trim() || !form.state.trim()) return setFormError("City and state are required");
        onSave(form);
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                {["Home", "Work", "Other"].map(l => (
                    <button key={l} type="button" onClick={() => setForm(f => ({ ...f, label: l }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${form.label === l ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-500 border-stone-200 hover:border-zinc-400"}`}>
                        {LABEL_ICONS[l]} {l}
                    </button>
                ))}
            </div>
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-500">Contact</p>
                <button onClick={handleGPS} disabled={gpsLoading}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-[11px] font-bold hover:bg-blue-100 disabled:opacity-60 cursor-pointer">
                    {gpsLoading ? <FaSpinner size={9} className="animate-spin" /> : <FaLocationArrow size={9} />}
                    {gpsLoading ? "Detecting..." : "Use GPS"}
                </button>
            </div>
            {gpsMsg && <p className={`text-[11px] font-medium px-2 py-1.5 rounded-lg border ${gpsMsg.startsWith("📍") ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-red-50 border-red-100 text-red-600"}`}>{gpsMsg}</p>}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="Rahul Verma" className={inputClass} />
                </div>
                <div>
                    <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Mobile *</label>
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit" maxLength={10} className={inputClass} />
                </div>
            </div>
            <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">House / Flat / Floor *</label>
                <input name="house" value={form.house} onChange={handleChange} placeholder="e.g. 42, 3rd Floor" className={inputClass} />
            </div>
            <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Area / Street *</label>
                <input name="area" value={form.area} onChange={handleChange} placeholder="e.g. MG Road" className={inputClass} />
            </div>
            <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Landmark (Optional)</label>
                <input name="landmark" value={form.landmark} onChange={handleChange} placeholder="Near City Mall" className={inputClass} />
            </div>
            <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block flex items-center gap-1">
                    Pincode *
                    {pincodeLoad && <FaSpinner size={9} className="animate-spin text-amber-500" />}
                </label>
                <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="6-digit pincode" maxLength={6}
                    className={`${inputClass} ${pincodeMsg.ok === true ? "border-emerald-400 ring-1 ring-emerald-200" : pincodeMsg.ok === false ? "border-red-400 ring-1 ring-red-200" : ""}`} />
                {pincodeMsg.text && (
                    <p className={`text-[11px] mt-1 font-semibold flex items-center gap-1 ${pincodeMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                        {pincodeMsg.ok ? <FaCheckCircle size={9} /> : <FaTimesCircle size={9} />}
                        {pincodeMsg.text}
                    </p>
                )}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">City *</label>
                    <input name="city" value={form.city} onChange={handleChange} placeholder="Auto-filled" className={inputClass} />
                </div>
                <div>
                    <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">State *</label>
                    <input name="state" value={form.state} onChange={handleChange} placeholder="Auto-filled" className={inputClass} />
                </div>
            </div>
            {formError && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}
            <div className="flex gap-2 pt-1">
                <button onClick={handleSubmit} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer">
                    {saving ? <><FaSpinner className="animate-spin" size={13} /> Saving...</> : <><FaBookmark size={12} /> Save Address</>}
                </button>
                <button onClick={onCancel}
                    className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-zinc-600 rounded-xl font-bold text-sm transition-all cursor-pointer">
                    Cancel
                </button>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────
   MAIN CHECKOUT
───────────────────────────────────── */
const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { cartItems, totalPrice, clear } = useCart();

    const buyNowItem = location.state?.buyNowItem || null;
    const checkoutItems = buyNowItem ? [buyNowItem] : cartItems;
    const itemsTotal = buyNowItem ? buyNowItem.price * (buyNowItem.quantity || 1) : totalPrice;

    // ── Shipping ──
    // BUG FIX: was always 0 because FREE_DELIVERY_ABOVE was 0
    const [shippingRate, setShippingRate] = useState(itemsTotal >= FREE_DELIVERY_ABOVE ? 0 : DEFAULT_DELIVERY);
    const [shippingCourier, setShippingCourier] = useState("");
    const [shippingEtd, setShippingEtd] = useState("");
    const [shippingLoading, setShippingLoading] = useState(false);
    const shippingFetched = useRef(false);

    const deliveryCharge = itemsTotal >= FREE_DELIVERY_ABOVE ? 0 : shippingRate;
    const finalTotal = itemsTotal + PLATFORM_FEE + deliveryCharge;

    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [payState, setPayState] = useState("idle");
    const [paymentMethod, setPaymentMethod] = useState("");

    const [contact, setContact] = useState({ name: user?.name || "", phone: "", email: user?.email || "" });

    // ── Address states ──
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [addrLoading, setAddrLoading] = useState(false);
    const [selectedAddrId, setSelectedAddrId] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAddr, setEditingAddr] = useState(null);
    const [savingAddr, setSavingAddr] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    useEffect(() => {
        if (checkoutItems.length === 0) navigate("/");
        if (user) fetchAddresses();
    }, []);

    const fetchAddresses = useCallback(async () => {
        try {
            setAddrLoading(true);
            const { data } = await api.get("/addresses");
            setSavedAddresses(Array.isArray(data) ? data : []);
            const def = data.find(a => a.isDefault);
            if (def) setSelectedAddrId(def._id);
            else if (data.length > 0) setSelectedAddrId(data[0]._id);
        } catch { }
        finally { setAddrLoading(false); }
    }, []);

    // ── Fetch shipping rate from Shiprocket ──
    const fetchShippingRate = useCallback(async (pincode, isCod = false) => {
        if (!pincode || !/^\d{6}$/.test(pincode)) return;
        // BUG FIX: skip if free delivery applies
        if (itemsTotal >= FREE_DELIVERY_ABOVE) { setShippingRate(0); return; }
        try {
            setShippingLoading(true);
            const { data } = await api.post("/shipping/rate", {
                deliveryPincode: pincode,
                weight: checkoutItems.reduce((sum, i) => sum + 500 * (i.quantity || i.qty || 1), 0),
                cod: isCod,
            });
            if (data.rate !== undefined) {
                setShippingRate(data.rate);
                setShippingCourier(data.courier || "");
                setShippingEtd(data.etd || "");
            }
        } catch {
            // keep DEFAULT_DELIVERY on error — don't crash
        } finally { setShippingLoading(false); }
    }, [checkoutItems, itemsTotal]);

    const selectedAddress = savedAddresses.find(a => a._id === selectedAddrId);

    // Auto-fetch when address selected (only once per address)
    useEffect(() => {
        if (selectedAddress?.pincode && !shippingFetched.current) {
            shippingFetched.current = true;
            fetchShippingRate(selectedAddress.pincode, paymentMethod === "cod");
        }
    }, [selectedAddress]);

    // Re-fetch on payment method change (COD may have higher rate)
    useEffect(() => {
        if (selectedAddress?.pincode && paymentMethod) {
            fetchShippingRate(selectedAddress.pincode, paymentMethod === "cod");
        }
    }, [paymentMethod]);

    const handleAddAddress = async (form) => {
        try {
            setSavingAddr(true);
            const { data } = await api.post("/addresses", { ...form, isDefault: savedAddresses.length === 0 });
            setSavedAddresses(data.addresses);
            const newAddr = data.addresses[data.addresses.length - 1];
            setSelectedAddrId(newAddr._id);
            setShowAddForm(false);
            shippingFetched.current = false;
            fetchShippingRate(form.pincode, paymentMethod === "cod");
        } catch (err) { alert(err.response?.data?.message || "Failed to save address"); }
        finally { setSavingAddr(false); }
    };

    const handleEditAddress = async (form) => {
        try {
            setSavingAddr(true);
            const { data } = await api.put(`/addresses/${editingAddr._id}`, form);
            setSavedAddresses(data.addresses);
            setEditingAddr(null);
            // re-fetch rate if this was selected address
            if (editingAddr._id === selectedAddrId) {
                shippingFetched.current = false;
                fetchShippingRate(form.pincode, paymentMethod === "cod");
            }
        } catch (err) { alert(err.response?.data?.message || "Failed to update address"); }
        finally { setSavingAddr(false); }
    };

    const handleDeleteAddress = async (id) => {
        try {
            const { data } = await api.delete(`/addresses/${id}`);
            setSavedAddresses(data.addresses);
            if (selectedAddrId === id) {
                const def = data.addresses.find(a => a.isDefault);
                setSelectedAddrId(def?._id || data.addresses[0]?._id || null);
            }
            setDeleteConfirmId(null);
        } catch { alert("Failed to delete address"); }
    };

    const handleSetDefault = async (id) => {
        try {
            const { data } = await api.put(`/addresses/${id}/default`);
            setSavedAddresses(data.addresses);
        } catch { }
    };

    const getAddress = () => {
        if (!selectedAddress) return "";
        const { house, area, landmark, city, state, pincode } = selectedAddress;
        return `${house}, ${area},${landmark ? " " + landmark + "," : ""} ${city}, ${state} - ${pincode}`;
    };

    const handleContactContinue = () => {
        if (!contact.name.trim()) return setError("Please enter your full name");
        if (!/^[6-9]\d{9}$/.test(contact.phone.trim())) return setError("Enter valid 10-digit mobile number");
        setError(""); setStep(2);
    };

    const handleAddressContinue = () => {
        if (!selectedAddress) return setError("Please select or add a delivery address");
        setError("");
        shippingFetched.current = false;
        fetchShippingRate(selectedAddress.pincode, paymentMethod === "cod");
        setStep(3);
    };

    const handleCOD = async () => {
        try {
            setLoading(true); setError("");
            const { data } = await api.post("/orders", {
                items: serializeItems(checkoutItems),
                customerName: contact.name,
                phone: selectedAddress?.phone || contact.phone,
                email: contact.email || `${contact.phone}@rvgifts.com`,
                address: getAddress(),
                totalAmount: finalTotal,
                platformFee: PLATFORM_FEE,
                deliveryCharge,
                paymentMethod: "COD",
            });
            if (!buyNowItem) clear();
            let msg = `🛒 *New COD Order - RV GIFTS*\n`;
            msg += `Order ID: #${data.orderId.toString().slice(-6).toUpperCase()}\n\n`;
            msg += `👤 *Customer:* ${contact.name} | 📞 ${selectedAddress?.phone || contact.phone}\n`;
            msg += `📍 *Address:* ${getAddress()}\n\n`;
            msg += `💰 *Total (COD):* Rs.${finalTotal.toLocaleString("en-IN")}`;
            window.open(`https://wa.me/918808485840?text=${encodeURIComponent(msg)}`, "_blank");
            navigate(`/order-success/${data.orderId}`, { replace: true, state: { paymentMethod: "COD" } });
        } catch (err) {
            setError(err.response?.data?.message || "Order placement failed.");
        } finally { setLoading(false); }
    };

    const handlePayWithRazorpay = async () => {
        try {
            setLoading(true); setError(""); setPayState("processing");
            const loaded = await loadRazorpay();
            if (!loaded) { setError("Payment gateway failed to load."); setPayState("failed"); setLoading(false); return; }

            const { data: rpOrder } = await api.post("/payment/create-order", {
                amount: finalTotal,
                receipt: `order_${Date.now()}`,
            });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: rpOrder.amount,
                currency: rpOrder.currency,
                name: "RV Gifts",
                description: `Order - ${checkoutItems.length} item(s)`,
                order_id: rpOrder.id,
                prefill: { name: contact.name, email: contact.email || "", contact: `+91${contact.phone}` },
                theme: { color: "#F59E0B" },
                handler: async (response) => {
                    try {
                        setPayState("processing");
                        const { data } = await api.post("/payment/verify", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderData: {
                                items: serializeItems(checkoutItems),
                                customerName: contact.name,
                                phone: selectedAddress?.phone || contact.phone,
                                email: contact.email || `${contact.phone}@rvgifts.com`,
                                address: getAddress(),
                                totalAmount: finalTotal,
                                platformFee: PLATFORM_FEE,
                                deliveryCharge,
                            },
                        });
                        if (data.success) {
                            setPayState("success");
                            if (!buyNowItem) clear();
                            let msg = `✅ *Payment Received - RV GIFTS*\n`;
                            msg += `Order ID: #${data.orderId.toString().slice(-6).toUpperCase()}\n`;
                            msg += `Payment ID: ${response.razorpay_payment_id}\n\n`;
                            msg += `👤 *Customer:* ${contact.name} | 📞 ${selectedAddress?.phone || contact.phone}\n`;
                            msg += `📍 *Address:* ${getAddress()}\n\n`;
                            msg += `💳 *Total Paid:* Rs.${finalTotal.toLocaleString("en-IN")}`;
                            window.open(`https://wa.me/918808485840?text=${encodeURIComponent(msg)}`, "_blank");
                            navigate(`/order-success/${data.orderId}`, { replace: true, state: { paymentId: data.paymentId } });
                        }
                    } catch (err) {
                        setPayState("failed");
                        setError("Payment done but order failed. Contact support with Payment ID: " + response.razorpay_payment_id);
                    } finally { setLoading(false); }
                },
                modal: { ondismiss: () => { setPayState("failed"); setLoading(false); setError("Payment cancelled. You can retry."); } },
            };
            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (r) => { setPayState("failed"); setLoading(false); setError(`Payment failed: ${r.error.description}`); });
            rzp.open();
        } catch (err) {
            setPayState("failed");
            setError(err.response?.data?.message || "Payment initialization failed.");
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, label: "Contact", icon: <FaUser size={11} /> },
        { id: 2, label: "Address", icon: <FaMapMarkerAlt size={11} /> },
        { id: 3, label: "Payment", icon: <FaCreditCard size={11} /> },
    ];

    return (
        <div className="min-h-screen bg-stone-100 py-6 px-4">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); .co{font-family:'DM Sans',sans-serif;}`}</style>
            <div className="co max-w-5xl mx-auto">

                <button onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 text-sm font-medium mb-5 transition-colors group">
                    <span className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center group-hover:border-amber-400 group-hover:text-amber-500 transition-all">
                        <FaArrowLeft size={12} />
                    </span>
                    {step === 1 ? "Back to Cart" : `Back to ${steps[step - 2].label}`}
                </button>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">

                        {/* Step Indicator */}
                        <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-4 shadow-sm">
                            <div className="flex items-center">
                                {steps.map((s, i) => (
                                    <div key={s.id} className="flex items-center flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step > s.id ? "bg-emerald-500 text-white" : step === s.id ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "bg-stone-100 text-zinc-400"}`}>
                                                {step > s.id ? <FaCheckCircle size={14} /> : s.icon}
                                            </div>
                                            <span className={`text-xs font-semibold hidden sm:block ${step === s.id ? "text-amber-600" : step > s.id ? "text-emerald-600" : "text-zinc-400"}`}>{s.label}</span>
                                        </div>
                                        {i < steps.length - 1 && (
                                            <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${step > s.id ? "bg-emerald-400" : "bg-stone-200"}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* STEP 1 — Contact */}
                        {step === 1 && (
                            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                                <h2 className="font-bold text-zinc-800 text-lg mb-5 flex items-center gap-2">
                                    <FaUser className="text-amber-500" size={15} /> Contact Details
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Full Name *</label>
                                        <input name="name" placeholder="e.g. Rahul Verma" value={contact.name}
                                            onChange={e => { setContact(c => ({ ...c, name: e.target.value })); setError(""); }}
                                            className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Mobile Number *</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-medium">+91</span>
                                            <input name="phone" placeholder="10-digit" value={contact.phone} maxLength={10}
                                                onChange={e => { setContact(c => ({ ...c, phone: e.target.value })); setError(""); }}
                                                className={`${inputClass} pl-12`} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Email <span className="text-zinc-400 font-normal">(for order confirmation)</span></label>
                                        <input name="email" type="email" placeholder="your@email.com" value={contact.email}
                                            onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                                            className={inputClass} />
                                    </div>
                                    {error && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                                    <button onClick={handleContactContinue}
                                        className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-amber-200">
                                        Continue to Address
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2 — Address */}
                        {step === 2 && (
                            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                                <h2 className="font-bold text-zinc-800 text-lg mb-5 flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-amber-500" size={15} /> Delivery Address
                                </h2>
                                {addrLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <FaSpinner className="animate-spin text-amber-400" size={22} />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {savedAddresses.map(addr => (
                                            <div key={addr._id}
                                                onClick={() => { if (!editingAddr && !showAddForm) setSelectedAddrId(addr._id); }}
                                                className={`relative rounded-2xl border-2 p-4 transition-all cursor-pointer ${selectedAddrId === addr._id ? "border-amber-400 bg-amber-50" : "border-stone-200 bg-white hover:border-stone-300"}`}>
                                                {selectedAddrId === addr._id && (
                                                    <div className="absolute top-3 right-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                                        <FaCheckCircle size={11} className="text-white" />
                                                    </div>
                                                )}
                                                {editingAddr?._id === addr._id ? (
                                                    <AddressForm initial={editingAddr} onSave={handleEditAddress} onCancel={() => setEditingAddr(null)} saving={savingAddr} />
                                                ) : (
                                                    <>
                                                        <div className="flex items-start gap-3 pr-6">
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-black ${addr.label === "Home" ? "bg-amber-500" : addr.label === "Work" ? "bg-blue-500" : "bg-violet-500"}`}>
                                                                {LABEL_ICONS[addr.label] || <FaMapMarkerAlt size={10} />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="font-bold text-zinc-800 text-sm">{addr.label}</p>
                                                                    {addr.isDefault && <span className="text-[10px] font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Default</span>}
                                                                </div>
                                                                <p className="text-xs font-semibold text-zinc-700 mt-0.5">{addr.name} · {addr.phone}</p>
                                                                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                                                                    {addr.house}, {addr.area},{addr.landmark ? ` ${addr.landmark},` : ""} {addr.city}, {addr.state} - {addr.pincode}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-stone-100">
                                                            <button onClick={(e) => { e.stopPropagation(); setEditingAddr(addr); setShowAddForm(false); }}
                                                                className="flex items-center gap-1 text-[11px] font-bold text-blue-500 hover:text-blue-700 cursor-pointer">
                                                                <FaEdit size={10} /> Edit
                                                            </button>
                                                            {!addr.isDefault && (
                                                                <button onClick={(e) => { e.stopPropagation(); handleSetDefault(addr._id); }}
                                                                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 hover:text-emerald-700 cursor-pointer">
                                                                    <FaBookmark size={10} /> Set Default
                                                                </button>
                                                            )}
                                                            {deleteConfirmId === addr._id ? (
                                                                <div className="flex items-center gap-2 ml-auto" onClick={e => e.stopPropagation()}>
                                                                    <span className="text-[11px] text-red-500 font-bold">Delete?</span>
                                                                    <button onClick={() => handleDeleteAddress(addr._id)} className="text-[11px] font-black text-white bg-red-500 px-2 py-0.5 rounded-lg cursor-pointer">Yes</button>
                                                                    <button onClick={() => setDeleteConfirmId(null)} className="text-[11px] font-black text-zinc-500 bg-stone-100 px-2 py-0.5 rounded-lg cursor-pointer">No</button>
                                                                </div>
                                                            ) : (
                                                                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(addr._id); }}
                                                                    className="flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-600 ml-auto cursor-pointer">
                                                                    <FaTrash size={9} /> Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}

                                        {savedAddresses.length < 5 && (
                                            showAddForm ? (
                                                <div className="border-2 border-dashed border-amber-300 rounded-2xl p-4 bg-amber-50/50">
                                                    <p className="text-xs font-black text-amber-700 mb-3 flex items-center gap-1.5"><FaPlus size={9} /> New Address</p>
                                                    <AddressForm onSave={handleAddAddress} onCancel={() => setShowAddForm(false)} saving={savingAddr} />
                                                </div>
                                            ) : (
                                                <button onClick={() => { setShowAddForm(true); setEditingAddr(null); }}
                                                    className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-stone-300 rounded-2xl text-sm font-bold text-zinc-500 hover:border-amber-400 hover:text-amber-600 transition-all cursor-pointer">
                                                    <FaPlus size={12} /> Add New Address
                                                    <span className="text-xs font-normal text-zinc-400">({savedAddresses.length}/5)</span>
                                                </button>
                                            )
                                        )}

                                        {!user && savedAddresses.length === 0 && !showAddForm && (
                                            <p className="text-xs text-zinc-400 text-center py-2">
                                                <button onClick={() => navigate("/login")} className="text-amber-600 font-bold hover:underline cursor-pointer">Login</button> to save addresses, or add one below
                                            </p>
                                        )}

                                        {error && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                                        <button onClick={handleAddressContinue}
                                            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-amber-200 mt-2">
                                            Continue to Payment
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 3 — Payment */}
                        {step === 3 && (
                            <div className="space-y-4">
                                {/* Order Summary */}
                                <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                                    <h2 className="font-bold text-zinc-800 text-base mb-4 flex items-center gap-2">
                                        <FaClipboardList className="text-amber-500" size={14} /> Order Summary
                                    </h2>
                                    <div className="space-y-3">
                                        {checkoutItems.map((item, idx) => (
                                            <div key={item.cartKey || item._id || idx} className="flex items-start gap-3 pb-3 border-b border-stone-100 last:border-0 last:pb-0">
                                                <img src={item.images?.[0]?.url || item.image || ""} alt={item.name}
                                                    className="w-14 h-14 rounded-xl object-contain bg-stone-50 border border-stone-100 p-1 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-zinc-800 text-sm truncate">{item.name}</p>
                                                    <p className="text-xs text-zinc-400 mt-0.5">Qty: {item.quantity || 1}</p>
                                                    <p className="font-bold text-zinc-800 text-sm mt-1">Rs.{(item.price * (item.quantity || 1)).toLocaleString("en-IN")}</p>
                                                    {(item.customization?.text || item.customization?.imageUrl || item.customization?.note) && (
                                                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                                            <p className="text-[10px] font-black text-amber-700 flex items-center gap-1"><FaPencilAlt size={8} /> Customization</p>
                                                            {item.customization.text && <p className="text-xs text-zinc-700">{item.customization.text}</p>}
                                                            {item.customization.imageUrl && (
                                                                <div className="flex items-center gap-2">
                                                                    <FaImage size={9} className="text-amber-500 shrink-0" />
                                                                    <img src={item.customization.imageUrl} alt="custom" className="h-12 w-12 object-cover rounded-lg border border-amber-200" />
                                                                    <span className="text-[10px] text-amber-600 font-semibold">Image uploaded</span>
                                                                </div>
                                                            )}
                                                            {item.customization.note && <p className="text-xs text-zinc-600">{item.customization.note}</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Delivering To */}
                                {selectedAddress && (
                                    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Delivering To</p>
                                            <button onClick={() => setStep(2)} className="text-xs text-amber-600 font-bold hover:underline cursor-pointer">Change</button>
                                        </div>
                                        <p className="font-bold text-zinc-800 text-sm">{selectedAddress.name}</p>
                                        <p className="text-zinc-500 text-xs mt-0.5">{selectedAddress.phone}</p>
                                        <p className="text-zinc-600 text-xs mt-1.5 leading-relaxed">{getAddress()}</p>

                                        {/* BUG FIX: only show shipping info when delivery is NOT free */}
                                        {itemsTotal < FREE_DELIVERY_ABOVE && (shippingCourier || shippingLoading) && (
                                            <div className="mt-3 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
                                                <FaShippingFast size={12} className="text-indigo-500 shrink-0" />
                                                {shippingLoading
                                                    ? <p className="text-xs text-indigo-600 font-medium">Calculating shipping rate…</p>
                                                    : <p className="text-xs text-indigo-700 font-medium">{shippingCourier} · {shippingEtd}</p>}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Payment Method */}
                                <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                                    <h2 className="font-bold text-zinc-800 text-base mb-4 flex items-center gap-2">
                                        <FaCreditCard className="text-amber-500" size={14} /> Choose Payment Method
                                    </h2>
                                    <div className="space-y-3 mb-5">
                                        <button onClick={() => { setPaymentMethod("online"); setError(""); setPayState("idle"); }}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === "online" ? "border-amber-400 bg-amber-50" : "border-stone-200 hover:border-stone-300"}`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === "online" ? "bg-amber-500" : "bg-stone-100"}`}>
                                                <FaLock size={16} className={paymentMethod === "online" ? "text-white" : "text-zinc-400"} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className={`font-bold text-sm ${paymentMethod === "online" ? "text-zinc-800" : "text-zinc-600"}`}>Pay Online</p>
                                                <p className="text-xs text-zinc-400 mt-0.5">UPI, Cards, Net Banking, Wallets, EMI</p>
                                            </div>
                                            {paymentMethod === "online" && <FaCheckCircle className="text-amber-500 shrink-0" size={18} />}
                                        </button>

                                        <button onClick={() => { setPaymentMethod("cod"); setError(""); setPayState("idle"); }}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === "cod" ? "border-emerald-400 bg-emerald-50" : "border-stone-200 hover:border-stone-300"}`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === "cod" ? "bg-emerald-500" : "bg-stone-100"}`}>
                                                <FaMoneyBillWave size={16} className={paymentMethod === "cod" ? "text-white" : "text-zinc-400"} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className={`font-bold text-sm ${paymentMethod === "cod" ? "text-zinc-800" : "text-zinc-600"}`}>
                                                    Cash on Delivery
                                                    <span className="ml-2 text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">COD</span>
                                                </p>
                                                <p className="text-xs text-zinc-400 mt-0.5">Pay when your order arrives</p>
                                            </div>
                                            {paymentMethod === "cod" && <FaCheckCircle className="text-emerald-500 shrink-0" size={18} />}
                                        </button>
                                    </div>

                                    {error && (
                                        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                                            <span className="shrink-0">⚠️</span>
                                            <p className="text-red-600 text-xs">{error}</p>
                                        </div>
                                    )}
                                    {!paymentMethod && <p className="text-center text-xs text-zinc-400 py-2">Select a payment method to continue</p>}

                                    {paymentMethod === "cod" && (
                                        <button onClick={handleCOD} disabled={loading}
                                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-base active:scale-[0.98] disabled:opacity-60 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200">
                                            {loading ? <><FaSpinner className="animate-spin" size={16} /> Placing Order...</> : <><FaMoneyBillWave size={16} /> Place Order (COD) — Rs.{finalTotal.toLocaleString("en-IN")}</>}
                                        </button>
                                    )}
                                    {paymentMethod === "online" && (
                                        <button onClick={handlePayWithRazorpay} disabled={loading}
                                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-base active:scale-[0.98] disabled:opacity-60 shadow-lg"
                                            style={{ background: payState === "failed" ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#0f172a,#1e293b)", color: "#fff", boxShadow: "0 8px 24px rgba(15,23,42,0.3)" }}>
                                            {loading ? <><FaSpinner className="animate-spin" size={16} /> Processing...</> : payState === "failed" ? <><FaRedo size={16} /> Retry — Rs.{finalTotal.toLocaleString("en-IN")}</> : <><FaLock size={14} /> Pay Rs.{finalTotal.toLocaleString("en-IN")} Securely</>}
                                        </button>
                                    )}
                                    <p className="text-center text-[10px] text-zinc-400 mt-3 flex items-center justify-center gap-1">
                                        <FaShieldAlt size={9} /> Your order is 100% secure
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Price Summary */}
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="sticky top-20 space-y-4">
                            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-stone-100">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Price Details</h3>
                                </div>
                                <div className="px-5 py-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600">Price ({checkoutItems.length} item{checkoutItems.length > 1 ? "s" : ""})</span>
                                        <span className="font-semibold text-zinc-800">Rs.{itemsTotal.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600 flex items-center gap-1.5">
                                            <FaTruck size={11} className="text-zinc-400" /> Delivery
                                            {shippingLoading && <FaSpinner size={9} className="animate-spin text-amber-400" />}
                                        </span>
                                        {itemsTotal >= FREE_DELIVERY_ABOVE
                                            ? <span className="font-semibold text-emerald-600">FREE</span>
                                            : shippingLoading
                                                ? <span className="text-zinc-400 text-xs">Calculating…</span>
                                                : <span className="font-semibold">Rs.{shippingRate}</span>}
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600 flex items-center gap-1.5"><FaShieldAlt size={11} className="text-zinc-400" /> Platform Fee</span>
                                        <span className="font-semibold">Rs.{PLATFORM_FEE}</span>
                                    </div>
                                    <div className="border-t border-dashed border-stone-200 pt-3 flex justify-between">
                                        <span className="font-bold text-zinc-800">Total Amount</span>
                                        <span className="font-black text-zinc-900 text-lg">Rs.{finalTotal.toLocaleString("en-IN")}</span>
                                    </div>
                                    {itemsTotal >= FREE_DELIVERY_ABOVE && (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
                                            <FaCheckCircle className="text-emerald-500" size={12} />
                                            <p className="text-emerald-700 text-xs font-medium">FREE delivery on this order!</p>
                                        </div>
                                    )}
                                    {itemsTotal < FREE_DELIVERY_ABOVE && !shippingLoading && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            <p className="text-amber-700 text-xs font-medium">Add Rs.{(FREE_DELIVERY_ABOVE - itemsTotal).toLocaleString("en-IN")} more for FREE delivery</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-5 py-4 space-y-3">
                                <div className="flex items-center gap-3 text-xs text-zinc-500"><FaShieldAlt className="text-amber-500 shrink-0" size={14} /><span>Safe and Secure Payment</span></div>
                                <div className="flex items-center gap-3 text-xs text-zinc-500"><FaTruck className="text-amber-500 shrink-0" size={14} /><span>Fast Delivery across India</span></div>
                                <div className="flex items-center gap-3 text-xs text-zinc-500"><FaWhatsapp className="text-emerald-500 shrink-0" size={14} /><span>WhatsApp order confirmation</span></div>
                                <div className="flex items-center gap-3 text-xs text-zinc-500"><FaMoneyBillWave className="text-emerald-500 shrink-0" size={14} /><span>Cash on Delivery available</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;