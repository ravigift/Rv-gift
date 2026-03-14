import express from "express";
import { Resend } from "resend";
import Contact from "../models/Contact.js";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/", async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // 1. MongoDB mein save
        await Contact.create({ name, email, phone, subject, message });

        // 2. Resend se email
        await resend.emails.send({
            from: "RV Gift Shop <onboarding@resend.dev>",
            to: "officialrvgift@gmail.com",
            subject: `📩 New Contact: ${subject || "No Subject"} — ${name}`,
            html: `
                <div style="font-family:sans-serif; max-width:500px; margin:auto; border:1px solid #f59e0b; border-radius:10px; overflow:hidden;">
                    <div style="background:#f59e0b; padding:16px 24px;">
                        <h2 style="color:white; margin:0;">New Contact Form Submission</h2>
                    </div>
                    <div style="padding:24px; background:#fff;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
                        <p><strong>Subject:</strong> ${subject || "Not provided"}</p>
                        <hr style="border:none; border-top:1px solid #eee; margin:16px 0;" />
                        <p><strong>Message:</strong></p>
                        <p style="background:#fdf8f3; padding:12px; border-radius:8px;">${message}</p>
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

export default router;