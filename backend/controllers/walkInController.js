import crypto from "crypto";
import bcrypt from "bcryptjs";
import WalkInOrder from "../models/WalkInOrder.js";
import { generateWalkInBillBuffer, SHOP } from "../utils/walkInBillGenerator.js";
import { sendEmail } from "../utils/emailService.js"; // ✅ resend — nodemailer nahi
import PosSecurity from "../models/posSecurityModel.js";

// ── Helpers ────────────────────────────────────────────────────
const generateBillNumber = async () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await WalkInOrder.countDocuments();
    return `RVG-${dateStr}-${String(count + 1).padStart(4, "0")}`;
};

// SHA-256 hash — OTP ke liye (fast, one-way)
const hashOtp = (otp) =>
    crypto.createHash("sha256").update(String(otp)).digest("hex");

// ─────────────────────────────────────────────
// CREATE WALK-IN BILL
// ─────────────────────────────────────────────
export const createWalkInOrder = async (req, res) => {
    try {
        const { customerName, phone, items, paymentMode, note } = req.body;

        if (!items || items.length === 0)
            return res.status(400).json({ message: "At least one item is required" });

        for (const item of items) {
            if (!item.name?.trim())
                return res.status(400).json({ message: "Item name required" });
            if (!item.qty || item.qty < 1)
                return res.status(400).json({ message: "Item qty must be >= 1" });
            if (item.price < 0)
                return res.status(400).json({ message: "Item price cannot be negative" });
        }

        const processedItems = items.map(item => ({
            name: item.name.trim(),
            qty: Number(item.qty),
            price: Number(item.price),
            gstPercent: Number(item.gstPercent || 0),
        }));

        const subtotal = processedItems.reduce((s, i) => s + i.price * i.qty, 0);
        const totalGST = processedItems.reduce((s, i) => s + (i.price * i.qty * i.gstPercent) / 100, 0);
        const grandTotal = subtotal + totalGST;
        const billNumber = await generateBillNumber();

        const order = await WalkInOrder.create({
            billNumber,
            customerName: customerName?.trim() || "Walk-in Customer",
            phone: phone?.trim() || "",
            items: processedItems,
            subtotal, totalGST, grandTotal,
            paymentMode: paymentMode || "CASH",
            note: note?.trim() || "",
            createdBy: req.user._id,
        });

        res.status(201).json(order);
    } catch (err) {
        console.error("CREATE WALKIN ERROR:", err);
        res.status(500).json({ message: "Failed to create bill" });
    }
};

// ─────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────
export const getAllWalkInOrders = async (req, res) => {
    try {
        const { date, search } = req.query;
        const query = {};

        if (date) {
            const start = new Date(date); start.setHours(0, 0, 0, 0);
            const end = new Date(date); end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }

        if (search?.trim()) {
            query.$or = [
                { customerName: { $regex: search.trim(), $options: "i" } },
                { phone: { $regex: search.trim(), $options: "i" } },
                { billNumber: { $regex: search.trim(), $options: "i" } },
            ];
        }

        const orders = await WalkInOrder.find(query).sort({ createdAt: -1 }).lean();
        res.json(orders);
    } catch (err) {
        console.error("GET WALKIN ERROR:", err);
        res.status(500).json({ message: "Failed to fetch bills" });
    }
};

// ─────────────────────────────────────────────
// GET SINGLE
// ─────────────────────────────────────────────
export const getWalkInOrderById = async (req, res) => {
    try {
        const order = await WalkInOrder.findById(req.params.id).lean();
        if (!order) return res.status(404).json({ message: "Bill not found" });
        res.json(order);
    } catch {
        res.status(500).json({ message: "Failed to fetch bill" });
    }
};

// ─────────────────────────────────────────────
// DELETE — PIN verify karke
// ─────────────────────────────────────────────
export const deleteWalkInOrder = async (req, res) => {
    try {
        const { pin } = req.body;

        if (!pin)
            return res.status(400).json({ message: "Delete PIN required" });

        const security = await PosSecurity.findOne();

        if (!security || !security.deletePin)
            return res.status(400).json({ message: "Delete PIN not set. Please set it first." });

        // ✅ bcrypt compare — plain text never compare karo
        const isValid = await bcrypt.compare(String(pin), security.deletePin);
        if (!isValid)
            return res.status(401).json({ message: "Invalid delete PIN" });

        const order = await WalkInOrder.findById(req.params.id);
        if (!order)
            return res.status(404).json({ message: "Bill not found" });

        await order.deleteOne();
        res.json({ message: "Bill deleted" });

    } catch (err) {
        console.error("DELETE WALKIN ERROR:", err);
        res.status(500).json({ message: "Failed to delete bill" });
    }
};

