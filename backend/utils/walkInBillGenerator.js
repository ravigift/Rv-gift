import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export const SHOP = {
    name: process.env.SHOP_NAME || "RV Gift and Printing",
    tagline: process.env.SHOP_TAGLINE || "Unique Gifts for Every Occasion",
    address: process.env.SHOP_ADDRESS || "Gadhi Chowk, Dostpur Chauraha, Akbarpur",
    city: process.env.SHOP_CITY || "Ambedkar Nagar - 224122, Uttar Pradesh",
    phone: process.env.SHOP_PHONE || "8808485840",
    email: process.env.SHOP_EMAIL || "shrivinayakgiftcentreindore@gmail.com",
    website: process.env.SHOP_WEBSITE || "rv-gift.vercel.app",
    gstin: process.env.SHOP_GSTIN || "09AOAHPV4O34Q3Z3",
};

const ADMIN_URL = process.env.ADMIN_URL || "https://rv-gift-admin.vercel.app";

const C = {
    primary: "#D97706",
    dark: "#0F0F0F",
    zinc: "#27272A",
    mid: "#52525B",
    muted: "#A1A1AA",
    faint: "#F8F8F8",
    border: "#E4E4E7",
    white: "#FFFFFF",
    green: "#059669",
    purple: "#7C3AED",
    blue: "#2563EB",
};

const rupee = (n) =>
    "Rs. " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Async — returns Buffer (for email / admin download with QR) ──
export const generateWalkInBillBuffer = async (order) => {
    const billUrl = `${ADMIN_URL}/walkin/${order._id}`;
    const qrDataUrl = await QRCode.toDataURL(billUrl, { width: 80, margin: 1 });
    const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `Invoice ${order.billNumber}`, Author: SHOP.name } });
        const chunks = [];
        doc.on("data", c => chunks.push(c));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", e => reject(e));
        _render(doc, order, qrBuffer, billUrl);
        doc.end();
    });
};

// ── Sync — returns doc stream (for direct res.pipe) ──
export const generateWalkInBill = (order) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `Invoice ${order.billNumber}`, Author: SHOP.name } });
    _render(doc, order, null, null);
    doc.end();
    return doc;
};

