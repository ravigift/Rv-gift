import express from "express";
import { Resend } from "resend";
import Contact from "../models/Contact.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js"; // ✅ apne middleware ke hisaab se adjust karo

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

/* Escape user input before putting it into an HTML email — prevents
   HTML/link injection into the admin's inbox. */
const esc = (v) =>
    String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ==============================================
   POST /api/contact
   User se contact form submit
============================================== */
router.post("/", async (req, res) => {
    let { name, email, phone, subject, message } = req.body;

    name = String(name ?? "").trim().slice(0, 100);
    email = String(email ?? "").trim().toLowerCase().slice(0, 200);
    phone = String(phone ?? "").trim().slice(0, 20);
    subject = String(subject ?? "").trim().slice(0, 150);
    message = String(message ?? "").trim().slice(0, 3000);

    if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
    }
    if (message.length < 5) {
        return res.status(400).json({ error: "Message is too short" });
    }

    try {
        // 1. MongoDB mein save
        await Contact.create({ name, email, phone, subject, message });

        // 2. Resend se email
        await resend.emails.send({
            from: "RV Gift Shop <onboarding@resend.dev>",
            to: "officialrvgift@gmail.com",
            subject: `📩 New Contact: ${esc(subject || "No Subject")} — ${esc(name)}`,
            replyTo: email,
            html: `
                <div style="font-family:sans-serif; max-width:500px; margin:auto; border:1px solid #f59e0b; border-radius:10px; overflow:hidden;">
                    <div style="background:#f59e0b; padding:16px 24px;">
                        <h2 style="color:white; margin:0;">New Contact Form Submission</h2>
                    </div>
                    <div style="padding:24px; background:#fff;">
                        <p><strong>Name:</strong> ${esc(name)}</p>
                        <p><strong>Email:</strong> ${esc(email)}</p>
                        <p><strong>Phone:</strong> ${esc(phone || "Not provided")}</p>
                        <p><strong>Subject:</strong> ${esc(subject || "Not provided")}</p>
                        <hr style="border:none; border-top:1px solid #eee; margin:16px 0;" />
                        <p><strong>Message:</strong></p>
                        <p style="background:#fdf8f3; padding:12px; border-radius:8px; white-space:pre-wrap;">${esc(message)}</p>
                    </div>
                    <div style="background:#fdf8f3; padding:12px 24px; text-align:center;">
                        <small style="color:#9ca3af;">RV Gift Shop — Contact Form</small>
                    </div>
                </div>
            `,
        });

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Contact route error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

/* ==============================================
   GET /api/contact
   Admin — sabhi queries fetch karo
============================================== */
router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const queries = await Contact.find()
            .sort({ createdAt: -1 }) // latest pehle
            .limit(50);
        res.json(queries);
    } catch (err) {
        console.error("GET CONTACTS ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});

/* ==============================================
   PATCH /api/contact/:id/read
   Admin — query ko read mark karo
============================================== */
router.patch("/:id/read", protect, adminOnly, async (req, res) => {
    try {
        await Contact.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

export default router;