// ─────────────────────────────────────────────
// SEND OTP — PIN reset ke liye
// ─────────────────────────────────────────────
export const sendDeletePinResetOtp = async (req, res) => {
    try {
        const rawOtp = Math.floor(100000 + Math.random() * 900000); // 6-digit
        const expiry = Date.now() + 10 * 60 * 1000;                 // 10 min

        // ✅ OTP hashed store karo — plain text nahi
        const hashedOtp = hashOtp(rawOtp);

        let security = await PosSecurity.findOne();
        if (!security) {
            security = new PosSecurity({
                deletePin: "",
                resetOtp: hashedOtp,
                resetOtpExpire: expiry,
            });
        } else {
            security.resetOtp = hashedOtp;
            security.resetOtpExpire = expiry;
        }
        await security.save();

        // Email mein raw OTP bhejo (jo expire hone ke baad useless hai)
        await sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: "RV Gift Shop — POS Delete PIN Reset OTP",
            label: "POS/ResetOTP",
            html: `
                <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;
                            border:1px solid #e5e7eb;border-radius:12px">
                    <h2 style="color:#0f0f0f;margin-bottom:8px">POS Delete PIN Reset</h2>
                    <p style="color:#6b7280;font-size:14px;margin-bottom:4px">Your one-time OTP is:</p>
                    <div style="font-size:40px;font-weight:900;letter-spacing:10px;
                                color:#d97706;padding:20px 0;text-align:center">
                        ${rawOtp}
                    </div>
                    <p style="color:#6b7280;font-size:12px">
                        Valid for <strong>10 minutes</strong>. Do not share with anyone.
                    </p>
                    <p style="color:#9ca3af;font-size:11px;margin-top:16px">
                        RV Gifts POS Security • Authorized use only
                    </p>
                </div>
            `,
        });

        res.json({ message: "OTP sent to admin email" });

    } catch (err) {
        console.error("SEND OTP ERROR:", err);
        res.status(500).json({ message: "Failed to send OTP" });
    }
};

// ─────────────────────────────────────────────
// RESET PIN — OTP verify + new PIN set
// ─────────────────────────────────────────────
export const resetDeletePin = async (req, res) => {
    try {
        const { otp, newPin } = req.body;

        if (!otp || !newPin)
            return res.status(400).json({ message: "OTP and new PIN required" });

        if (String(newPin).length < 4)
            return res.status(400).json({ message: "PIN must be at least 4 digits" });

        const security = await PosSecurity.findOne();
        if (!security)
            return res.status(400).json({ message: "Security config not found" });

        // ✅ OTP: hash karke compare karo
        const hashedInput = hashOtp(otp);
        const otpValid = security.resetOtp === hashedInput;
        const notExpired = security.resetOtpExpire > Date.now();

        if (!otpValid || !notExpired)
            return res.status(400).json({ message: "Invalid or expired OTP" });

        // ✅ PIN: bcrypt hash karke store karo
        const hashedPin = await bcrypt.hash(String(newPin), 12);
        security.deletePin = hashedPin;

        // OTP use hone ke baad clear karo
        security.resetOtp = null;
        security.resetOtpExpire = null;

        await security.save();

        res.json({ message: "Delete PIN updated successfully" });

    } catch (err) {
        console.error("RESET PIN ERROR:", err);
        res.status(500).json({ message: "Failed to reset PIN" });
    }
};

// ─────────────────────────────────────────────
// DOWNLOAD PDF
// ─────────────────────────────────────────────
export const downloadWalkInBill = async (req, res) => {
    try {
        const order = await WalkInOrder.findById(req.params.id).lean();
        if (!order) return res.status(404).json({ message: "Bill not found" });

        const filename = `RVGifts_Bill_${order.billNumber}.pdf`;
        const pdfBuffer = await generateWalkInBillBuffer(order);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error("WALKIN BILL PDF ERROR:", err);
        res.status(500).json({ message: "Failed to generate bill" });
    }
};

