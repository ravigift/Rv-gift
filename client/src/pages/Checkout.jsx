// import { useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useCart } from "../hooks/useCart";
// import api from "../api/axios";
// import { FaArrowLeft, FaShieldAlt, FaTruck, FaTag, FaCheckCircle, FaWhatsapp, FaUser, FaMapMarkerAlt, FaClipboardList, FaPencilAlt } from "react-icons/fa";

// const PLATFORM_FEE = 9;
// const FREE_DELIVERY_ABOVE = 499;
// const DELIVERY_CHARGE = 49;

// const inputClass =
//     "w-full px-4 py-3 rounded-xl bg-white border border-stone-200 text-zinc-800 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200";

// const Checkout = () => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const { cartItems, totalPrice, clear } = useCart();

//     const buyNowItem = location.state?.buyNowItem;
//     const checkoutItems = buyNowItem ? [buyNowItem] : cartItems;
//     const itemsTotal = buyNowItem ? buyNowItem.price * (buyNowItem.quantity || 1) : totalPrice;

//     const deliveryCharge = itemsTotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;
//     const finalTotal = itemsTotal + PLATFORM_FEE + deliveryCharge;

//     const [step, setStep] = useState(1);
//     const [error, setError] = useState("");
//     const [loading, setLoading] = useState(false);

//     const [form, setForm] = useState({
//         name: "", phone: "", email: "",
//         house: "", area: "", landmark: "",
//         city: "", state: "", pincode: "",
//     });

//     useEffect(() => {
//         if (checkoutItems.length === 0) navigate("/");
//     }, [checkoutItems, navigate]);

//     const handleChange = (e) => {
//         setForm({ ...form, [e.target.name]: e.target.value });
//         setError("");
//     };

//     const handleContactContinue = () => {
//         if (!form.name.trim()) return setError("Please enter your full name");
//         if (!/^[6-9]\d{9}$/.test(form.phone.trim())) return setError("Enter valid 10-digit mobile number");
//         setStep(2);
//     };

//     const handleAddressContinue = () => {
//         if (!form.house.trim() || !form.area.trim() || !form.city.trim() || !form.state.trim() || !/^\d{6}$/.test(form.pincode)) {
//             return setError("Please complete your address correctly");
//         }
//         setStep(3);
//     };

//     const handleFinalOrder = async () => {
//         try {
//             setLoading(true);
//             setError("");

//             const orderPayload = {
//                 items: checkoutItems.map(item => ({
//                     productId: item._id,
//                     name: item.name,
//                     image: item.images?.[0]?.url || item.image || "",
//                     price: item.price,
//                     qty: item.quantity || 1,
//                     customization: {
//                         text: item.customization?.text || "",
//                         imageUrl: item.customization?.imageUrl || "",
//                         note: item.customization?.note || "",
//                     },
//                 })),
//                 customerName: form.name,
//                 phone: form.phone,
//                 email: form.email || `${form.phone}@rvgifts.com`,
//                 address: `${form.house}, ${form.area},${form.landmark ? " " + form.landmark + "," : ""} ${form.city}, ${form.state} - ${form.pincode}`,
//                 totalAmount: finalTotal,
//                 platformFee: PLATFORM_FEE,
//                 deliveryCharge,
//             };

//             const { data } = await api.post("/orders", orderPayload);

//             if (data.success) {
//                 let message = `🛒 *New Order - RV GIFTS*\n`;
//                 message += `Order ID: #${data.orderId.slice(-6)}\n\n`;
//                 message += `👤 *Customer:* ${form.name} | 📞 ${form.phone}\n`;
//                 message += `📍 *Address:* ${orderPayload.address}\n\n`;
//                 message += `🛍️ *Items:*\n`;

//                 checkoutItems.forEach((item, i) => {
//                     message += `  ${i + 1}. ${item.name} × ${item.quantity || 1} = ₹${item.price * (item.quantity || 1)}\n`;
//                     if (item.customization?.text) message += `      ✏️ Print: ${item.customization.text}\n`;
//                     if (item.customization?.imageUrl) message += `      🖼️ Image: ${item.customization.imageUrl}\n`;
//                     if (item.customization?.note) message += `      📝 Note: ${item.customization.note}\n`;
//                 });

//                 message += `\n💳 *Total Payable:* ₹${finalTotal.toLocaleString("en-IN")}`;

//                 const ownerNumber = "918808485840";
//                 const whatsappURL = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(message)}`;

