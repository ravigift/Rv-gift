export const adminOrderEmailHTML = ({ order }) => {

  const itemsHTML = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.qty}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">₹${item.price}</td>
      </tr>
    `
    )
    .join("");

  return `
  <div style="font-family:Arial;background:#f5f7fa;padding:30px">
    <div style="max-width:650px;margin:auto;background:white;padding:30px;border-radius:10px">

      <h2 style="margin-bottom:10px">🛒 New Order Received</h2>
      <p>A new order has been placed on <b>RV Gift Shop</b>.</p>
      <hr/>

      <p><b>Order ID:</b> ${order._id}</p>
      <p><b>Customer:</b> ${order.customerName}</p>
      <p><b>Phone:</b> ${order.phone}</p>
      <p><b>Address:</b> ${order.address}</p>
      <hr/>

      <h3>Order Items</h3>
      <table width="100%" style="border-collapse:collapse">
        <thead>
          <tr>
            <th align="left">Product</th>
            <th align="left">Qty</th>
            <th align="left">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <hr/>

      <p><b>Total Amount:</b> ₹${Number(order.totalAmount).toLocaleString("en-IN")}</p>

      <a href="https://admin.rvgift.com/orders/${order._id}" target="_blank" rel="noopener"
        style="display:inline-block;margin-top:20px;padding:14px 22px;background:#111827;color:white;text-decoration:none;border-radius:6px;font-weight:bold">
        🔐 Open Admin Dashboard
      </a>

      <p style="margin-top:30px;font-size:13px;color:#6b7280">
        RV Gift Shop • Admin Notification
      </p>
    </div>
  </div>
  `;
};