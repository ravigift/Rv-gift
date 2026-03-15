import User from "../models/User.js";

/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */
const SHOP_LAT = 26.41922;
const SHOP_LNG = 82.53598;
const COD_RADIUS_KM = 15;

/* ══════════════════════════════════════════════
   LOCAL PINCODE FALLBACK
   Nominatim kabhi kabhi rural pincodes ke liye
   lat/lng nahi deta — ye map backup hai
   Akbarpur + nearby areas (within 15km of shop)
══════════════════════════════════════════════ */
const LOCAL_PINCODE_COORDS = {
    "224122": { lat: 26.4192, lng: 82.5359 }, // Akbarpur (shop location)
    "224123": { lat: 26.4300, lng: 82.5500 }, // Akbarpur area
    "224001": { lat: 26.4500, lng: 82.5200 }, // nearby
    "224181": { lat: 26.3900, lng: 82.5600 }, // Tanda
    "224151": { lat: 26.4700, lng: 82.4500 }, // nearby
    "224152": { lat: 26.4000, lng: 82.4700 }, // nearby
    "224161": { lat: 26.3500, lng: 82.5900 }, // nearby
    "224171": { lat: 26.5000, lng: 82.5700 }, // nearby
    "224172": { lat: 26.3700, lng: 82.5100 }, // nearby
};