//                 if (!buyNowItem) clear();

//                 window.open(whatsappURL, "_blank");
//                 navigate(`/orders/${data.orderId}`, { replace: true });
//             }
//         } catch (err) {
//             console.error("Order Save Error:", err);
//             setError(err.response?.data?.message || "Failed to place order. Please try again.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const steps = [
//         { id: 1, label: "Contact", icon: <FaUser size={11} /> },
//         { id: 2, label: "Address", icon: <FaMapMarkerAlt size={11} /> },
//         { id: 3, label: "Confirm", icon: <FaClipboardList size={11} /> },
//     ];

//     return (
//         <div className="min-h-screen bg-stone-100 py-6 px-4">
//             <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); .checkout-root { font-family: 'DM Sans', sans-serif; }`}</style>

//             <div className="checkout-root max-w-6xl mx-auto">

//                 <button onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)}
//                     className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 text-sm font-medium mb-5 transition-colors duration-150 group">
//                     <span className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center group-hover:border-amber-400 group-hover:text-amber-500 transition-all duration-200">
//                         <FaArrowLeft size={12} />
//                     </span>
//                     {step === 1 ? "Back to Cart" : `Back to ${steps[step - 2].label}`}
//                 </button>

//                 <div className="flex flex-col lg:flex-row gap-6 items-start">

//                     {/* LEFT */}
//                     <div className="flex-1 min-w-0 w-full">

//                         {/* Step Indicator */}
//                         <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-4 shadow-sm">
//                             <div className="flex items-center">
//                                 {steps.map((s, i) => (
//                                     <div key={s.id} className="flex items-center flex-1">
//                                         <div className="flex items-center gap-2">
//                                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step > s.id ? "bg-emerald-500 text-white" : step === s.id ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "bg-stone-100 text-zinc-400"}`}>
//                                                 {step > s.id ? <FaCheckCircle size={14} /> : s.icon}
//                                             </div>
//                                             <span className={`text-xs font-semibold hidden sm:block ${step === s.id ? "text-amber-600" : step > s.id ? "text-emerald-600" : "text-zinc-400"}`}>{s.label}</span>
//                                         </div>
//                                         {i < steps.length - 1 && (
//                                             <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${step > s.id ? "bg-emerald-400" : "bg-stone-200"}`} />
//                                         )}
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>

//                         {/* STEP 1 */}
//                         {step === 1 && (
//                             <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
//                                 <h2 className="font-bold text-zinc-800 text-lg mb-5 flex items-center gap-2">
//                                     <FaUser className="text-amber-500" size={15} /> Contact Details
//                                 </h2>
//                                 <div className="space-y-4">
//                                     <div>
//                                         <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Full Name *</label>
//                                         <input name="name" placeholder="e.g. Rahul Verma" value={form.name} onChange={handleChange} className={inputClass} />
//                                     </div>
//                                     <div>
//                                         <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Mobile Number *</label>
//                                         <div className="relative">
//                                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-medium">+91</span>
//                                             <input name="phone" placeholder="10-digit mobile number" value={form.phone} onChange={handleChange} maxLength={10} className={`${inputClass} pl-12`} />
//                                         </div>
//                                     </div>
//                                     <div>
//                                         <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Email <span className="text-zinc-400 font-normal">(Optional)</span></label>
//                                         <input name="email" placeholder="your@email.com" value={form.email} onChange={handleChange} className={inputClass} />
//                                     </div>
//                                     {error && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
//                                     <button onClick={handleContactContinue}
//                                         className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-md shadow-amber-200">
//                                         Continue to Address →
//                                     </button>
//                                 </div>
//                             </div>
//                         )}

