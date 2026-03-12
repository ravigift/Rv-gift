/**
 * shiprocketService.js
 * ─────────────────────────────────────────────────────
 * MOCK MODE  → SHIPROCKET_MOCK=true  (default for testing)
 * REAL MODE  → SHIPROCKET_MOCK=false (set when account ready)
 *
 * Real mode needs: SHIPROCKET_EMAIL + SHIPROCKET_PASSWORD in .env
 * ─────────────────────────────────────────────────────
 */

const MOCK_MODE = process.env.SHIPROCKET_MOCK !== "false"; // true by default
const SR_BASE = "https://apiv2.shiprocket.in/v1/external";
const CHANNEL_ID = process.env.SHIPROCKET_CHANNEL_ID || null;

// ── Token cache (real mode) ──
let _token = null;
let _tokenExp = 0;

/* ════════════════════════════════════════
   REAL — Get auth token (cached 23hrs)
════════════════════════════════════════ */
const getToken = async () => {
    if (_token && Date.now() < _tokenExp) return _token;

    const res = await fetch(`${SR_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: process.env.SHIPROCKET_EMAIL,
            password: process.env.SHIPROCKET_PASSWORD,
        }),
        signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (!data.token) throw new Error("Shiprocket auth failed: " + JSON.stringify(data));

    _token = data.token;
    _tokenExp = Date.now() + 23 * 60 * 60 * 1000;
    console.log("[Shiprocket] Token refreshed");
    return _token;
};

const srHeaders = async () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${await getToken()}`,
});

/* ════════════════════════════════════════
   MOCK HELPERS
════════════════════════════════════════ */
const mockAwb = () => `SR${Date.now().toString().slice(-10)}`;
const mockShipId = () => Math.floor(Math.random() * 9000000) + 1000000;
const mockCouriers = ["Delhivery", "BlueDart", "DTDC", "Ekart", "XpressBees"];
const mockCourier = () => mockCouriers[Math.floor(Math.random() * mockCouriers.length)];

/* ════════════════════════════════════════
   1. CALCULATE SHIPPING RATE
   Used in Checkout — live rate per pincode
════════════════════════════════════════ */
export const calculateShippingRate = async ({ deliveryPincode, weight, cod = false }) => {
    const pickupPincode = "224122"; // RV Gift shop
    const wtKg = Math.max(0.1, weight / 1000);

    if (MOCK_MODE) {
        const base = wtKg <= 0.5 ? 49 : wtKg <= 1 ? 79 : wtKg <= 2 ? 99 : 149;
        const codExtra = cod ? 30 : 0;
        return {
            success: true,
            mock: true,
            rate: base + codExtra,
            courier: "Standard Courier",
            etd: "3-5 business days",
            weight_kg: wtKg,
        };
    }

    try {
        const token = await getToken();
        const url = `${SR_BASE}/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${wtKg}&cod=${cod ? 1 : 0}`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();

        const couriers = data?.data?.available_courier_companies || [];
        if (!couriers.length) return { success: false, rate: 49, courier: "Standard", etd: "5-7 days" };

        const best = couriers.sort((a, b) => a.freight_charge - b.freight_charge)[0];
        return {
            success: true,
            mock: false,
            rate: Math.round(best.freight_charge),
            courier: best.courier_name,
            etd: best.estimated_delivery_days ? `${best.estimated_delivery_days} days` : "3-5 days",
            weight_kg: wtKg,
        };
    } catch (err) {
        console.error("[Shiprocket] Rate error:", err.message);
        return { success: false, rate: 49, courier: "Standard", etd: "5-7 days" };
    }
};