/* ══════════════════════════════════════════════
   PINCODE CACHE  (in-memory, resets on restart)
══════════════════════════════════════════════ */
const pincodeCache = new Map(); // pin → { data, ts }
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/* ──────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────── */
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* Fetch lat/lng from Nominatim — best-effort, never throws */
const fetchLatLng = async (pincode) => {
    // ✅ Local fallback first — faster + reliable for known pincodes
    if (LOCAL_PINCODE_COORDS[pincode]) {
        return LOCAL_PINCODE_COORDS[pincode];
    }
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`,
            { headers: { "User-Agent": "RVGiftShop/2.0" }, signal: AbortSignal.timeout(4000) }
        );
        const data = await res.json();
        if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch { /* silent — lat/lng is optional */ }
    return { lat: null, lng: null };
};

/* ══════════════════════════════════════════════
   GET /api/addresses
══════════════════════════════════════════════ */
export const getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("addresses").lean();
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user.addresses || []);
    } catch (err) {
        console.error("GET ADDRESSES ERROR:", err);
        res.status(500).json({ message: "Failed to fetch addresses" });
    }
};

/* ══════════════════════════════════════════════
   POST /api/addresses  —  Add address (max 5)
══════════════════════════════════════════════ */
export const addAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.addresses.length >= 5)
            return res.status(400).json({ message: "Maximum 5 addresses allowed. Delete one to add new." });

        const { label, name, phone, house, area, landmark, city, state, pincode, isDefault, lat, lng } = req.body;

        /* ── Validation ── */
        if (!name?.trim() || !phone?.trim() || !house?.trim() || !area?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim())
            return res.status(400).json({ message: "All required fields must be filled" });
        if (!/^[6-9]\d{9}$/.test(phone.trim()))
            return res.status(400).json({ message: "Invalid phone number" });
        if (!/^\d{6}$/.test(pincode.trim()))
            return res.status(400).json({ message: "Invalid pincode" });

        /* ── Default handling ── */
        if (isDefault) user.addresses.forEach(a => { a.isDefault = false; });
        const makeDefault = isDefault || user.addresses.length === 0;

        user.addresses.push({
            label: (label?.trim() || "Home").slice(0, 30),
            name: name.trim().slice(0, 100),
            phone: phone.trim(),
            house: house.trim().slice(0, 200),
            area: area.trim().slice(0, 200),
            landmark: (landmark?.trim() || "").slice(0, 100),
            city: city.trim().slice(0, 100),
            state: state.trim().slice(0, 100),
            pincode: pincode.trim(),
            isDefault: makeDefault,
            lat: lat || null,
            lng: lng || null,
        });

        await user.save({ validateModifiedOnly: true });
        res.status(201).json({ success: true, message: "Address saved successfully", addresses: user.addresses });
    } catch (err) {
        console.error("ADD ADDRESS ERROR:", err);
        if (err.name === "ValidationError")
            return res.status(400).json({ message: Object.values(err.errors)[0].message });
        res.status(500).json({ message: "Failed to save address" });
    }
};

/* ══════════════════════════════════════════════
   PUT /api/addresses/:addressId  —  Edit address
══════════════════════════════════════════════ */
export const updateAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const address = user.addresses.id(req.params.addressId);
        if (!address) return res.status(404).json({ message: "Address not found" });

        const { label, name, phone, house, area, landmark, city, state, pincode, isDefault, lat, lng } = req.body;

        if (phone && !/^[6-9]\d{9}$/.test(phone.trim()))
            return res.status(400).json({ message: "Invalid phone number" });
        if (pincode && !/^\d{6}$/.test(pincode.trim()))
            return res.status(400).json({ message: "Invalid pincode" });

        if (label !== undefined) address.label = label.trim().slice(0, 30);
        if (name !== undefined) address.name = name.trim().slice(0, 100);
        if (phone !== undefined) address.phone = phone.trim();
        if (house !== undefined) address.house = house.trim().slice(0, 200);
        if (area !== undefined) address.area = area.trim().slice(0, 200);
        if (landmark !== undefined) address.landmark = landmark.trim().slice(0, 100);
        if (city !== undefined) address.city = city.trim().slice(0, 100);
        if (state !== undefined) address.state = state.trim().slice(0, 100);
        if (pincode !== undefined) address.pincode = pincode.trim();
        if (lat !== undefined) address.lat = lat || null;
        if (lng !== undefined) address.lng = lng || null;

        if (isDefault === true) {
            user.addresses.forEach(a => { a.isDefault = false; });
            address.isDefault = true;
        }

        await user.save({ validateModifiedOnly: true });
        res.json({ success: true, message: "Address updated", addresses: user.addresses });
    } catch (err) {
        console.error("UPDATE ADDRESS ERROR:", err);
        if (err.name === "ValidationError")
            return res.status(400).json({ message: Object.values(err.errors)[0].message });
        res.status(500).json({ message: "Failed to update address" });
    }
};

/* ══════════════════════════════════════════════
   DELETE /api/addresses/:addressId
══════════════════════════════════════════════ */
export const deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const address = user.addresses.id(req.params.addressId);
        if (!address) return res.status(404).json({ message: "Address not found" });

        const wasDefault = address.isDefault;
        address.deleteOne();

        if (wasDefault && user.addresses.length > 0)
            user.addresses[0].isDefault = true;

        await user.save({ validateModifiedOnly: true });
        res.json({ success: true, message: "Address deleted", addresses: user.addresses });
    } catch (err) {
        console.error("DELETE ADDRESS ERROR:", err);
        res.status(500).json({ message: "Failed to delete address" });
    }
};

/* ══════════════════════════════════════════════
   PUT /api/addresses/:addressId/default
══════════════════════════════════════════════ */
export const setDefaultAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const address = user.addresses.id(req.params.addressId);
        if (!address) return res.status(404).json({ message: "Address not found" });

        user.addresses.forEach(a => { a.isDefault = false; });
        address.isDefault = true;

        await user.save({ validateModifiedOnly: true });
        res.json({ success: true, message: "Default address updated", addresses: user.addresses });
    } catch (err) {
        console.error("SET DEFAULT ERROR:", err);
        res.status(500).json({ message: "Failed to set default address" });
    }
};

/* ══════════════════════════════════════════════
   GET /api/addresses/pincode/:pin
   ✅ Returns codAllowed — backend is source of truth
   Uses: postal API for city/state + Nominatim for lat/lng
   Cached 24 hours in-memory
══════════════════════════════════════════════ */
export const verifyPincode = async (req, res) => {
    try {
        const { pin } = req.params;

        if (!/^\d{6}$/.test(pin))
            return res.status(400).json({ message: "Invalid pincode format" });

        /* ── Cache hit ── */
        const cached = pincodeCache.get(pin);
        if (cached && Date.now() - cached.ts < CACHE_TTL)
            return res.json(cached.data);

        /* ── Postal API ── */
        const postalRes = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
            signal: AbortSignal.timeout(5000),
        });
        const postalData = await postalRes.json();

        if (postalData[0]?.Status !== "Success" || !postalData[0]?.PostOffice?.length)
            return res.status(404).json({ message: "Pincode not found", serviceable: false });

        const po = postalData[0].PostOffice[0];

        /* ── Lat/Lng via Nominatim ── */
        const { lat, lng } = await fetchLatLng(pin);

        /* ── COD check — backend source of truth ── */
        let codAllowed = false;
        let distanceKm = null;

        if (lat !== null && lng !== null) {
            distanceKm = getDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng);
            codAllowed = distanceKm <= COD_RADIUS_KM;
        }
        // If lat/lng unavailable → codAllowed stays false (safe default)

        const result = {
            city: po.District,
            state: po.State,
            country: po.Country,
            pincode: pin,
            serviceable: true,
            lat,
            lng,
            distanceKm: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
            codAllowed,  // ✅ frontend reads this — backend is source of truth
        };

        pincodeCache.set(pin, { data: result, ts: Date.now() });
        res.json(result);
    } catch (err) {
        console.error("PINCODE VERIFY ERROR:", err.message);
        res.status(503).json({ message: "Pincode service temporarily unavailable", serviceable: null });
    }
};

/* ══════════════════════════════════════════════
   EXPORTED HELPER — used by orderController
   to validate COD without hitting HTTP layer
══════════════════════════════════════════════ */
export const checkCODEligibility = async (pincode) => {
    if (!/^\d{6}$/.test(pincode)) return { allowed: false, reason: "Invalid pincode" };

    /* ── Cache hit ── */
    const cached = pincodeCache.get(pincode);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return {
            allowed: cached.data.codAllowed,
            distanceKm: cached.data.distanceKm,
            reason: cached.data.codAllowed ? null : `Address is ~${cached.data.distanceKm} km from shop (limit: ${COD_RADIUS_KM} km)`,
        };
    }

    /* ── Fetch fresh ── */
    const { lat, lng } = await fetchLatLng(pincode);
    if (lat === null || lng === null) return { allowed: false, reason: "Could not verify delivery location" };

    const distanceKm = Math.round(getDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng) * 10) / 10;
    const allowed = distanceKm <= COD_RADIUS_KM;

    /* Update cache if entry exists, otherwise let verifyPincode handle full cache population */
    if (pincodeCache.has(pincode)) {
        const entry = pincodeCache.get(pincode);
        entry.data.lat = lat;
        entry.data.lng = lng;
        entry.data.distanceKm = distanceKm;
        entry.data.codAllowed = allowed;
    }

    return {
        allowed,
        distanceKm,
        reason: allowed ? null : `Address is ~${distanceKm} km from shop (COD limit: ${COD_RADIUS_KM} km)`,
    };
};