import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const SHOP = {
    name: process.env.SHOP_NAME || "RV Gift and Printing",
    address: process.env.SHOP_ADDRESS || "Gadhi Chowk, Dostpur Chauraha, Akbarpur",
    city: process.env.SHOP_CITY || "Ambedkar Nagar - 224122, Uttar Pradesh",
    stateCode: process.env.SHOP_STATE_CODE || "09",
    gstin: process.env.SHOP_GSTIN || "09AOHPV4034Q3Z3",
    email: process.env.SHOP_EMAIL || "officialrvgift@gmail.com",
    phone: process.env.SHOP_PHONE || "8299519532",
    website: process.env.SHOP_WEBSITE || "rvgift.com",
};

const VERIFY_BASE = process.env.CLIENT_URL || "https://rvgift.com";

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
    red: "#B91C1C",
    strikeGray: "#BBBBBB",
};

const rs = (n) => "Rs. " + Number(n || 0).toFixed(2);
const dt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });

// ✅ Safely get MRP from item — supports mrp or originalPrice field
const getItemMrp = (item) => {
    const val = item?.mrp ?? item?.originalPrice ?? null;
    if (val === null || val === undefined || val === "") return null;
    const n = Number(val);
    return n > 0 && n > Number(item.price) ? n : null;
};