//                         {/* STEP 2 */}
//                         {step === 2 && (
//                             <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
//                                 <h2 className="font-bold text-zinc-800 text-lg mb-5 flex items-center gap-2">
//                                     <FaMapMarkerAlt className="text-amber-500" size={15} /> Delivery Address
//                                 </h2>
//                                 <div className="space-y-4">
//                                     <div className="grid grid-cols-2 gap-3">
//                                         <div>
//                                             <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">House / Flat / Floor *</label>
//                                             <input name="house" placeholder="e.g. 42, 3rd Floor" value={form.house} onChange={handleChange} className={inputClass} />
//                                         </div>
//                                         <div>
//                                             <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Pincode *</label>
//                                             <input name="pincode" placeholder="6-digit pincode" value={form.pincode} onChange={handleChange} maxLength={6} className={inputClass} />
//                                         </div>
//                                     </div>
//                                     <div>
//                                         <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Area / Street / Colony *</label>
//                                         <input name="area" placeholder="e.g. MG Road, Sector 15" value={form.area} onChange={handleChange} className={inputClass} />
//                                     </div>
//                                     <div>
//                                         <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Landmark <span className="text-zinc-400 font-normal">(Optional)</span></label>
//                                         <input name="landmark" placeholder="e.g. Near City Mall" value={form.landmark} onChange={handleChange} className={inputClass} />
//                                     </div>
//                                     <div className="grid grid-cols-2 gap-3">
//                                         <div>
//                                             <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">City *</label>
//                                             <input name="city" placeholder="e.g. Lucknow" value={form.city} onChange={handleChange} className={inputClass} />
//                                         </div>
//                                         <div>
//                                             <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">State *</label>
//                                             <input name="state" placeholder="e.g. Uttar Pradesh" value={form.state} onChange={handleChange} className={inputClass} />
//                                         </div>
//                                     </div>
//                                     {error && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
//                                     <button onClick={handleAddressContinue}
//                                         className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-md shadow-amber-200">
//                                         Review Order →
//                                     </button>
//                                 </div>
//                             </div>
//                         )}

//                         {/* STEP 3 */}
//                         {step === 3 && (
//                             <div className="space-y-4">
//                                 <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
//                                     <h2 className="font-bold text-zinc-800 text-base mb-4 flex items-center gap-2">
//                                         <FaMapMarkerAlt className="text-amber-500" /> Delivering To
//                                     </h2>
//                                     <div className="flex items-start gap-3">
//                                         <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
//                                             <FaUser size={14} className="text-amber-500" />
//                                         </div>
//                                         <div className="min-w-0">
//                                             <p className="font-bold text-zinc-800 text-sm">{form.name}</p>
//                                             <p className="text-zinc-500 text-xs mt-0.5">+91 {form.phone}</p>
//                                             <p className="text-zinc-600 text-xs mt-1.5 leading-relaxed break-words">
//                                                 {form.house}, {form.area},{form.landmark ? ` ${form.landmark},` : ""} {form.city}, {form.state} - {form.pincode}
//                                             </p>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
//                                     <h2 className="font-bold text-zinc-800 text-base mb-4 flex items-center gap-2">
//                                         <FaTag className="text-amber-500" /> Order Items
//                                     </h2>
//                                     <div className="space-y-3">
//                                         {checkoutItems.map((item, idx) => (
//                                             <div key={idx} className="pb-3 border-b border-stone-100 last:border-0 last:pb-0">
//                                                 <div className="flex items-center gap-3">
//                                                     <img src={item.images?.[0]?.url || item.image}
//                                                         className="w-14 h-14 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0"
//                                                         alt={item.name} />
//                                                     <div className="flex-1 min-w-0">
//                                                         <p className="font-semibold text-zinc-800 text-sm truncate">{item.name}</p>
//                                                         <p className="text-zinc-400 text-xs mt-0.5">Qty: {item.quantity || 1}</p>
//                                                     </div>
//                                                     <p className="font-bold text-zinc-800 text-sm shrink-0">
//                                                         ₹{(item.price * (item.quantity || 1)).toLocaleString("en-IN")}
//                                                     </p>
//                                                 </div>

//                                                 {(item.customization?.text || item.customization?.imageUrl || item.customization?.note) && (
//                                                     <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
//                                                         <p className="text-[10px] font-black text-amber-700 flex items-center gap-1">
//                                                             <FaPencilAlt size={8} /> Customization
//                                                         </p>
//                                                         {item.customization?.text && (
//                                                             <p className="text-xs text-zinc-700 break-words">✏️ <span className="font-semibold">{item.customization.text}</span></p>
//                                                         )}
//                                                         {item.customization?.imageUrl && (
//                                                             <div className="flex items-center gap-2">
//                                                                 <img src={item.customization.imageUrl} alt="custom"
//                                                                     className="w-10 h-10 rounded-lg object-cover border border-amber-200 shrink-0" />
//                                                                 <p className="text-xs text-zinc-500">Custom image uploaded ✓</p>
//                                                             </div>
//                                                         )}
//                                                         {item.customization?.note && (
//                                                             <p className="text-xs text-zinc-600 break-words">📝 {item.customization.note}</p>
//                                                         )}
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>