// ─────────────────────────────────────────────────────────────
function _render(doc, order, qrBuffer, billUrl) {
    const W = 595.28;
    const H = 841.89;
    const LM = 44;
    const RM = W - 44;
    const IW = RM - LM;

    const rect = (x, y, w, h, fill) => doc.rect(x, y, w, h).fill(fill);
    const hline = (y, col = C.border, lw = 0.4) =>
        doc.moveTo(LM, y).lineTo(RM, y).lineWidth(lw).stroke(col);

    // ── WATERMARK ──
    doc.save().opacity(0.03).font("Helvetica-Bold").fontSize(68).fill(C.primary);
    for (let r = 0; r < 5; r++)
        for (let c = 0; c < 3; c++)
            doc.save().translate(80 + c * 200, 140 + r * 160).rotate(-35).text("RV Gifts", 0, 0).restore();
    doc.opacity(1).restore();

    // ─────────────────────────────────────────
    // HEADER
    // ─────────────────────────────────────────
    rect(0, 0, W, 118, C.dark);
    rect(0, 0, 5, 118, C.primary);

    // Grid lines (subtle)
    doc.save().opacity(0.05);
    for (let gx = 0; gx < W; gx += 24)
        doc.moveTo(gx, 0).lineTo(gx, 118).lineWidth(0.5).stroke(C.white);
    doc.opacity(1).restore();

    // Logo circle
    doc.circle(LM + 30, 59, 28).fill(C.primary);
    doc.circle(LM + 30, 59, 22).lineWidth(1.5).stroke(C.dark);
    doc.font("Helvetica-Bold").fontSize(18).fill(C.dark)
        .text("RV", LM + 16, 49, { width: 28, align: "center" });

    doc.font("Helvetica-Bold").fontSize(22).fill(C.white)
        .text(SHOP.name, LM + 72, 20);
    doc.font("Helvetica").fontSize(7.5).fill(C.primary)
        .text(SHOP.tagline.toUpperCase(), LM + 72, 48, { characterSpacing: 1.1 });
    doc.font("Helvetica").fontSize(7).fill(C.muted)
        .text(SHOP.phone + "   |   " + SHOP.email + "   |   " + SHOP.website, LM + 72, 64);

    // GSTIN pill
    const gstW = 168, gstX = RM - gstW;
    doc.roundedRect(gstX, 20, gstW, 26, 4).fill("#1C1C1C");
    doc.font("Helvetica").fontSize(6.5).fill(C.muted).text("GSTIN", gstX + 10, 26);
    doc.font("Helvetica-Bold").fontSize(8).fill(C.primary).text(SHOP.gstin, gstX + 48, 26);
    doc.font("Helvetica").fontSize(7).fill(C.muted)
        .text(SHOP.address + ", " + SHOP.city, gstX, 54, { width: gstW, align: "right" });

    // Header bottom bar
    rect(0, 118, W, 4, C.primary);

    // ─────────────────────────────────────────
    // META + CUSTOMER
    // ─────────────────────────────────────────
    let y = 136;

    doc.font("Helvetica-Bold").fontSize(16).fill(C.dark).text("TAX INVOICE", LM, y);
    doc.font("Helvetica").fontSize(8).fill(C.muted).text("Original Copy", LM, y + 22);

    // Meta box (right)
    const metaW = 196, metaX = RM - metaW;
    doc.roundedRect(metaX, y - 4, metaW, 76, 5).fill(C.faint);
    doc.roundedRect(metaX, y - 4, metaW, 76, 5).lineWidth(0.4).stroke(C.border);

    [
        ["Bill No", order.billNumber],
        ["Date", new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
        ["Time", new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })],
        ["Payment", order.paymentMode],
    ].forEach(([lbl, val], i) => {
        const ry = y + 4 + i * 17;
        doc.font("Helvetica").fontSize(7.5).fill(C.muted).text(lbl, metaX + 10, ry);
        doc.font("Helvetica-Bold").fontSize(8).fill(C.dark)
            .text(String(val), metaX + 78, ry, { width: metaW - 90, align: "right" });
    });

    // Customer card
    y += 86;
    const custW = IW / 2 - 10;
    doc.roundedRect(LM, y, custW, 58, 5).fill(C.faint);
    doc.roundedRect(LM, y, custW, 58, 5).lineWidth(0.4).stroke(C.border);
    rect(LM, y, custW, 18, C.primary);
    doc.rect(LM, y + 12, custW, 6).fill(C.primary); // fix rounded overlap
    doc.font("Helvetica-Bold").fontSize(7).fill(C.white)
        .text("BILLED TO", LM + 10, y + 5, { characterSpacing: 1 });
    doc.font("Helvetica-Bold").fontSize(12).fill(C.dark)
        .text(order.customerName || "Walk-in Customer", LM + 10, y + 22);
    if (order.phone)
        doc.font("Helvetica").fontSize(9).fill(C.mid).text(order.phone, LM + 10, y + 39);
    if (order.note)
        doc.font("Helvetica").fontSize(7.5).fill(C.muted)
            .text("Note: " + order.note, LM + 10, y + 50, { width: custW - 20 });

    // ─────────────────────────────────────────
    // ITEMS TABLE
    // ─────────────────────────────────────────
    y += 70;

    const cols = {
        sno: { x: LM, w: 28 },
        name: { x: LM + 28, w: 208 },
        qty: { x: LM + 236, w: 46 },
        rate: { x: LM + 282, w: 82 },
        gst: { x: LM + 364, w: 46 },
        amt: { x: LM + 410, w: IW - 410 },
    };

    // Table header
    const TH = 24;
    rect(LM, y, IW, TH, C.zinc);
    rect(LM, y, 4, TH, C.primary);

    [
        ["#", cols.sno, "center"],
        ["ITEM DESCRIPTION", cols.name, "left"],
        ["QTY", cols.qty, "center"],
        ["RATE", cols.rate, "right"],
        ["GST", cols.gst, "center"],
        ["AMOUNT", cols.amt, "right"],
    ].forEach(([txt, col, align]) => {
        doc.font("Helvetica-Bold").fontSize(7).fill(C.white)
            .text(txt, col.x + 5, y + 8, { width: col.w - 8, align });
    });
    y += TH;

    order.items.forEach((item, idx) => {
        const RH = 26;
        const lineSub = item.price * item.qty;
        const lineGst = (lineSub * (item.gstPercent || 0)) / 100;
        const bg = idx % 2 === 0 ? "#FAFAFA" : C.white;

        rect(LM, y, IW, RH, bg);
        rect(LM, y, 4, RH, idx % 2 === 0 ? C.primary : C.border);
        doc.moveTo(LM, y + RH).lineTo(RM, y + RH).lineWidth(0.3).stroke(C.border);

        const ty = y + 8;
        doc.font("Helvetica").fontSize(8).fill(C.muted)
            .text(String(idx + 1), cols.sno.x + 5, ty, { width: cols.sno.w - 8, align: "center" });
        doc.font("Helvetica-Bold").fontSize(8.5).fill(C.dark)
            .text(item.name, cols.name.x + 5, ty, { width: cols.name.w - 8, ellipsis: true });
        doc.font("Helvetica-Bold").fontSize(8.5).fill(C.mid)
            .text(String(item.qty), cols.qty.x + 5, ty, { width: cols.qty.w - 8, align: "center" });
        doc.font("Helvetica").fontSize(8.5).fill(C.mid)
            .text(rupee(item.price), cols.rate.x + 5, ty, { width: cols.rate.w - 8, align: "right" });
        doc.font("Helvetica").fontSize(8.5).fill(C.mid)
            .text(item.gstPercent ? item.gstPercent + "%" : "--", cols.gst.x + 5, ty, { width: cols.gst.w - 8, align: "center" });
        doc.font("Helvetica-Bold").fontSize(8.5).fill(C.dark)
            .text(rupee(lineSub + lineGst), cols.amt.x + 5, ty, { width: cols.amt.w - 8, align: "right" });

        y += RH;
    });

    doc.moveTo(LM, y).lineTo(RM, y).lineWidth(1).stroke(C.primary);
    y += 16;

    // ─────────────────────────────────────────
    // TOTALS
    // ─────────────────────────────────────────
    const totW = 220, totX = RM - totW;

    [["Subtotal", rupee(order.subtotal)], ["GST", rupee(order.totalGST)]].forEach(([lbl, val]) => {
        doc.font("Helvetica").fontSize(9).fill(C.muted).text(lbl, totX, y, { width: 100, align: "right" });
        doc.font("Helvetica").fontSize(9).fill(C.mid).text(val, totX + 108, y, { width: totW - 108, align: "right" });
        doc.moveTo(totX, y + 14).lineTo(RM, y + 14).lineWidth(0.4).dash(2, { space: 3 }).stroke(C.border).undash();
        y += 18;
    });

    // Grand total box
    doc.roundedRect(totX - 8, y, totW + 8, 32, 5).fill(C.zinc);
    doc.roundedRect(totX - 8, y, 5, 32, 2).fill(C.primary);
    doc.font("Helvetica-Bold").fontSize(9).fill(C.muted)
        .text("GRAND TOTAL", totX + 4, y + 10, { width: 100, align: "right" });
    doc.font("Helvetica-Bold").fontSize(15).fill(C.primary)
        .text(rupee(order.grandTotal), totX + 112, y + 7, { width: totW - 112, align: "right" });
    y += 44;

    // ─────────────────────────────────────────
    // PAYMENT BADGE + QR  (below totals)
    // ─────────────────────────────────────────
    const pmColor = order.paymentMode === "CASH" ? C.green
        : order.paymentMode === "UPI" ? C.purple
            : C.blue;

    // Payment badge — left side
    doc.roundedRect(LM, y, 112, 26, 5).fill(pmColor);
    doc.font("Helvetica-Bold").fontSize(8.5).fill(C.white)
        .text("Paid via " + order.paymentMode, LM + 6, y + 8, { width: 100, align: "center" });

    // QR box — right of badge
    if (qrBuffer && billUrl) {
        const qrBoxX = LM + 124;
        doc.roundedRect(qrBoxX, y, 220, 52, 5).fill(C.faint);
        doc.roundedRect(qrBoxX, y, 220, 52, 5).lineWidth(0.4).stroke(C.border);
        doc.image(qrBuffer, qrBoxX + 8, y + 6, { width: 40, height: 40 });
        doc.font("Helvetica-Bold").fontSize(7).fill(C.dark)
            .text("Scan to view bill", qrBoxX + 54, y + 10);
        doc.font("Helvetica").fontSize(6.5).fill(C.muted)
            .text("Bill: " + order.billNumber, qrBoxX + 54, y + 22)
            .text(billUrl, qrBoxX + 54, y + 33, { width: 160, ellipsis: true });
    }

    y += 62;
    hline(y);
    y += 16;

    // ─────────────────────────────────────────
    // SIGNATURES
    // ─────────────────────────────────────────
    const sigW = 168, sigH = 62;

    doc.roundedRect(LM, y, sigW, sigH, 5).lineWidth(0.6).stroke(C.border);
    doc.font("Helvetica-Bold").fontSize(6.5).fill(C.muted)
        .text("CUSTOMER SIGNATURE", LM + 10, y + 8, { characterSpacing: 0.8 });
    doc.moveTo(LM + 12, y + sigH - 14).lineTo(LM + sigW - 12, y + sigH - 14)
        .lineWidth(0.8).dash(3, { space: 3 }).stroke(C.muted).undash();
    doc.font("Helvetica").fontSize(7).fill(C.muted).text("Sign here", LM + sigW / 2 - 18, y + sigH - 10);

    const authX = RM - sigW;
    doc.roundedRect(authX, y, sigW, sigH, 5).lineWidth(0.6).stroke(C.border);
    doc.font("Helvetica-Bold").fontSize(6.5).fill(C.muted)
        .text("AUTHORIZED SIGNATORY", authX + 10, y + 8, { characterSpacing: 0.8 });
    doc.moveTo(authX + 12, y + sigH - 14).lineTo(authX + sigW - 12, y + sigH - 14)
        .lineWidth(0.8).dash(3, { space: 3 }).stroke(C.muted).undash();
    doc.font("Helvetica-Bold").fontSize(8).fill(C.dark)
        .text("For " + SHOP.name, authX + sigW / 2 - 30, y + sigH - 10);

    y += sigH + 16;

    // ─────────────────────────────────────────
    // TERMS
    // ─────────────────────────────────────────
    doc.roundedRect(LM, y, IW, 82, 5).fill(C.faint);
    doc.roundedRect(LM, y, IW, 82, 5).lineWidth(0.4).stroke(C.border);
    rect(LM, y, 4, 82, C.primary);

    doc.font("Helvetica-Bold").fontSize(7.5).fill(C.dark)
        .text("TERMS & CONDITIONS", LM + 14, y + 10, { characterSpacing: 0.5 });

    [
        "Goods once sold will not be taken back or exchanged unless found to be defective.",
        "All disputes are subject to local jurisdiction only.",
        "This is a system-generated invoice and is valid without a physical signature.",
        "Please verify goods at the time of delivery; claims will not be entertained afterwards.",
        "For queries: " + SHOP.email + "  |  " + SHOP.phone,
    ].forEach((t, i) => {
        doc.font("Helvetica").fontSize(7.2).fill(C.muted)
            .text((i + 1) + ".  " + t, LM + 14, y + 24 + i * 12, { width: IW - 24 });
    });

    y += 96;

    // ─────────────────────────────────────────
    // FOOTER
    // ─────────────────────────────────────────
    rect(0, H - 40, W, 40, C.zinc);
    rect(0, H - 40, W, 3, C.primary);
    doc.font("Helvetica-Bold").fontSize(10).fill(C.primary)
        .text(SHOP.name, 0, H - 30, { width: W, align: "center" });
    doc.font("Helvetica").fontSize(7).fill(C.muted)
        .text(SHOP.address + ", " + SHOP.city + "   |   " + SHOP.phone + "   |   " + SHOP.website,
            0, H - 18, { width: W, align: "center" });
}