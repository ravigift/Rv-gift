import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * sendEmail
 * @param {object} opts
 * @param {string}   opts.to
 * @param {string}   opts.subject
 * @param {string}   opts.html
 * @param {string}   [opts.label]
 * @param {Array}    [opts.attachments]  — [{ filename, content (Buffer) }]
 */
export const sendEmail = async ({ to, subject, html, label = "", attachments = [] }) => {
    if (!to) {
        console.log(`📧 [${label}] skipped — no email`);
        return;
    }

    try {
        const payload = {
            from: "RV Gift Shop <orders@rvgift.com>",
            to,
            subject,
            html,
        };

        if (attachments.length > 0) {
            payload.attachments = attachments.map(a => ({
                filename: a.filename,
                content: a.content, // Buffer
            }));
        }

        await resend.emails.send(payload);
        console.log(`✅ [${label}] Email sent → ${to}${attachments.length ? ` (+${attachments.length} attachment)` : ""}`);
    } catch (error) {
        console.error(`❌ [${label}] Email failed`, error.message);
    }
};