//                                 <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
//                                     <FaWhatsapp size={20} className="text-emerald-500 shrink-0 mt-0.5" />
//                                     <div>
//                                         <p className="text-emerald-800 font-semibold text-sm">Order via WhatsApp</p>
//                                         <p className="text-emerald-600 text-xs mt-0.5">Your order details will be sent to our team on WhatsApp. We'll confirm and process your order shortly.</p>
//                                     </div>
//                                 </div>

//                                 {error && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

//                                 <button onClick={handleFinalOrder} disabled={loading}
//                                     className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-60 text-white py-4 rounded-2xl font-black text-base transition-all duration-200 shadow-lg shadow-emerald-200 flex items-center justify-center gap-3">
//                                     {loading ? (
//                                         <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Placing Order...</>
//                                     ) : (
//                                         <><FaWhatsapp size={20} /> Confirm Order on WhatsApp</>
//                                     )}
//                                 </button>
//                             </div>
//                         )}
//                     </div>

//                     {/* RIGHT: Price Summary */}
//                     <div className="w-full lg:w-96 shrink-0">
//                         <div className="sticky top-20 space-y-4">
//                             <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
//                                 <div className="px-5 py-4 border-b border-stone-100">
//                                     <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Price Details</h3>
//                                 </div>
//                                 <div className="px-5 py-4 space-y-3">
//                                     <div className="flex justify-between text-sm">
//                                         <span className="text-zinc-600">Price ({checkoutItems.length} item{checkoutItems.length > 1 ? "s" : ""})</span>
//                                         <span className="font-semibold text-zinc-800">₹{itemsTotal.toLocaleString("en-IN")}</span>
//                                     </div>
//                                     <div className="flex justify-between text-sm">
//                                         <span className="text-zinc-600 flex items-center gap-1.5"><FaTruck size={11} className="text-zinc-400" /> Delivery</span>
//                                         {deliveryCharge === 0
//                                             ? <span className="font-semibold text-emerald-600">FREE</span>
//                                             : <span className="font-semibold text-zinc-800">₹{deliveryCharge}</span>
//                                         }
//                                     </div>
//                                     <div className="flex justify-between text-sm">
//                                         <span className="text-zinc-600 flex items-center gap-1.5"><FaShieldAlt size={11} className="text-zinc-400" /> Platform Fee</span>
//                                         <span className="font-semibold text-zinc-800">₹{PLATFORM_FEE}</span>
//                                     </div>
//                                     <div className="border-t border-dashed border-stone-200 pt-3 flex justify-between">
//                                         <span className="font-bold text-zinc-800">Total Amount</span>
//                                         <span className="font-black text-zinc-900 text-lg">₹{finalTotal.toLocaleString("en-IN")}</span>
//                                     </div>
//                                     {deliveryCharge === 0 && (
//                                         <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
//                                             <FaCheckCircle className="text-emerald-500" size={12} />
//                                             <p className="text-emerald-700 text-xs font-medium">FREE delivery on this order!</p>
//                                         </div>
//                                     )}
//                                     {deliveryCharge > 0 && (
//                                         <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
//                                             <p className="text-amber-700 text-xs font-medium">Add ₹{(FREE_DELIVERY_ABOVE - itemsTotal).toLocaleString("en-IN")} more for FREE delivery</p>
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                             <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-5 py-4 space-y-3">
//                                 <div className="flex items-center gap-3 text-xs text-zinc-500"><FaShieldAlt className="text-amber-500 shrink-0" size={14} /><span>Safe & Secure Ordering</span></div>
//                                 <div className="flex items-center gap-3 text-xs text-zinc-500"><FaTruck className="text-amber-500 shrink-0" size={14} /><span>Fast Delivery across India</span></div>
//                                 <div className="flex items-center gap-3 text-xs text-zinc-500"><FaWhatsapp className="text-emerald-500 shrink-0" size={14} /><span>WhatsApp order confirmation</span></div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Checkout;

import Order from "../models/Order.js";
import nodemailer from "nodemailer";
import {
    generateWhatsAppLink,
    generateUserWhatsAppLink,
} from "../utils/whatsapp.js";
import { getOrderStatusEmailTemplate } from "../utils/orderStatusEmail.js";
import { adminOrderEmailHTML } from "../utils/adminOrderEmail.js";