// ─────────────────────────────────────────────
// EMAIL BILL
// ─────────────────────────────────────────────
export const emailWalkInBill = async (req, res) => {
    try {
        const order = await WalkInOrder.findById(req.params.id).lean();
        if (!order) return res.status(404).json({ message: "Bill not found" });

        const toEmail = req.body?.email?.trim() || null;
        if (!toEmail)
            return res.status(400).json({ message: "Email address is required" });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(toEmail))
            return res.status(400).json({ message: "Invalid email address" });

        const pdfBuffer = await generateWalkInBillBuffer(order);

        const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit", month: "long", year: "numeric",
        });

        const itemsHtml = order.items.map(item => {
            const lineTotal = item.price * item.qty;
            const gstAmt = (lineTotal * (item.gstPercent || 0)) / 100;
            return `
            <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #f1f1f1;font-size:13px;color:#27272a">${item.name}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #f1f1f1;font-size:13px;color:#52525b;text-align:center">${item.qty}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #f1f1f1;font-size:13px;color:#52525b;text-align:right">Rs.${item.price.toLocaleString("en-IN")}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #f1f1f1;font-size:13px;font-weight:700;color:#0f0f0f;text-align:right">Rs.${(lineTotal + gstAmt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>`;
        }).join("");

        const pmColor = order.paymentMode === "CASH" ? "#059669"
            : order.paymentMode === "UPI" ? "#7c3aed" : "#2563eb";

        const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#0f0f0f;padding:28px 32px">
      <div style="font-size:20px;font-weight:900;color:#fff">${SHOP.name}</div>
      <div style="font-size:11px;color:#d97706;letter-spacing:1px;margin-top:2px">${SHOP.tagline.toUpperCase()}</div>
    </div>
    <div style="height:4px;background:#d97706"></div>
    <div style="padding:28px 32px">
      <h2 style="margin:0 0 6px;font-size:22px;color:#0f0f0f">Your Invoice is Ready! 🎉</h2>
      <p style="margin:0 0 20px;color:#71717a;font-size:14px">Hi <strong>${order.customerName}</strong>, thank you for shopping at ${SHOP.name}.</p>
      <div style="background:#f8f8f8;border-radius:10px;padding:16px 20px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:13px;color:#71717a">Bill Number</span>
          <span style="font-size:13px;font-weight:700;color:#d97706">${order.billNumber}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:13px;color:#71717a">Date</span>
          <span style="font-size:13px;font-weight:600;color:#27272a">${dateStr}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="font-size:13px;color:#71717a">Payment</span>
          <span style="font-size:12px;font-weight:700;color:#fff;background:${pmColor};padding:2px 10px;border-radius:20px">${order.paymentMode}</span>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead><tr style="background:#27272a">
          <th style="padding:9px 12px;text-align:left;font-size:11px;color:#a1a1aa">ITEM</th>
          <th style="padding:9px 12px;text-align:center;font-size:11px;color:#a1a1aa">QTY</th>
          <th style="padding:9px 12px;text-align:right;font-size:11px;color:#a1a1aa">RATE</th>
          <th style="padding:9px 12px;text-align:right;font-size:11px;color:#a1a1aa">AMOUNT</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="border-top:2px solid #f1f1f1;padding-top:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;color:#71717a">Subtotal</span>
          <span style="font-size:13px;color:#27272a">Rs.${order.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        ${order.totalGST > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;color:#71717a">GST</span>
          <span style="font-size:13px;color:#27272a">Rs.${order.totalGST.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>` : ""}
        <div style="display:flex;justify-content:space-between;background:#0f0f0f;margin-top:8px;padding:12px 16px;border-radius:8px">
          <span style="font-size:14px;font-weight:700;color:#fff">Grand Total</span>
          <span style="font-size:18px;font-weight:900;color:#d97706">Rs.${order.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa">For queries: <a href="mailto:${SHOP.email}" style="color:#d97706">${SHOP.email}</a> or ${SHOP.phone}</p>
    </div>
    <div style="background:#27272a;padding:16px 32px;text-align:center">
      <p style="margin:0;font-size:11px;color:#71717a">${SHOP.address}, ${SHOP.city}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#71717a">GSTIN: ${SHOP.gstin}</p>
    </div>
  </div>
</body></html>`;

        await sendEmail({
            to: toEmail,
            subject: `Your Invoice from ${SHOP.name} — ${order.billNumber}`,
            label: "WalkIn/Bill",
            html: emailHtml,
            attachments: [{
                filename: `RVGifts_Bill_${order.billNumber}.pdf`,
                content: pdfBuffer,
            }],
        });

        console.log(`✅ [WalkIn/Bill] Email sent → ${toEmail} | Bill: ${order.billNumber}`);
        res.json({ message: "Bill emailed successfully", to: toEmail });

    } catch (err) {
        console.error("EMAIL WALKIN BILL ERROR:", err);
        res.status(500).json({ message: "Failed to send email" });
    }
};

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────
export const getWalkInStats = async (req, res) => {
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

        const [todayOrders, allOrders] = await Promise.all([
            WalkInOrder.find({ createdAt: { $gte: today, $lt: tomorrow } }).lean(),
            WalkInOrder.find({}).lean(),
        ]);

        res.json({
            todayBills: todayOrders.length,
            todayRevenue: todayOrders.reduce((s, o) => s + o.grandTotal, 0),
            totalBills: allOrders.length,
            totalRevenue: allOrders.reduce((s, o) => s + o.grandTotal, 0),
        });
    } catch {
        res.status(500).json({ message: "Failed to fetch stats" });
    }
};