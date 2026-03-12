/**
 * orderStatusEmail.js
 * File: utils/orderStatusEmail.js
 */

export const getOrderStatusEmailTemplate = ({
  customerName,
  orderId,
  status,
  trackingUrl = "",
  courier = "",
  awb = "",
}) => {

  const shortId = orderId.toString().slice(-8).toUpperCase();

  const statusMessages = {
    PLACED: "We have received your order and it is being processed. ✅",
    CONFIRMED: "Your order has been confirmed by our team. 🎉",
    PACKED: "Your order has been packed and is ready to ship. 📦",
    SHIPPED: "Your order has been shipped and is on its way! 🚚",
    OUT_FOR_DELIVERY: "Your order is out for delivery — expect it today! 🏠",
    DELIVERED: "Your order has been delivered successfully. Thank you! 🎁",
    CANCELLED: "Your order has been cancelled. If you paid online, a refund will be processed within 5-7 business days.",
  };

  const statusColors = {
    PLACED: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
    CONFIRMED: { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
    PACKED: { bg: "#ede9fe", text: "#5b21b6", border: "#ddd6fe" },
    SHIPPED: { bg: "#e0e7ff", text: "#3730a3", border: "#c7d2fe" },
    OUT_FOR_DELIVERY: { bg: "#ffedd5", text: "#9a3412", border: "#fed7aa" },
    DELIVERED: { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
    CANCELLED: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
  };

  const readableStatus = status.replace(/_/g, " ");
  const colors = statusColors[status] || statusColors.PLACED;

  // Tracking section — only for SHIPPED
  const trackingSection = (status === "SHIPPED" && trackingUrl) ? `
        <div style="margin:20px 0;padding:16px;background:#eef2ff;border-radius:8px;border:1px solid #c7d2fe">
            <p style="margin:0 0 8px;font-weight:700;color:#3730a3;font-size:14px">📍 Tracking Details</p>
            ${courier ? `<p style="margin:4px 0;font-size:13px;color:#4338ca"><b>Courier:</b> ${courier}</p>` : ""}
            ${awb ? `<p style="margin:4px 0;font-size:13px;color:#4338ca"><b>AWB:</b> ${awb}</p>` : ""}
            <a href="${trackingUrl}" 
               style="display:inline-block;margin-top:10px;padding:10px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:13px">
                🔍 Track Your Order
            </a>
        </div>
    ` : "";

  // Invoice note for DELIVERED
  const invoiceNote = status === "DELIVERED" ? `
        <div style="margin:16px 0;padding:14px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0">
            <p style="margin:0;font-size:13px;color:#166534">
                📄 Your invoice is attached to this email. Please keep it for your records.
            </p>
        </div>
    ` : "";

  return {
    subject: `${getStatusEmoji(status)} Order ${readableStatus} — #${shortId} | RV Gift Shop`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:30px auto;padding:0 16px">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#111827,#1f2937);border-radius:12px 12px 0 0;padding:24px 30px;text-align:center">
      <h1 style="margin:0;color:white;font-size:22px;letter-spacing:0.5px">🎁 RV Gift Shop</h1>
      <p style="margin:4px 0 0;color:#9ca3af;font-size:13px">Order Notification</p>
    </div>

    <!-- Body -->
    <div style="background:white;padding:30px;border-radius:0 0 12px 12px;box-shadow:0 4px 6px rgba(0,0,0,0.05)">

      <p style="font-size:16px;color:#111827;margin:0 0 8px">Hello <b>${customerName}</b> 👋</p>

      <!-- Status Badge -->
      <div style="margin:20px 0;padding:16px 20px;background:${colors.bg};border-radius:8px;border:1px solid ${colors.border}">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:${colors.text};text-transform:uppercase;letter-spacing:1px">Order Status</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:${colors.text}">${readableStatus}</p>
      </div>

      <p style="color:#374151;font-size:14px;line-height:1.6">${statusMessages[status] || "Your order status has been updated."}</p>

      ${trackingSection}
      ${invoiceNote}

      <!-- Order Info -->
      <div style="margin:20px 0;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Order Details</p>
        <p style="margin:4px 0;font-size:14px;color:#111827"><b>Order ID:</b> #${shortId}</p>
        <p style="margin:4px 0;font-size:14px;color:#111827"><b>Full ID:</b> ${orderId}</p>
      </div>

      <!-- Support -->
      <div style="margin:20px 0;padding:14px;background:#fff7ed;border-radius:8px;border:1px solid #fed7aa">
        <p style="margin:0;font-size:13px;color:#9a3412">
          💬 Need help? WhatsApp us at <b>+91 88084 85840</b> or reply to this email.
        </p>
      </div>

      <!-- Thank you -->
      <div style="margin-top:24px;padding:20px;background:#ecfdf5;border-radius:8px;text-align:center">
        <p style="margin:0;color:#065f46;font-weight:600;font-size:15px">Thank you for shopping with RV Gift Shop 💝</p>
        <p style="margin:6px 0 0;color:#6b7280;font-size:12px">RV Gift and Printing • Gadhi Chowk, Akbarpur, Ambedkar Nagar</p>
      </div>

    </div>
  </div>
</body>
</html>
        `,
  };
};

const getStatusEmoji = (status) => {
  const map = {
    PLACED: "✅", CONFIRMED: "🎉", PACKED: "📦",
    SHIPPED: "🚚", OUT_FOR_DELIVERY: "🏠", DELIVERED: "🎁", CANCELLED: "❌",
  };
  return map[status] || "📦";
};