/* =========================
   📧 EMAIL CONFIG
========================= */
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4, // ✅ Render free tier IPv4 fix
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ✅ Verify on startup
transporter.verify((err, success) => {
    if (err) console.error("❌ Email transporter error:", err.message);
    else console.log("✅ Email transporter ready");
});

/* =========================
   🛒 CREATE ORDER
========================= */
export const createOrder = async (req, res) => {
    try {
        const {
            items, customerName, phone, address,
            email, totalAmount, latitude, longitude,
        } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0)
            return res.status(400).json({ message: "Cart is empty" });

        if (!customerName?.trim() || !phone?.trim() || !address?.trim())
            return res.status(400).json({ message: "Customer details missing" });

        if (!totalAmount || Number(totalAmount) <= 0)
            return res.status(400).json({ message: "Invalid total amount" });

        const formattedItems = items.map((item) => {
            let finalImage = "";
            if (typeof item.image === "string" && item.image) {
                finalImage = item.image;
            } else if (Array.isArray(item.images) && item.images.length > 0) {
                finalImage = item.images[0]?.url || item.images[0] || "";
            }

            const customization = {
                text: item.customization?.text?.trim() || "",
                imageUrl: item.customization?.imageUrl?.trim() || "",
                note: item.customization?.note?.trim() || "",
            };

            return {
                productId: item.productId || item._id,
                name: item.name || "Product",
                price: Number(item.price || 0),
                qty: Number(item.qty || item.quantity || 1),
                image: finalImage,
                customization,
            };
        });

        const order = new Order({
            user: req.user._id,
            items: formattedItems,
            customerName: customerName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            email: email?.trim() || "",
            latitude,
            longitude,
            totalAmount: Number(totalAmount),
            orderStatus: "PLACED",
            statusTimeline: { placedAt: new Date() },
        });

        const savedOrder = await order.save();

        res.status(201).json({
            success: true,
            orderId: savedOrder._id,
            orderStatus: savedOrder.orderStatus,
            adminWhatsApp: generateWhatsAppLink(savedOrder),
            userWhatsApp: generateUserWhatsAppLink(savedOrder, "PLACED"),
        });

        /* ── Emails (non-blocking) ── */
        try {
            const userEmail = email?.trim();
            console.log("📧 EMAIL_USER:", process.env.EMAIL_USER);
            console.log("📧 ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
            console.log("📧 User email:", userEmail || "NOT PROVIDED");

            const userMail = getOrderStatusEmailTemplate({
                customerName: customerName.trim(),
                orderId: savedOrder._id,
                status: "PLACED",
            });
            const adminMailHTML = adminOrderEmailHTML({ order: savedOrder });

            // User email — sirf tab bhejo jab real email ho
            if (userEmail) {
                transporter.sendMail({
                    from: `"RV Gift Shop" <${process.env.EMAIL_USER}>`,
                    to: userEmail,
                    subject: userMail.subject,
                    html: userMail.html,
                })
                    .then(() => console.log("✅ User email sent to:", userEmail))
                    .catch(err => console.error("❌ User email failed:", err.message));
            }

            // Admin email — hamesha bhejo
            transporter.sendMail({
                from: `"Order Bot" <${process.env.EMAIL_USER}>`,
                to: process.env.ADMIN_EMAIL,
                subject: `🛒 New Order #${savedOrder._id.toString().slice(-6).toUpperCase()} — ₹${totalAmount}`,
                html: adminMailHTML,
            })
                .then(() => console.log("✅ Admin email sent"))
                .catch(err => console.error("❌ Admin email failed:", err.message));

        } catch (mailError) {
            console.error("❌ Email process error:", mailError.message);
        }

    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);
        res.status(500).json({ message: "Order placement failed. Please try again." });
    }
};

