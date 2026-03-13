// utils/whatsapp.js

// ===================================
// ADMIN (OWNER) WHATSAPP
// ===================================
export const generateWhatsAppLink = (order) => {
    const adminNumber = "918299519532"; // 91 included, no +

    if (!order || !order.items?.length) {
        console.error("Invalid order data for WhatsApp");
        return "";
    }

    const itemsText = order.items
        .map((item, index) => {
            const qty = Number(item.qty || item.quantity || 1);
            const price = Number(item.price || 0);
            return `${index + 1}. ${item.name} x ${qty} = Rs.${price * qty}`;
        })
        .join("\n");

    const message = `
*NEW ORDER RECEIVED*

Order ID: ${order._id}

Items:
${itemsText}

Total Amount: Rs.${order.totalAmount}

Customer: ${order.customerName}
Phone: ${order.phone}
Address: ${order.address}

Payment: CASH ON DELIVERY
Status: ${order.orderStatus}
    `.trim();

    return `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
};

// ===================================
// USER WHATSAPP CONFIRMATION
// ===================================
export const generateUserWhatsAppLink = (order, status = "PLACED") => {
    if (!order?.phone) {
        console.error("Phone missing for user WhatsApp");
        return "";
    }

    const cleanPhone = order.phone.replace(/\D/g, "");
    const userNumber = cleanPhone.startsWith("91")
        ? cleanPhone
        : `91${cleanPhone}`;

    const message = `
*ORDER ${status.replace("_", " ")}*

Hi ${order.customerName},

Your order has been placed successfully.

Order ID: ${order._id}
Total Amount: Rs.${order.totalAmount}
Payment: Cash on Delivery

We will keep you updated.

- RV Gift Shop
    `.trim();

    return `https://wa.me/${userNumber}?text=${encodeURIComponent(message)}`;
};