// ─────────────────────────────────────────────────────────────────
export const generateInvoiceBuffer = async (order) => {
    return new Promise(async (resolve, reject) => {
        try {
            const invoiceNo = order.invoiceNumber || order._id.toString().slice(-8).toUpperCase();
            const verifyUrl = `${VERIFY_BASE}/verify/${invoiceNo}`;
            const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 100, margin: 1, color: { dark: C.dark, light: C.white } });
            const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

            const doc = new PDFDocument({ margin: 0, size: "A4", autoFirstPage: true });
            const chunks = [];
            doc.on("data", c => chunks.push(c));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", e => reject(e));

            const PW = 595;
            const M = 44;
            const CW = PW - M * 2;

            const rect = (x, y, w, h, fill) => doc.rect(x, y, w, h).fill(fill);
            const hline = (y, col = C.border, lw = 0.5) =>
                doc.moveTo(M, y).lineTo(PW - M, y).strokeColor(col).lineWidth(lw).stroke();

            const payMethod = order.payment?.method || "COD";
            const payStatus = order.payment?.status || "PAID";
            const isPaid = payMethod === "RAZORPAY" && payStatus === "PAID";
            const isCOD = payMethod === "COD";

            let y = 0;

            // ── HEADER ────────────────────────────────────────────
            rect(0, 0, PW, 3, C.amber);
            rect(0, 3, PW, 110, C.white);
            rect(M, 20, 3, 78, C.amber);

            doc.font("Helvetica-Bold").fontSize(21).fillColor(C.dark).text(SHOP.name, M + 14, 20);
            doc.font("Helvetica").fontSize(8).fillColor(C.amber).text("Unique Gifts for Every Occasion", M + 14, 46, { characterSpacing: 0.6 });
            doc.font("Helvetica").fontSize(7.5).fillColor(C.mid)
                .text(SHOP.address, M + 14, 60)
                .text(SHOP.city + "   |   State Code: " + SHOP.stateCode, M + 14, 72)
                .text("GSTIN: " + SHOP.gstin, M + 14, 84);

            const boxW = 178, boxX = PW - M - boxW;
            doc.rect(boxX, 18, boxW, 34).fill(C.amber);
            doc.font("Helvetica-Bold").fontSize(14).fillColor(C.white).text("TAX INVOICE", boxX, 28, { width: boxW, align: "center" });
            doc.rect(boxX, 52, boxW, 48).fill(C.amberLight);
            doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C.zinc).text("Invoice No:", boxX + 10, 60);
            doc.font("Helvetica").fontSize(7.5).fillColor(C.dark).text(invoiceNo, boxX + 78, 60);
            doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C.zinc).text("Date:", boxX + 10, 74);
            doc.font("Helvetica").fontSize(7.5).fillColor(C.dark).text(dt(order.createdAt), boxX + 78, 74);
            doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C.zinc).text("Website:", boxX + 10, 88);
            doc.font("Helvetica").fontSize(7.5).fillColor(C.amber).text(SHOP.website, boxX + 78, 88);

            hline(113, C.amber, 1); y = 125;

            // ── BILL TO + ORDER DETAILS ───────────────────────────
            const half = CW / 2 - 12, rightCol = M + CW / 2 + 12;

            doc.font("Helvetica-Bold").fontSize(7).fillColor(C.amber)
                .text("BILL TO / DELIVER TO", M, y, { characterSpacing: 0.8 });
            doc.font("Helvetica-Bold").fontSize(7).fillColor(C.amber)
                .text("ORDER DETAILS", rightCol, y, { characterSpacing: 0.8 });
            y += 5;
            doc.rect(M, y, half, 1).fill(C.amber);
            doc.rect(rightCol, y, half, 1).fill(C.amber);
            y += 10;

            doc.font("Helvetica-Bold").fontSize(11).fillColor(C.dark).text(order.customerName || "—", M, y);
            doc.font("Helvetica").fontSize(8.5).fillColor(C.mid).text("Phone: " + (order.phone || "—"), M, y + 16);

            let nY = y + 32;
            if (order.email && !order.email.includes("@rvgifts.com")) {
                doc.font("Helvetica").fontSize(8.5).fillColor(C.mid).text("Email: " + order.email, M, nY);
                nY += 14;
            }
            doc.font("Helvetica").fontSize(8.5).fillColor(C.zinc).text(order.address || "—", M, nY, { width: half - 5, lineGap: 2 });
            const addrH = doc.heightOfString(order.address || "—", { width: half - 5 });
            const leftBottom = nY + addrH + 8;

            const drows = [
                ["Order ID", "#" + order._id.toString().slice(-8).toUpperCase()],
                ["Invoice No", invoiceNo],
                ["Order Date", dt(order.createdAt)],
                ["Status", (order.orderStatus || "DELIVERED").replace(/_/g, " ")],
                ["Payment Mode", isCOD ? "Cash on Delivery" : "Online (Razorpay)"],
                ["Payment Status", isPaid ? "PAID" : "COLLECTED (COD)"],
                ["Place of Supply", "Uttar Pradesh (09)"],
            ];
            let ry = y;
            drows.forEach(([l, v]) => {
                doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C.mid).text(l + ":", rightCol, ry, { width: 92 });
                doc.font("Helvetica").fontSize(7.5).fillColor(C.dark).text(v, rightCol + 96, ry, { width: half - 96 });
                ry += 14;
            });

            y = Math.max(leftBottom, ry) + 14;
            hline(y, C.border); y += 14;

            // ── ITEMS TABLE ───────────────────────────────────────
            // ✅ Columns adjusted to fit MRP column: DESC narrowed, MRP added before TOTAL
            const COL = {
                no: M,
                desc: M + 24,
                hsn: M + 212,        // shifted left slightly
                qty: M + 268,
                rate: M + 310,
                mrp: M + 368,        // ✅ NEW MRP column
                gst: M + 424,
                total: M + 464,
            };
            const CW2 = {
                no: 20, desc: 183, hsn: 50, qty: 38,
                rate: 52, mrp: 50, gst: 34, total: 55,
            };

            // Table header
            rect(M, y, CW, 24, C.dark);
            rect(M, y, 3, 24, C.amber);

            doc.font("Helvetica-Bold").fontSize(6.8).fillColor(C.white);
            doc.text("#", COL.no, y + 8, { width: CW2.no, align: "center" });
            doc.text("DESCRIPTION", COL.desc, y + 8, { width: CW2.desc, align: "left" });
            doc.text("HSN/SAC", COL.hsn, y + 8, { width: CW2.hsn, align: "center" });
            doc.text("QTY", COL.qty, y + 8, { width: CW2.qty, align: "center" });
            doc.text("RATE", COL.rate, y + 8, { width: CW2.rate, align: "right" });
            doc.text("MRP", COL.mrp, y + 8, { width: CW2.mrp, align: "right" }); // ✅
            doc.text("GST%", COL.gst, y + 8, { width: CW2.gst, align: "center" });
            doc.text("TOTAL", COL.total, y + 8, { width: CW2.total, align: "right" });
            y += 24;

            const items = order.items || [];
            let subtotal = 0;
            let totalGST = 0;
            let totalSavings = 0;      // ✅ track total savings across all items

            items.forEach((item, i) => {
                const qty = Number(item.qty || item.quantity || 1);
                const rate = Number(item.price || 0);
                const gstPct = Number(item.gstPercent || 0);
                const base = qty * rate;
                const gstAmt = (base * gstPct) / 100;
                const lineTotal = base + gstAmt;
                subtotal += base;
                totalGST += gstAmt;

                // ✅ MRP per item
                const mrpVal = getItemMrp(item);
                const savings = mrpVal ? (mrpVal - rate) * qty : 0;
                totalSavings += savings;

                const hasCustom = !!item.customization?.text;
                const rowH = hasCustom ? 34 : 24;
                const bg = i % 2 === 0 ? C.white : C.rowAlt;

                rect(M, y, CW, rowH, bg);
                rect(M, y, 3, rowH, i % 2 === 0 ? C.amber : C.border);
                doc.moveTo(M, y + rowH).lineTo(PW - M, y + rowH).lineWidth(0.3).strokeColor(C.border).stroke();

                const ty = y + (rowH - 9) / 2;

                doc.font("Helvetica").fontSize(8).fillColor(C.mid)
                    .text(String(i + 1), COL.no, ty, { width: CW2.no, align: "center" });

                doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.dark)
                    .text(item.name || "—", COL.desc, y + 7, { width: CW2.desc - 4, ellipsis: true });
                if (hasCustom) {
                    doc.font("Helvetica").fontSize(7).fillColor(C.amber)
                        .text("Custom: " + item.customization.text, COL.desc, y + 20, { width: CW2.desc - 4, ellipsis: true });
                }

                doc.font("Helvetica").fontSize(8).fillColor(C.mid)
                    .text("91059990", COL.hsn, ty, { width: CW2.hsn, align: "center" })
                    .text(String(qty), COL.qty, ty, { width: CW2.qty, align: "center" })
                    .text(rs(rate), COL.rate, ty, { width: CW2.rate, align: "right" })
                    .text(gstPct > 0 ? gstPct + "%" : "Nil", COL.gst, ty, { width: CW2.gst, align: "center" });

                // ✅ MRP column — strikethrough if discount present
                if (mrpVal) {
                    const mrpText = rs(mrpVal);
                    const mrpTY = ty;
                    doc.font("Helvetica").fontSize(7.5).fillColor(C.strikeGray)
                        .text(mrpText, COL.mrp, mrpTY, { width: CW2.mrp, align: "right" });
                    // Draw strikethrough line through MRP text
                    const textW = doc.widthOfString(mrpText);
                    const lineX = COL.mrp + CW2.mrp - textW;
                    doc.moveTo(lineX, mrpTY + 5)
                        .lineTo(lineX + textW, mrpTY + 5)
                        .strokeColor(C.strikeGray).lineWidth(0.8).stroke();
                } else {
                    doc.font("Helvetica").fontSize(8).fillColor(C.light)
                        .text("—", COL.mrp, ty, { width: CW2.mrp, align: "right" });
                }

                doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.dark)
                    .text(rs(lineTotal), COL.total, ty, { width: CW2.total, align: "right" });

                y += rowH;

                // Page break guard
                if (y > 700) { doc.addPage(); y = 50; }
            });

            hline(y, C.amber, 0.8); y += 16;

            // ── TOTALS ────────────────────────────────────────────
            const delCharge = Number(order.deliveryCharge ?? (subtotal >= 499 ? 0 : 49));
            const platFee = Number(order.platformFee ?? 9);
            const grandTotal = Number(order.totalAmount || (subtotal + totalGST + delCharge + platFee));

            const TX = M + CW - 235, TL = 130, TV = 100;

            const trow = (lbl, val, highlight = false, valColor = C.zinc) => {
                doc.font("Helvetica").fontSize(8.5).fillColor(C.mid).text(lbl, TX, y, { width: TL });
                doc.font(highlight ? "Helvetica-Bold" : "Helvetica").fillColor(valColor)
                    .text(val, TX + TL, y, { width: TV, align: "right" });
                y += 16;
            };

            trow("Subtotal (excl. GST):", rs(subtotal));
            if (totalGST > 0) {
                trow("CGST (9%):", rs(totalGST / 2));
                trow("SGST (9%):", rs(totalGST / 2));
            }
            trow(
                "Delivery Charge:",
                delCharge === 0 ? "FREE" : rs(delCharge),
                false,
                delCharge === 0 ? C.green : C.zinc,
            );
            trow("Platform Fee:", rs(platFee));

            // ✅ Show total savings if any discounts applied
            if (totalSavings > 0) {
                trow("Total Savings:", "- " + rs(totalSavings), false, C.green);
            }

            y += 4;
            doc.rect(TX - 6, y, TL + TV + 12, 0.5).fill(C.border);
            y += 10;

            // Grand total row
            doc.rect(TX - 6, y - 4, TL + TV + 12, 30).fill(C.amberLight);
            doc.rect(TX - 6, y - 4, 3, 30).fill(C.amber);
            doc.font("Helvetica-Bold").fontSize(9).fillColor(C.zinc).text("GRAND TOTAL", TX, y + 5, { width: TL });
            doc.font("Helvetica-Bold").fontSize(13).fillColor(C.amber).text(rs(grandTotal), TX + TL, y + 3, { width: TV, align: "right" });
            y += 40;

            // ── PAYMENT STATUS ────────────────────────────────────
            const pmBg = isCOD ? C.amberLight : C.greenLight;
            const pmTx = isCOD ? C.amber : C.green;

            rect(M, y, CW, 46, "#FAFAFA");
            doc.rect(M, y, CW, 46).lineWidth(0.5).stroke(C.border);
            rect(M, y, 3, 46, C.amber);

            doc.font("Helvetica-Bold").fontSize(7).fillColor(C.mid).text("PAYMENT METHOD", M + 14, y + 8, { characterSpacing: 0.6 });
            doc.font("Helvetica-Bold").fontSize(10).fillColor(C.dark).text(isCOD ? "Cash on Delivery (COD)" : "Online Payment (Razorpay)", M + 14, y + 20);
            if (!isCOD && order.payment?.razorpayPaymentId) {
                doc.font("Helvetica").fontSize(7.5).fillColor(C.mid).text("Txn ID: " + order.payment.razorpayPaymentId, M + 14, y + 33);
            }

            const badgeX = PW - M - 90, badgeY = y + 12;
            doc.rect(badgeX, badgeY, 80, 22).fill(pmBg);
            doc.font("Helvetica-Bold").fontSize(9).fillColor(pmTx).text(isPaid ? "PAID" : "COLLECTED", badgeX, badgeY + 7, { width: 80, align: "center" });

            y += 58;

            if (totalGST > 0) {
                doc.font("Helvetica").fontSize(7).fillColor(C.light)
                    .text("* Tax breakdown: CGST " + rs(totalGST / 2) + "  +  SGST " + rs(totalGST / 2) + "  =  Total GST " + rs(totalGST), M, y, { width: CW });
                y += 14;
            }

            hline(y, C.border); y += 14;

            // ── QR VERIFY BOX ─────────────────────────────────────
            const qrBoxH = 88;
            rect(M, y, CW, qrBoxH, "#FAFAFA");
            doc.rect(M, y, CW, qrBoxH).lineWidth(0.5).stroke(C.border);
            rect(M, y, 3, qrBoxH, C.amber);

            doc.image(qrBuffer, M + 14, y + 8, { width: 70, height: 70 });

            doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text("Scan to Verify Invoice", M + 96, y + 12);
            doc.font("Helvetica").fontSize(7.5).fillColor(C.mid).text("Scan this QR code to confirm the authenticity of this invoice.", M + 96, y + 26, { width: CW - 116 });
            doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C.zinc).text("Invoice No: ", M + 96, y + 44);
            doc.font("Helvetica").fontSize(7.5).fillColor(C.amber).text(invoiceNo, M + 158, y + 44);
            doc.font("Helvetica").fontSize(7.5).fillColor(C.light).text(verifyUrl, M + 96, y + 58, { width: CW - 116 });

            y += qrBoxH + 14;

            // ── THANK YOU ─────────────────────────────────────────
            hline(y, C.amber, 0.6); y += 10;
            doc.font("Helvetica-Bold").fontSize(9.5).fillColor(C.amber)
                .text("Thank you for shopping with RV Gift and Printing!", M, y, { width: CW, align: "center" });
            doc.font("Helvetica").fontSize(7.5).fillColor(C.mid)
                .text("For queries: WhatsApp " + SHOP.phone + "   |   " + SHOP.email, M, y + 14, { width: CW, align: "center" });
            y += 32;

            // ── FOOTER ────────────────────────────────────────────
            const FY = Math.max(y + 8, 772);
            hline(FY, C.border, 0.4);
            rect(0, FY + 1, PW, 841 - FY, "#FAFAFA");

            doc.font("Helvetica-Bold").fontSize(8).fillColor(C.amber).text(SHOP.name, M, FY + 10);
            doc.font("Helvetica").fontSize(7).fillColor(C.mid)
                .text("GSTIN: " + SHOP.gstin + "   |   " + SHOP.address + ", " + SHOP.city, M, FY + 22)
                .text(SHOP.email + "   |   Phone: " + SHOP.phone, M, FY + 34);
            doc.font("Helvetica").fontSize(7).fillColor(C.light)
                .text("Invoice: " + invoiceNo, 0, FY + 22, { align: "right", width: PW - M })
                .text("Generated: " + dt(new Date()) + "   |   Computer generated invoice", 0, FY + 34, { align: "right", width: PW - M });

            doc.end();

        } catch (err) {
            reject(err);
        }
    });
};