/* =========================
   ❌ CANCEL ORDER (USER)
========================= */
export const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order)
            return res.status(404).json({ message: "Order not found" });

        if (order.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "Not authorized" });

        const cancellableStatuses = ["PLACED", "CONFIRMED"];
        if (!cancellableStatuses.includes(order.orderStatus)) {
            const msg = order.orderStatus === "CANCELLED"
                ? "Order is already cancelled"
                : `Cannot cancel — order is already ${order.orderStatus.toLowerCase()}`;
            return res.status(400).json({ message: msg });
        }

        order.orderStatus = "CANCELLED";
        order.statusTimeline = order.statusTimeline || {};
        order.statusTimeline.cancelledAt = new Date();
        order.cancellationReason = req.body.reason?.trim() || "Cancelled by customer";
        await order.save();

        try {
            const userMail = getOrderStatusEmailTemplate({
                customerName: order.customerName,
                orderId: order._id,
                status: "CANCELLED",
            });
            if (order.email) {
                transporter.sendMail({
                    from: `"RV Gift Shop" <${process.env.EMAIL_USER}>`,
                    to: order.email,
                    subject: userMail.subject,
                    html: userMail.html,
                })
                    .then(() => console.log("✅ Cancel email sent to user"))
                    .catch(err => console.error("❌ Cancel user email failed:", err.message));
            }
            transporter.sendMail({
                from: `"Order Bot" <${process.env.EMAIL_USER}>`,
                to: process.env.ADMIN_EMAIL,
                subject: `❌ Order Cancelled #${order._id.toString().slice(-6).toUpperCase()}`,
                html: adminOrderEmailHTML({ order }),
            })
                .then(() => console.log("✅ Cancel admin email sent"))
                .catch(err => console.error("❌ Cancel admin email failed:", err.message));
        } catch { }

        res.json({ success: true, message: "Order cancelled successfully", order });

    } catch (error) {
        console.error("CANCEL ORDER ERROR:", error);
        res.status(500).json({ message: "Failed to cancel order" });
    }
};

/* =========================
   📦 GET MY ORDERS
========================= */
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .lean();
        res.json(orders);
    } catch (error) {
        console.error("GET MY ORDERS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

/* =========================
   🔍 GET ORDER BY ID
========================= */
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).lean();

        if (!order)
            return res.status(404).json({ message: "Order not found" });

        const isOwner = order.user?.toString() === req.user._id.toString();
        const isAdmin = ["admin", "owner"].includes(req.user.role);

        if (!isOwner && !isAdmin)
            return res.status(403).json({ message: "Access denied" });

        res.json(order);
    } catch (error) {
        console.error("GET ORDER BY ID ERROR:", error);
        res.status(500).json({ message: "Error fetching order" });
    }
};

/* =========================
   🔄 UPDATE ORDER STATUS (ADMIN)
========================= */
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = [
            "PLACED", "CONFIRMED", "PACKED",
            "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"
        ];

        if (!validStatuses.includes(status))
            return res.status(400).json({ message: "Invalid status value" });

        const update = { orderStatus: status };

        if (status === "CONFIRMED") update["statusTimeline.confirmedAt"] = new Date();
        if (status === "PACKED") update["statusTimeline.packedAt"] = new Date();
        if (status === "SHIPPED") update["statusTimeline.shippedAt"] = new Date();
        if (status === "DELIVERED") update["statusTimeline.deliveredAt"] = new Date();
        if (status === "CANCELLED") update["statusTimeline.cancelledAt"] = new Date();

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true }
        );

        if (!order)
            return res.status(404).json({ message: "Order not found" });

        try {
            const userMail = getOrderStatusEmailTemplate({
                customerName: order.customerName,
                orderId: order._id,
                status,
            });
            const adminMailHTML = adminOrderEmailHTML({ order });

            if (order.email) {
                transporter.sendMail({
                    from: `"RV Gift Shop" <${process.env.EMAIL_USER}>`,
                    to: order.email,
                    subject: userMail.subject,
                    html: userMail.html,
                })
                    .then(() => console.log("✅ Status email sent to user"))
                    .catch(err => console.error("❌ User status email failed:", err.message));
            }

            transporter.sendMail({
                from: `"Order Bot" <${process.env.EMAIL_USER}>`,
                to: process.env.ADMIN_EMAIL,
                subject: `📦 Order ${status} | #${order._id.toString().slice(-6).toUpperCase()}`,
                html: adminMailHTML,
            })
                .then(() => console.log("✅ Status admin email sent"))
                .catch(err => console.error("❌ Admin status email failed:", err.message));

        } catch (mailErr) {
            console.error("❌ Status mail error:", mailErr.message);
        }

        res.json(order);

    } catch (error) {
        console.error("UPDATE ORDER STATUS ERROR:", error);
        res.status(500).json({ message: "Failed to update order status" });
    }
};

/* =========================
   🧾 GET ALL ORDERS (ADMIN)
========================= */
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .lean();
        res.json(orders);
    } catch (error) {
        console.error("GET ALL ORDERS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch all orders" });
    }
};
