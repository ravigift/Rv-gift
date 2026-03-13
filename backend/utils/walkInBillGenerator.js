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
    gstin: process.env.SHOP_GSTIN || "09AOHPV4034Q3Z3",
};

const ADMIN_URL = process.env.ADMIN_URL || "https://admin.rvgift.com";

const C = {
    amber: "#D97706",
    amberLight: "#FEF3C7",
    dark: "#18181B",
    zinc: "#3F3F46",
    mid: "#71717A",
    light: "#A1A1AA",
    border: "#E4E4E7",
    rowAlt: "#FAFAFA",
    white: "#FFFFFF",
    green: "#15803D",
    greenLight: "#DCFCE7",
    blue: "#1D4ED8",
    blueLight: "#DBEAFE",
    purple: "#6D28D9",
    purpleLight: "#EDE9FE",
};

const rupee = (n) =>
    "Rs. " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Async — returns Buffer (for email / admin download with QR) ──
export const generateWalkInBillBuffer = async (order) => {
    const billUrl = `${ADMIN_URL}/walkin/${order._id}`;
    const qrDataUrl = await QRCode.toDataURL(billUrl, { width: 90, margin: 1, color: { dark: C.dark, light: C.white } });
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

// ─────────────────────────────────────────────────────────────────
function _render(doc, order, qrBuffer, billUrl) {
    const W = 595.28;
    const H = 841.89;
    const LM = 44;
    const RM = W - 44;
    const IW = RM - LM;

    const rect = (x, y, w, h, fill) => doc.rect(x, y, w, h).fill(fill);
    const hline = (y, col = C.border, lw = 0.5) =>
        doc.moveTo(LM, y).lineTo(RM, y).lineWidth(lw).stroke(col);

    // ── WATERMARK (very faint) ────────────────────────────────────
    doc.save().opacity(0.025).font("Helvetica-Bold").fontSize(64).fill(C.amber);
    for (let r = 0; r < 5; r++)
        for (let c = 0; c < 3; c++)
            doc.save().translate(80 + c * 200, 130 + r * 160).rotate(-35).text("RV Gifts", 0, 0).restore();
    doc.opacity(1).restore();

    // ─────────────────────────────────────────
    // HEADER
    // ─────────────────────────────────────────
    rect(0, 0, W, 3, C.amber);
    rect(0, 3, W, 110, C.white);
    rect(LM, 16, 3, 82, C.amber);

    // Logo mark
    doc.rect(LM + 12, 18, 36, 36).fill(C.amberLight);
    doc.font("Helvetica-Bold").fontSize(18).fillColor(C.amber)
        .text("RV", LM + 12, 26, { width: 36, align: "center" });

    // Shop name & tagline
    doc.font("Helvetica-Bold").fontSize(20).fillColor(C.dark)
        .text(SHOP.name, LM + 60, 18);
    doc.font("Helvetica").fontSize(8).fillColor(C.amber)
        .text(SHOP.tagline.toUpperCase(), LM + 60, 44, { characterSpacing: 0.8 });
    doc.font("Helvetica").fontSize(7.5).fillColor(C.mid)
        .text(SHOP.phone + "   |   " + SHOP.email + "   |   " + SHOP.website, LM + 60, 58);

    // GSTIN pill (top right)
    const gstW = 178, gstX = RM - gstW;
    doc.rect(gstX, 16, gstW, 22).fill(C.amberLight);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(C.amber)
        .text("GSTIN", gstX + 10, 22, { characterSpacing: 0.6 });
    doc.font("Helvetica-Bold").fontSize(8).fillColor(C.dark)
        .text(SHOP.gstin, gstX + 52, 22);
    doc.font("Helvetica").fontSize(7).fillColor(C.mid)
        .text(SHOP.address + ", " + SHOP.city, gstX, 48, { width: gstW, align: "right" });

    hline(113, C.amber, 1);

    // ─────────────────────────────────────────
    // META + CUSTOMER
    // ─────────────────────────────────────────
    let y = 128;

    // Bill title (left)
    doc.font("Helvetica-Bold").fontSize(15).fillColor(C.dark).text("TAX INVOICE", LM, y);
    doc.font("Helvetica").fontSize(7.5).fillColor(C.mid).text("Original Copy", LM, y + 20);

    // Meta box (right)
    const metaW = 194, metaX = RM - metaW;
    doc.rect(metaX, y - 4, metaW, 72).fill("#FAFAFA");
    doc.rect(metaX, y - 4, metaW, 72).lineWidth(0.5).stroke(C.border);
    rect(metaX, y - 4, 3, 72, C.amber);

    [
        ["Bill No", order.billNumber],
        ["Date", new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
        ["Time", new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })],
        ["Payment", order.paymentMode],
    ].forEach(([lbl, val], i) => {
        const ry = y + 4 + i * 16;
        doc.font("Helvetica").fontSize(7.5).fillColor(C.mid)
            .text(lbl, metaX + 12, ry, { width: 60 });
        doc.font("Helvetica-Bold").fontSize(8).fillColor(C.dark)
            .text(String(val), metaX + 80, ry, { width: metaW - 92, align: "right" });
    });

    // Customer card
    y += 84;
    const custW = IW / 2 - 10;
    doc.rect(LM, y, custW, 58).fill("#FAFAFA");
    doc.rect(LM, y, custW, 58).lineWidth(0.5).stroke(C.border);
    rect(LM, y, custW, 18, C.amber);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(C.white)
        .text("BILLED TO", LM + 12, y + 5, { characterSpacing: 0.8 });
    doc.font("Helvetica-Bold").fontSize(12).fillColor(C.dark)
        .text(order.customerName || "Walk-in Customer", LM + 12, y + 22);
    if (order.phone)
        doc.font("Helvetica").fontSize(8.5).fillColor(C.mid).text(order.phone, LM + 12, y + 38);
    if (order.note)
        doc.font("Helvetica").fontSize(7.5).fillColor(C.light)
            .text("Note: " + order.note, LM + 12, y + 50, { width: custW - 24 });

    // ─────────────────────────────────────────
    // ITEMS TABLE
    // ─────────────────────────────────────────
    y += 70;

    const cols = {
        sno: { x: LM, w: 28 },
        name: { x: LM + 28, w: 210 },
        qty: { x: LM + 238, w: 46 },
        rate: { x: LM + 284, w: 82 },
        gst: { x: LM + 366, w: 46 },
        amt: { x: LM + 412, w: IW - 412 },
    };

    // Header
    rect(LM, y, IW, 24, C.dark);
    rect(LM, y, 3, 24, C.amber);

    [
        ["#", cols.sno, "center"],
        ["ITEM DESCRIPTION", cols.name, "left"],
        ["QTY", cols.qty, "center"],
        ["RATE", cols.rate, "right"],
        ["GST", cols.gst, "center"],
        ["AMOUNT", cols.amt, "right"],
    ].forEach(([txt, col, align]) => {
        doc.font("Helvetica-Bold").fontSize(7).fillColor(C.white)
            .text(txt, col.x + 5, y + 8, { width: col.w - 8, align });
    });
    y += 24;

    order.items.forEach((item, idx) => {
        const RH = 26;
        const lineSub = item.price * item.qty;
        const lineGst = (lineSub * (item.gstPercent || 0)) / 100;
        const bg = idx % 2 === 0 ? C.white : C.rowAlt;

        rect(LM, y, IW, RH, bg);
        rect(LM, y, 3, RH, idx % 2 === 0 ? C.amber : C.border);
        doc.moveTo(LM, y + RH).lineTo(RM, y + RH).lineWidth(0.3).stroke(C.border);

        const ty = y + 8;
        doc.font("Helvetica").fontSize(8).fillColor(C.light)
            .text(String(idx + 1), cols.sno.x + 5, ty, { width: cols.sno.w - 8, align: "center" });
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.dark)
            .text(item.name, cols.name.x + 5, ty, { width: cols.name.w - 8, ellipsis: true });
        doc.font("Helvetica").fontSize(8.5).fillColor(C.mid)
            .text(String(item.qty), cols.qty.x + 5, ty, { width: cols.qty.w - 8, align: "center" })
            .text(rupee(item.price), cols.rate.x + 5, ty, { width: cols.rate.w - 8, align: "right" })
            .text(item.gstPercent ? item.gstPercent + "%" : "—", cols.gst.x + 5, ty, { width: cols.gst.w - 8, align: "center" });
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.dark)
            .text(rupee(lineSub + lineGst), cols.amt.x + 5, ty, { width: cols.amt.w - 8, align: "right" });

        y += RH;
    });

    hline(y, C.amber, 0.8); y += 16;

    // ─────────────────────────────────────────
    // TOTALS
    // ─────────────────────────────────────────
    const totW = 228, totX = RM - totW;

    [["Subtotal", rupee(order.subtotal)], ["GST", rupee(order.totalGST)]].forEach(([lbl, val]) => {
        doc.font("Helvetica").fontSize(8.5).fillColor(C.mid)
            .text(lbl, totX, y, { width: 110, align: "right" });
        doc.font("Helvetica").fontSize(8.5).fillColor(C.zinc)
            .text(val, totX + 118, y, { width: totW - 118, align: "right" });
        doc.moveTo(totX, y + 14).lineTo(RM, y + 14).lineWidth(0.4).dash(2, { space: 3 }).stroke(C.border).undash();
        y += 18;
    });

    // Grand total
    y += 4;
    doc.rect(totX - 8, y - 4, totW + 8, 30).fill(C.amberLight);
    doc.rect(totX - 8, y - 4, 3, 30).fill(C.amber);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.zinc)
        .text("GRAND TOTAL", totX, y + 5, { width: 108, align: "right" });
    doc.font("Helvetica-Bold").fontSize(14).fillColor(C.amber)
        .text(rupee(order.grandTotal), totX + 116, y + 3, { width: totW - 116, align: "right" });
    y += 42;

    // ─────────────────────────────────────────
    // PAYMENT BADGE + QR
    // ─────────────────────────────────────────
    const pmMap = {
        CASH: { bg: C.greenLight, tx: C.green },
        UPI: { bg: C.purpleLight, tx: C.purple },
        CARD: { bg: C.blueLight, tx: C.blue },
    };
    const pm = pmMap[order.paymentMode] || pmMap.CASH;

    doc.rect(LM, y, 118, 26).fill(pm.bg);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(pm.tx)
        .text("Paid via " + order.paymentMode, LM + 6, y + 8, { width: 106, align: "center" });

    if (qrBuffer && billUrl) {
        const qrBoxX = LM + 130;
        const qrBoxW = RM - qrBoxX;
        doc.rect(qrBoxX, y, qrBoxW, 52).fill("#FAFAFA");
        doc.rect(qrBoxX, y, qrBoxW, 52).lineWidth(0.5).stroke(C.border);
        rect(qrBoxX, y, 3, 52, C.amber);
        doc.image(qrBuffer, qrBoxX + 10, y + 6, { width: 40, height: 40 });
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C.dark)
            .text("Scan to view bill", qrBoxX + 58, y + 10);
        doc.font("Helvetica").fontSize(7).fillColor(C.mid)
            .text("Bill: " + order.billNumber, qrBoxX + 58, y + 22)
            .text(billUrl, qrBoxX + 58, y + 33, { width: qrBoxW - 70, ellipsis: true });
    }

    y += 64;
    hline(y, C.border); y += 16;

    // ─────────────────────────────────────────
    // SIGNATURES
    // ─────────────────────────────────────────
    const sigW = 168, sigH = 60;

    doc.rect(LM, y, sigW, sigH).lineWidth(0.6).stroke(C.border);
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor(C.mid)
        .text("CUSTOMER SIGNATURE", LM + 10, y + 8, { characterSpacing: 0.6 });
    doc.moveTo(LM + 14, y + sigH - 14).lineTo(LM + sigW - 14, y + sigH - 14)
        .lineWidth(0.6).dash(3, { space: 3 }).stroke(C.border).undash();

    const authX = RM - sigW;
    doc.rect(authX, y, sigW, sigH).lineWidth(0.6).stroke(C.border);
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor(C.mid)
        .text("AUTHORIZED SIGNATORY", authX + 10, y + 8, { characterSpacing: 0.6 });
    doc.moveTo(authX + 14, y + sigH - 14).lineTo(authX + sigW - 14, y + sigH - 14)
        .lineWidth(0.6).dash(3, { space: 3 }).stroke(C.border).undash();
    doc.font("Helvetica-Bold").fontSize(8).fillColor(C.dark)
        .text("For " + SHOP.name, authX + sigW / 2 - 32, y + sigH - 9);

    y += sigH + 16;

    // ─────────────────────────────────────────
    // TERMS & CONDITIONS
    // ─────────────────────────────────────────
    doc.rect(LM, y, IW, 78).fill("#FAFAFA");
    doc.rect(LM, y, IW, 78).lineWidth(0.5).stroke(C.border);
    rect(LM, y, 3, 78, C.amber);

    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C.dark)
        .text("TERMS & CONDITIONS", LM + 14, y + 10, { characterSpacing: 0.4 });

    [
        "Goods once sold will not be taken back or exchanged unless found to be defective.",
        "All disputes are subject to local jurisdiction only.",
        "This is a computer-generated invoice and is valid without a physical signature.",
        "Please verify goods at the time of delivery; claims will not be entertained afterwards.",
        "For queries: " + SHOP.email + "  |  " + SHOP.phone,
    ].forEach((t, i) => {
        doc.font("Helvetica").fontSize(7.2).fillColor(C.mid)
            .text((i + 1) + ".  " + t, LM + 14, y + 24 + i * 11, { width: IW - 24 });
    });

    y += 92;

    // ─────────────────────────────────────────
    // FOOTER
    // ─────────────────────────────────────────
    const FY = Math.max(y, H - 42);
    hline(FY, C.border, 0.4);
    rect(0, FY + 1, W, H - FY, "#FAFAFA");

    doc.font("Helvetica-Bold").fontSize(8).fillColor(C.amber)
        .text(SHOP.name, LM, FY + 9);
    doc.font("Helvetica").fontSize(7).fillColor(C.mid)
        .text(SHOP.address + ", " + SHOP.city + "   |   " + SHOP.phone + "   |   " + SHOP.website,
            0, FY + 9, { width: W - LM, align: "right" });
    doc.font("Helvetica").fontSize(6.5).fillColor(C.light)
        .text("GSTIN: " + SHOP.gstin, LM, FY + 22);
    doc.font("Helvetica").fontSize(6.5).fillColor(C.light)
        .text("Computer generated invoice", 0, FY + 22, { width: W - LM, align: "right" });
}