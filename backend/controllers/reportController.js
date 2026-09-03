/**
 * reportController.js — business analytics for the admin dashboard.
 * 100% derived from live customer activity (orders, users, POS bills)
 * via MongoDB aggregation — nothing is loaded into memory unbounded.
 */
import Order from "../models/Order.js";
import User from "../models/User.js";
import WalkInOrder from "../models/WalkInOrder.js";

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };
const TZ = "Asia/Kolkata";
const PAID = { "payment.status": "PAID" };

const resolveRange = (key) => {
    const now = new Date();
    if (key === "all" || !RANGE_DAYS[key]) {
        return { key: "all", start: new Date(0), end: now, prevStart: null, prevEnd: null, bucket: "month" };
    }
    const days = RANGE_DAYS[key];
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    const prevEnd = new Date(start);
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - days);
    return { key, start, end: now, prevStart, prevEnd, bucket: days > 120 ? "month" : "day" };
};

const pctDelta = (cur, prev) => {
    if (!prev) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
};

/* ─────────────────────────────────────────────
   GET /api/reports/overview?range=7d|30d|90d|12m|all
───────────────────────────────────────────── */
export const getOverview = async (req, res) => {
    try {
        const r = resolveRange(req.query.range || "30d");
        const inRange = { createdAt: { $gte: r.start, $lte: r.end } };
        const inPrev = r.prevStart ? { createdAt: { $gte: r.prevStart, $lt: r.prevEnd } } : null;
        const fmt = r.bucket === "month" ? "%Y-%m" : "%Y-%m-%d";

        const [
            facet,
            prevAgg,
            series,
            topProducts,
            byCategory,
            topCustomers,
            newUsers,
            posAgg,
        ] = await Promise.all([
            Order.aggregate([
                { $match: inRange },
                {
                    $facet: {
                        placed: [{ $count: "n" }],
                        paid: [{ $match: PAID }, { $group: { _id: null, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } }],
                        units: [
                            { $match: PAID },
                            { $unwind: "$items" },
                            { $group: { _id: null, units: { $sum: "$items.qty" } } },
                        ],
                        byStatus: [{ $group: { _id: "$orderStatus", n: { $sum: 1 } } }],
                        byMethod: [
                            { $match: PAID },
                            { $group: { _id: "$payment.method", revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
                        ],
                        refunds: [
                            { $match: { "refund.status": "PROCESSED" } },
                            { $group: { _id: null, amount: { $sum: "$refund.amount" }, n: { $sum: 1 } } },
                        ],
                        buyers: [{ $group: { _id: "$user" } }, { $count: "n" }],
                        flagged: [{ $match: { "payment.flagged": true } }, { $count: "n" }],
                    },
                },
            ]),
            inPrev
                ? Order.aggregate([
                    { $match: { ...inPrev, ...PAID } },
                    { $group: { _id: null, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
                ])
                : Promise.resolve([]),
            Order.aggregate([
                { $match: { ...inRange, ...PAID } },
                {
                    $group: {
                        _id: { $dateToString: { format: fmt, date: "$createdAt", timezone: TZ } },
                        revenue: { $sum: "$totalAmount" },
                        orders: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            Order.aggregate([
                { $match: { ...inRange, ...PAID } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.productId",
                        name: { $first: "$items.name" },
                        units: { $sum: "$items.qty" },
                        revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
                    },
                },
                { $sort: { revenue: -1 } },
                { $limit: 8 },
            ]),
            Order.aggregate([
                { $match: { ...inRange, ...PAID } },
                { $unwind: "$items" },
                { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "p" } },
                { $set: { cat: { $ifNull: [{ $arrayElemAt: ["$p.category", 0] }, "uncategorised"] } } },
                {
                    $group: {
                        _id: "$cat",
                        units: { $sum: "$items.qty" },
                        revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
                    },
                },
                { $sort: { revenue: -1 } },
                { $limit: 12 },
            ]),
            Order.aggregate([
                { $match: { ...inRange, ...PAID } },
                {
                    $group: {
                        _id: "$user",
                        name: { $first: "$customerName" },
                        spend: { $sum: "$totalAmount" },
                        orders: { $sum: 1 },
                    },
                },
                { $sort: { spend: -1 } },
                { $limit: 8 },
            ]),
            User.countDocuments({ ...inRange, role: "user" }),
            WalkInOrder.aggregate([
                { $match: inRange },
                { $group: { _id: null, revenue: { $sum: "$grandTotal" }, bills: { $sum: 1 } } },
            ]),
        ]);

        const f = facet[0] || {};
        const paid = f.paid?.[0] || { revenue: 0, orders: 0 };
        const prev = prevAgg[0] || { revenue: 0, orders: 0 };
        const statusMap = Object.fromEntries((f.byStatus || []).map((s) => [s._id, s.n]));

        res.json({
            range: r.key,
            generatedAt: new Date(),
            kpis: {
                revenue: paid.revenue,
                revenueDelta: pctDelta(paid.revenue, prev.revenue),
                orders: paid.orders,
                ordersDelta: pctDelta(paid.orders, prev.orders),
                placedOrders: f.placed?.[0]?.n || 0,
                aov: paid.orders ? Math.round(paid.revenue / paid.orders) : 0,
                units: f.units?.[0]?.units || 0,
                buyers: f.buyers?.[0]?.n || 0,
                newCustomers: newUsers,
                refundAmount: f.refunds?.[0]?.amount || 0,
                refundCount: f.refunds?.[0]?.n || 0,
                flaggedOrders: f.flagged?.[0]?.n || 0,
                posRevenue: posAgg[0]?.revenue || 0,
                posBills: posAgg[0]?.bills || 0,
            },
            statusFunnel: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]
                .map((s) => ({ status: s, count: statusMap[s] || 0 })),
            paymentSplit: (f.byMethod || []).map((m) => ({ method: m._id || "UNKNOWN", revenue: m.revenue, orders: m.orders })),
            timeseries: series.map((s) => ({ date: s._id, revenue: s.revenue, orders: s.orders })),
            topProducts: topProducts.map((p) => ({ id: p._id, name: p.name, units: p.units, revenue: p.revenue })),
            byCategory: byCategory.map((c) => ({ category: c._id, units: c.units, revenue: c.revenue })),
            topCustomers: topCustomers.map((c) => ({ id: c._id, name: c.name, spend: c.spend, orders: c.orders })),
        });
    } catch (err) {
        console.error("REPORT OVERVIEW ERROR:", err);
        res.status(500).json({ message: "Failed to build report" });
    }
};

/* ─────────────────────────────────────────────
   GET /api/reports/export?range=…  → orders CSV
───────────────────────────────────────────── */
const csvCell = (v) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // formula-injection guard
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const exportOrders = async (req, res) => {
    try {
        const r = resolveRange(req.query.range || "30d");
        const orders = await Order.find({ createdAt: { $gte: r.start, $lte: r.end } })
            .select("invoiceNumber createdAt customerName phone email totalAmount platformFee deliveryCharge payment orderStatus items refund")
            .sort({ createdAt: -1 })
            .limit(10000)
            .lean();

        const header = [
            "Invoice", "Date", "Customer", "Phone", "Email", "Amount",
            "Platform Fee", "Delivery", "Method", "Payment Status", "Order Status",
            "Refund Status", "Items",
        ];
        const lines = [header.join(",")];
        for (const o of orders) {
            lines.push([
                o.invoiceNumber || "",
                new Date(o.createdAt).toISOString(),
                o.customerName || "",
                o.phone || "",
                o.email || "",
                o.totalAmount ?? 0,
                o.platformFee ?? 0,
                o.deliveryCharge ?? 0,
                o.payment?.method || "",
                o.payment?.status || "",
                o.orderStatus || "",
                o.refund?.status || "NONE",
                (o.items || []).map((i) => `${i.name} x${i.qty}`).join("; "),
            ].map(csvCell).join(","));
        }

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="orders-${r.key}-${Date.now()}.csv"`);
        res.send("﻿" + lines.join("\r\n"));
    } catch (err) {
        console.error("REPORT EXPORT ERROR:", err);
        res.status(500).json({ message: "Failed to export orders" });
    }
};
