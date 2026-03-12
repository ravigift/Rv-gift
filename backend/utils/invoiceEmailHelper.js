import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const SHOP = {
    name: process.env.SHOP_NAME || "RV Gift and Printing",
    address: process.env.SHOP_ADDRESS || "Gadhi Chowk, Dostpur Chauraha, Akbarpur",
    city: process.env.SHOP_CITY || "Ambedkar Nagar - 224122, Uttar Pradesh",
    stateCode: process.env.SHOP_STATE_CODE || "09",
    gstin: process.env.SHOP_GSTIN || "09AOAHPV4O34Q3Z3",
    email: process.env.SHOP_EMAIL || "shrivinayakgiftcentreindore@gmail.com",
    phone: process.env.SHOP_PHONE || "8808485840",
    website: process.env.SHOP_WEBSITE || "rv-gift.vercel.app",
};

const VERIFY_BASE = process.env.CLIENT_URL || "https://rv-gift.vercel.app";

const C = {
    bg: "#1C1C1E", amber: "#E8A020", green: "#2E7D32",
    white: "#FFFFFF", dark: "#1A1A1A", mid: "#444444",
    light: "#777777", border: "#DDDDDD", row1: "#FFFFFF", row2: "#F7F7F7",
};

const rs = (n) => "Rs. " + Number(n || 0).toFixed(2);
const dt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });

export const generateInvoiceBuffer = async (order) => {
    return new Promise(async (resolve, reject) => {
        try {
            // ── QR Code ──────────────────────────────────────────
            const invoiceNo = order.invoiceNumber || order._id.toString().slice(-8).toUpperCase();
            const verifyUrl = `${VERIFY_BASE}/verify/${invoiceNo}`;
            const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
                width: 90, margin: 1,
                color: { dark: C.dark, light: C.white },
            });
            const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

            const doc = new PDFDocument({ margin: 0, size: "A4", autoFirstPage: true });
            const chunks = [];
            doc.on("data", c => chunks.push(c));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", e => reject(e));

            const PW = 595, M = 40, CW = PW - M * 2;
            const rect = (x, y, w, h, fill) => doc.rect(x, y, w, h).fill(fill);
            const hline = (y, col = C.border, lw = 0.5) =>
                doc.moveTo(M, y).lineTo(PW - M, y).strokeColor(col).lineWidth(lw).stroke();

            const payMethod = order.payment?.method || "COD";
            const payStatus = order.payment?.status || "PAID";
            const isPaid = payMethod === "RAZORPAY" && payStatus === "PAID";
            const isCOD = payMethod === "COD";

            let y = 0;

            // ── HEADER ───────────────────────────────────────────
            rect(0, 0, PW, 105, C.bg);
            doc.fontSize(20).font("Helvetica-Bold").fillColor(C.amber)
                .text(SHOP.name, M, 16, { width: 310 });
            doc.fontSize(8).font("Helvetica").fillColor("#BBBBBB")
                .text(SHOP.address, M, 42)
                .text(SHOP.city + "  |  State Code: " + SHOP.stateCode, M, 54)
                .text("GSTIN: " + SHOP.gstin, M, 66)
                .text("Email: " + SHOP.email, M, 78)
                .text("Phone: " + SHOP.phone, M, 90);

            rect(PW - 195, 14, 155, 36, C.amber);
            doc.fontSize(15).font("Helvetica-Bold").fillColor(C.white)
                .text("TAX INVOICE", PW - 195, 22, { width: 155, align: "center" });
            doc.fontSize(8).font("Helvetica").fillColor("#CCCCCC")
                .text("Invoice #: " + invoiceNo, PW - 195, 58, { width: 155, align: "center" })
                .text("Date: " + dt(order.createdAt), PW - 195, 70, { width: 155, align: "center" })
                .text("Website: " + SHOP.website, PW - 195, 82, { width: 155, align: "center" });

            y = 115;

            // ── BILL TO + ORDER DETAILS ───────────────────────────
            const half = CW / 2 - 10, right = M + CW / 2 + 10;
            doc.fontSize(7).font("Helvetica-Bold").fillColor(C.light)
                .text("BILL TO / DELIVER TO", M, y)
                .text("ORDER DETAILS", right, y);
            y += 8;
            doc.rect(M, y, half, 1.5).fill(C.amber);
            doc.rect(right, y, half, 1.5).fill(C.amber);
            y += 8;

            doc.fontSize(10).font("Helvetica-Bold").fillColor(C.dark)
                .text(order.customerName || "—", M, y);
            doc.fontSize(8.5).font("Helvetica").fillColor(C.mid)
                .text("Phone: " + (order.phone || "—"), M, y + 15);
            let nY = y + 30;
            if (order.email && !order.email.includes("@rvgifts.com")) {
                doc.fontSize(8.5).font("Helvetica").fillColor(C.mid)
                    .text("Email: " + order.email, M, nY);
                nY += 14;
            }
            doc.fontSize(8.5).font("Helvetica").fillColor(C.dark)
                .text(order.address || "—", M, nY, { width: half - 5, lineGap: 2 });
            const addrH = doc.heightOfString(order.address || "—", { width: half - 5 });
            const leftB = nY + addrH + 6;

            const drows = [
                ["Order ID", "#" + order._id.toString().slice(-8).toUpperCase()],
                ["Invoice No", invoiceNo],                                           // ✅ NEW
                ["Order Date", dt(order.createdAt)],
                ["Status", (order.orderStatus || "DELIVERED").replace(/_/g, " ")],
                ["Payment Mode", isCOD ? "Cash on Delivery" : "Online (Razorpay)"],
                ["Payment Status", isPaid ? "PAID" : "COLLECTED (COD)"],
                ["Place of Supply", "Uttar Pradesh (09)"],
            ];
            let ry = y;
            drows.forEach(([l, v]) => {
                doc.fontSize(8).font("Helvetica-Bold").fillColor(C.light)
                    .text(l + ":", right, ry, { width: 85 });
                doc.fontSize(8).font("Helvetica").fillColor(C.dark)
                    .text(v, right + 90, ry, { width: half - 90 });
                ry += 14;
            });

            y = Math.max(leftB, ry) + 12;
            hline(y); y += 12;

            // ── ITEMS TABLE ───────────────────────────────────────
            const COL = { no: M, desc: M + 24, hsn: M + 240, qty: M + 305, rate: M + 355, gst: M + 415, total: M + 460 };
            const CW2 = { no: 20, desc: 210, hsn: 58, qty: 44, rate: 55, gst: 40, total: 55 };

            rect(M, y, CW, 22, C.bg);
            doc.fontSize(7.5).font("Helvetica-Bold").fillColor(C.white);
            doc.text("#", COL.no, y + 7, { width: CW2.no, align: "center" });
            doc.text("DESCRIPTION", COL.desc, y + 7, { width: CW2.desc, align: "left" });
            doc.text("HSN/SAC", COL.hsn, y + 7, { width: CW2.hsn, align: "center" });
            doc.text("QTY", COL.qty, y + 7, { width: CW2.qty, align: "center" });
            doc.text("RATE", COL.rate, y + 7, { width: CW2.rate, align: "right" });
            doc.text("GST%", COL.gst, y + 7, { width: CW2.gst, align: "center" });
            doc.text("TOTAL", COL.total, y + 7, { width: CW2.total, align: "right" });
            y += 22;

            const items = order.items || [];
            let subtotal = 0, totalGST = 0;

            items.forEach((item, i) => {
                const qty = Number(item.qty || item.quantity || 1);
                const rate = Number(item.price || 0);
                const gstPct = Number(item.gstPercent || 0);
                const base = qty * rate, gstAmt = (base * gstPct) / 100;
                const lineTotal = base + gstAmt;
                subtotal += base; totalGST += gstAmt;

                const hasCustom = !!item.customization?.text;
                const rowH = hasCustom ? 34 : 22;
                rect(M, y, CW, rowH, i % 2 === 0 ? C.row1 : C.row2);
                rect(M, y, 3, rowH, C.amber);

                const cy = y + (rowH - 9) / 2;
                doc.fontSize(8).font("Helvetica").fillColor(C.dark);
                doc.text(String(i + 1), COL.no, cy, { width: CW2.no, align: "center" });
                doc.font("Helvetica-Bold")
                    .text(item.name || "—", COL.desc, y + 6, { width: CW2.desc - 4, ellipsis: true });
                if (hasCustom) {
                    doc.fontSize(7).font("Helvetica").fillColor(C.amber)
                        .text("Customization: " + item.customization.text, COL.desc, y + 19, { width: CW2.desc - 4, ellipsis: true });
                }
                doc.fontSize(8).font("Helvetica").fillColor(C.dark);
                doc.text("91059990", COL.hsn, cy, { width: CW2.hsn, align: "center" });
                doc.text(String(qty), COL.qty, cy, { width: CW2.qty, align: "center" });
                doc.text(rs(rate), COL.rate, cy, { width: CW2.rate, align: "right" });
                doc.text(gstPct > 0 ? gstPct + "%" : "Nil", COL.gst, cy, { width: CW2.gst, align: "center" });
                doc.font("Helvetica-Bold")
                    .text(rs(lineTotal), COL.total, cy, { width: CW2.total, align: "right" });
                y += rowH;
            });

            rect(M, y, CW, 1, C.border); y += 14;

            // ── TOTALS ────────────────────────────────────────────
            const delCharge = Number(order.deliveryCharge ?? (subtotal >= 499 ? 0 : 49));
            const platFee = Number(order.platformFee ?? 9);
            const grandTotal = Number(order.totalAmount || (subtotal + totalGST + delCharge + platFee));
            const TX = M + CW - 230, TL = 130, TV = 90;

            const trow = (lbl, val, bold = false, valColor = C.dark) => {
                doc.fontSize(8.5).font("Helvetica").fillColor(C.light).text(lbl, TX, y, { width: TL });
                doc.font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(valColor)
                    .text(val, TX + TL, y, { width: TV, align: "right" });
                y += 16;
            };

            trow("Subtotal (excl. GST):", rs(subtotal));
            if (totalGST > 0) {
                trow("CGST (9%):", rs(totalGST / 2));
                trow("SGST (9%):", rs(totalGST / 2));
            }
            trow("Delivery Charge:", delCharge === 0 ? "FREE" : rs(delCharge), false, delCharge === 0 ? C.green : C.dark);
            trow("Platform Fee:", rs(platFee));
            y += 2;
            doc.rect(TX - 4, y, TL + TV + 8, 0.5).fill(C.border); y += 8;
            rect(TX - 4, y - 2, TL + TV + 8, 28, C.amber);
            doc.fontSize(10).font("Helvetica-Bold").fillColor(C.white)
                .text("GRAND TOTAL", TX, y + 6, { width: TL });
            doc.fontSize(11).font("Helvetica-Bold").fillColor(C.white)
                .text(rs(grandTotal), TX + TL, y + 5, { width: TV, align: "right" });
            y += 38;

            // ── PAYMENT BOX ───────────────────────────────────────
            rect(M, y, CW, 50, "#F5F5F5");
            rect(M, y, 4, 50, isCOD ? C.amber : C.green);
            doc.fontSize(7).font("Helvetica-Bold").fillColor(C.light)
                .text("PAYMENT METHOD", M + 14, y + 7);
            doc.fontSize(10).font("Helvetica-Bold").fillColor(C.dark)
                .text(isCOD ? "Cash on Delivery (COD)" : "Online Payment (Razorpay)", M + 14, y + 19);
            if (!isCOD && order.payment?.razorpayPaymentId) {
                doc.fontSize(7.5).font("Helvetica").fillColor(C.light)
                    .text("Txn ID: " + order.payment.razorpayPaymentId, M + 14, y + 33);
            } else if (isCOD) {
                doc.fontSize(7.5).font("Helvetica").fillColor(C.light)
                    .text("Payment collected at delivery", M + 14, y + 33);
            }
            rect(PW - M - 78, y + 13, 70, 22, C.green);
            doc.fontSize(9).font("Helvetica-Bold").fillColor(C.white)
                .text(isPaid ? "PAID" : "COLLECTED", PW - M - 78, y + 19, { width: 70, align: "center" });
            y += 62;

            if (totalGST > 0) {
                doc.fontSize(7).font("Helvetica").fillColor(C.light)
                    .text("* Taxes: CGST " + rs(totalGST / 2) + " + SGST " + rs(totalGST / 2) + " = Total GST " + rs(totalGST), M, y, { width: CW });
                y += 14;
            }

            hline(y, C.border); y += 12;

            // ── QR CODE BOX ───────────────────────────────────────  ✅ NEW
            const qrBoxH = 90;
            rect(M, y, CW, qrBoxH, "#F9F9F9");
            rect(M, y, 4, qrBoxH, C.amber);
            doc.image(qrBuffer, M + 14, y + 8, { width: 74, height: 74 });
            doc.fontSize(9).font("Helvetica-Bold").fillColor(C.dark)
                .text("Scan to Verify Invoice", M + 100, y + 10);
            doc.fontSize(7.5).font("Helvetica").fillColor(C.light)
                .text("Scan this QR to verify the authenticity of this invoice.", M + 100, y + 24, { width: CW - 120 })
                .text("Invoice No: " + invoiceNo, M + 100, y + 40)
                .text("Verify at: " + verifyUrl, M + 100, y + 53, { width: CW - 120 });
            // Seal
            doc.circle(PW - M - 34, y + 45, 30).fill(C.bg);
            doc.fontSize(6.5).font("Helvetica-Bold").fillColor(C.amber)
                .text("VERIFIED", PW - M - 64, y + 33, { width: 60, align: "center" });
            doc.fontSize(5.5).font("Helvetica-Bold").fillColor(C.white)
                .text("RV GIFTS", PW - M - 64, y + 43, { width: 60, align: "center" })
                .text("AUTHENTIC", PW - M - 64, y + 51, { width: 60, align: "center" });
            y += qrBoxH + 12;

            // ── THANK YOU ─────────────────────────────────────────
            doc.fontSize(9).font("Helvetica-Bold").fillColor(C.amber)
                .text("Thank you for shopping with RV Gift and Printing!", M, y, { width: CW, align: "center" });
            doc.fontSize(7.5).font("Helvetica").fillColor(C.light)
                .text("For queries: WhatsApp " + SHOP.phone + "  |  " + SHOP.website, M, y + 14, { width: CW, align: "center" });
            y += 32;

            // ── FOOTER ────────────────────────────────────────────
            const FY = Math.max(y + 8, 775);
            rect(0, FY, PW, 822 - FY, C.bg);
            doc.fontSize(8).font("Helvetica-Bold").fillColor(C.amber)
                .text("RV Gift and Printing", M, FY + 8);
            doc.fontSize(7).font("Helvetica").fillColor("#AAAAAA")
                .text("GSTIN: " + SHOP.gstin + "  |  " + SHOP.address + ", " + SHOP.city, M, FY + 20)
                .text(SHOP.email + "  |  Phone: " + SHOP.phone, M, FY + 32);
            doc.fontSize(7).font("Helvetica").fillColor("#AAAAAA")
                .text("Invoice: " + invoiceNo, 0, FY + 20, { align: "right", width: PW - M })
                .text("Generated: " + dt(new Date()) + "  |  Computer generated invoice", 0, FY + 32, { align: "right", width: PW - M });

            doc.end();

        } catch (err) {
            reject(err);
        }
    });
};