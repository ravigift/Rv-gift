import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html, label = "" }) => {
    if (!to) {
        console.log(`📧 [${label}] skipped — no email`);
        return;
    }

    try {
        const response = await resend.emails.send({
            from: "RV Gift Shop <onboarding@resend.dev>",
            to,
            subject,
            html,
        });

        console.log(`✅ [${label}] Email sent → ${to}`);
    } catch (error) {
        console.error(`❌ [${label}] Email failed`, error.message);
    }
};