/* ════════════════════════════════════════
   2. CREATE SHIPROCKET ORDER
   Called after order is saved in DB
════════════════════════════════════════ */
export const createShiprocketOrder = async ({ order, totalWeight }) => {
    if (MOCK_MODE) {
        const awb = mockAwb();
        const shipmentId = mockShipId();
        const courier = mockCourier();
        console.log(`[Shiprocket MOCK] Created — AWB: ${awb}, Courier: ${courier}`);
        return {
            success: true,
            mock: true,
            awb_code: awb,
            shipment_id: shipmentId,
            courier_name: courier,
            tracking_url: `https://shiprocket.co/tracking/${awb}`,
            label_url: null,
        };
    }

    try {
        const headers = await srHeaders();
        const isCOD = order.payment?.method === "COD";
        const weightKg = Math.max(0.1, (totalWeight || 500) / 1000);

        const orderItems = order.items.map(item => ({
            name: item.name.slice(0, 100),
            sku: item.productId?.toString() || "PROD",
            units: item.qty,
            selling_price: item.price,
            discount: 0,
            tax: 0,
            hsn: 91059990,
        }));

        // Parse address fields from the stored address string
        const pinMatch = order.address.match(/\d{6}/);
        const pincode = pinMatch ? pinMatch[0] : "000000";

        const body = {
            order_id: `RVG-${order._id.toString().slice(-8).toUpperCase()}`,
            order_date: new Date(order.createdAt).toISOString().slice(0, 10),
            pickup_location: "Primary",
            channel_id: CHANNEL_ID,
            comment: order.items.some(i => i.customization?.text || i.customization?.imageUrl)
                ? "CUSTOMIZED ORDER — check customization details"
                : "",
            billing_customer_name: order.customerName,
            billing_last_name: "",
            billing_address: order.address.slice(0, 200),
            billing_city: order.address.split(",").slice(-3, -2)[0]?.trim() || "Unknown",
            billing_pincode: pincode,
            billing_state: "Uttar Pradesh",
            billing_country: "India",
            billing_email: order.email || "customer@rvgifts.com",
            billing_phone: order.phone,
            shipping_is_billing: true,
            order_items: orderItems,
            payment_method: isCOD ? "COD" : "Prepaid",
            sub_total: order.totalAmount,
            length: 15,
            breadth: 12,
            height: 10,
            weight: weightKg,
        };

        const res = await fetch(`${SR_BASE}/orders/create/adhoc`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
        });
        const data = await res.json();

        if (!data.shipment_id) {
            console.error("[Shiprocket] Create failed:", JSON.stringify(data));
            return { success: false, error: data.message || "Unknown error" };
        }

        return {
            success: true,
            mock: false,
            awb_code: data.awb_code || "",
            shipment_id: data.shipment_id,
            courier_name: data.courier_name || "",
            tracking_url: data.awb_code ? `https://shiprocket.co/tracking/${data.awb_code}` : "",
            label_url: data.label || null,
        };
    } catch (err) {
        console.error("[Shiprocket] createOrder error:", err.message);
        return { success: false, error: err.message };
    }
};

/* ════════════════════════════════════════
   3. TRACK SHIPMENT
════════════════════════════════════════ */
export const trackShipment = async ({ awbCode }) => {
    if (MOCK_MODE) {
        const mockStatuses = [
            { status: "PICKUP_SCHEDULED", label: "Pickup Scheduled", detail: "Courier pickup scheduled" },
            { status: "PICKED_UP", label: "Picked Up", detail: "Package picked up from seller" },
            { status: "IN_TRANSIT", label: "In Transit", detail: "Package is on the way" },
        ];
        const pick = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
        return {
            success: true,
            mock: true,
            awb: awbCode,
            status: pick.status,
            label: pick.label,
            detail: pick.detail,
            courier: mockCourier(),
            tracking_url: `https://shiprocket.co/tracking/${awbCode}`,
            activities: [{ date: new Date().toISOString(), activity: pick.detail, location: "Akbarpur Hub" }],
        };
    }

    try {
        const token = await getToken();
        const res = await fetch(`${SR_BASE}/courier/track/awb/${awbCode}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();
        const track = data?.tracking_data;

        return {
            success: true,
            mock: false,
            awb: awbCode,
            status: track?.shipment_status || "UNKNOWN",
            label: track?.shipment_status_label || "In Process",
            detail: track?.current_status || "",
            courier: track?.courier_name || "",
            tracking_url: `https://shiprocket.co/tracking/${awbCode}`,
            activities: track?.activities || [],
        };
    } catch (err) {
        console.error("[Shiprocket] Track error:", err.message);
        return { success: false, error: err.message };
    }
};

/* ════════════════════════════════════════
   4. GENERATE LABEL
════════════════════════════════════════ */
export const generateLabel = async ({ shipmentId }) => {
    if (MOCK_MODE) {
        return { success: true, mock: true, label_url: "https://shiprocket.co/label/mock.pdf" };
    }
    try {
        const headers = await srHeaders();
        const res = await fetch(`${SR_BASE}/courier/generate/label`, {
            method: "POST",
            headers,
            body: JSON.stringify({ shipment_id: [shipmentId] }),
            signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        return { success: true, label_url: data.label_url || "" };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

export const isMockMode = () => MOCK_MODE;