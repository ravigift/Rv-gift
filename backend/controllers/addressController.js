import User from "../models/User.js";

/* ── Rate limit helper (in-memory, resets on restart) ── */
const pincodeCache = new Map(); // pincode → { city, state, ts }
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/* ==============================================
   GET /api/addresses
   Get all saved addresses for logged-in user
============================================== */
export const getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("addresses");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user.addresses || []);
    } catch (err) {
        console.error("GET ADDRESSES ERROR:", err);
        res.status(500).json({ message: "Failed to fetch addresses" });
    }
};

/* ==============================================
   POST /api/addresses
   Add new address (max 5 per user)
============================================== */
export const addAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.addresses.length >= 5)
            return res.status(400).json({ message: "Maximum 5 addresses allowed. Delete one to add new." });

        const { label, name, phone, house, area, landmark, city, state, pincode, isDefault } = req.body;

        // Validate required
        if (!name?.trim() || !phone?.trim() || !house?.trim() || !area?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim())
            return res.status(400).json({ message: "All required fields must be filled" });

        if (!/^[6-9]\d{9}$/.test(phone.trim()))
            return res.status(400).json({ message: "Invalid phone number" });

        if (!/^\d{6}$/.test(pincode.trim()))
            return res.status(400).json({ message: "Invalid pincode" });

        // If new address is default → unset others
        if (isDefault) {
            user.addresses.forEach(a => { a.isDefault = false; });
        }

        // If first address → make default automatically
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
        });

        await user.save({ validateModifiedOnly: true }); // ✅ Fix: sirf modified fields validate karega
        res.status(201).json({
            success: true,
            message: "Address saved successfully",
            addresses: user.addresses,
        });
    } catch (err) {
        console.error("ADD ADDRESS ERROR:", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: Object.values(err.errors)[0].message });
        }
        res.status(500).json({ message: "Failed to save address" });
    }
};

/* ==============================================
   PUT /api/addresses/:addressId
   Edit existing address
============================================== */
export const updateAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const address = user.addresses.id(req.params.addressId);
        if (!address) return res.status(404).json({ message: "Address not found" });

        const { label, name, phone, house, area, landmark, city, state, pincode, isDefault } = req.body;

        if (phone && !/^[6-9]\d{9}$/.test(phone.trim()))
            return res.status(400).json({ message: "Invalid phone number" });

        if (pincode && !/^\d{6}$/.test(pincode.trim()))
            return res.status(400).json({ message: "Invalid pincode" });

        // Update fields
        if (label !== undefined) address.label = label.trim().slice(0, 30);
        if (name !== undefined) address.name = name.trim().slice(0, 100);
        if (phone !== undefined) address.phone = phone.trim();
        if (house !== undefined) address.house = house.trim().slice(0, 200);
        if (area !== undefined) address.area = area.trim().slice(0, 200);
        if (landmark !== undefined) address.landmark = landmark.trim().slice(0, 100);
        if (city !== undefined) address.city = city.trim().slice(0, 100);
        if (state !== undefined) address.state = state.trim().slice(0, 100);
        if (pincode !== undefined) address.pincode = pincode.trim();

        // Handle default change
        if (isDefault === true) {
            user.addresses.forEach(a => { a.isDefault = false; });
            address.isDefault = true;
        }

        await user.save({ validateModifiedOnly: true }); // ✅ Fix
        res.json({ success: true, message: "Address updated", addresses: user.addresses });
    } catch (err) {
        console.error("UPDATE ADDRESS ERROR:", err);
        if (err.name === "ValidationError")
            return res.status(400).json({ message: Object.values(err.errors)[0].message });
        res.status(500).json({ message: "Failed to update address" });
    }
};

/* ==============================================
   DELETE /api/addresses/:addressId
   Delete an address
============================================== */
export const deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const address = user.addresses.id(req.params.addressId);
        if (!address) return res.status(404).json({ message: "Address not found" });

        const wasDefault = address.isDefault;
        address.deleteOne();

        // If deleted address was default → make first remaining address default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save({ validateModifiedOnly: true }); // ✅ Fix
        res.json({ success: true, message: "Address deleted", addresses: user.addresses });
    } catch (err) {
        console.error("DELETE ADDRESS ERROR:", err);
        res.status(500).json({ message: "Failed to delete address" });
    }
};

/* ==============================================
   PUT /api/addresses/:addressId/default
   Set address as default
============================================== */
export const setDefaultAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const address = user.addresses.id(req.params.addressId);
        if (!address) return res.status(404).json({ message: "Address not found" });

        user.addresses.forEach(a => { a.isDefault = false; });
        address.isDefault = true;

        await user.save({ validateModifiedOnly: true }); // ✅ Fix
        res.json({ success: true, message: "Default address updated", addresses: user.addresses });
    } catch (err) {
        console.error("SET DEFAULT ERROR:", err);
        res.status(500).json({ message: "Failed to set default address" });
    }
};

/* ==============================================
   GET /api/addresses/pincode/:pin
   Verify pincode + get city/state (cached)
   FREE — uses api.postalpincode.in
============================================== */
export const verifyPincode = async (req, res) => {
    try {
        const { pin } = req.params;

        if (!/^\d{6}$/.test(pin))
            return res.status(400).json({ message: "Invalid pincode format" });

        // Check cache first
        const cached = pincodeCache.get(pin);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
            return res.json(cached.data);
        }

        // Fetch from free API
        const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
            signal: AbortSignal.timeout(5000),
        });
        const data = await response.json();

        if (data[0]?.Status !== "Success" || !data[0]?.PostOffice?.length) {
            return res.status(404).json({ message: "Pincode not found", serviceable: false });
        }

        const po = data[0].PostOffice[0];
        const result = {
            city: po.District,
            state: po.State,
            country: po.Country,
            pincode: pin,
            serviceable: true,
        };

        // Cache it
        pincodeCache.set(pin, { data: result, ts: Date.now() });

        res.json(result);
    } catch (err) {
        console.error("PINCODE VERIFY ERROR:", err.message);
        res.status(503).json({ message: "Pincode service temporarily unavailable", serviceable: null });
    }
};