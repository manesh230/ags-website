// Vercel Serverless Function — replaces the local email-server.js
// Deployed automatically by Vercel from the /api directory.
// Uses environment variables set in the Vercel dashboard.

const nodemailer = require('nodemailer');

const GMAIL_USER  = process.env.GMAIL_USER  || 'maneshharyani@gmail.com';
const GMAIL_PASS  = process.env.GMAIL_PASS  || 'xeifkfkwyevzffsh';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'manesh100130@gmail.com';
const STORE_NAME  = 'Awami General Store & Cloth House';

const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   587,
  secure: false,
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
});

function buildOrderHtml({ customerName, customerPhone, deliveryAddress, orderItems, orderTotal }) {
  const rows = orderItems.map(item =>
    `<tr>
      <td style="padding:8px 14px;border-bottom:1px solid #e8f5e9;">${item.name}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #e8f5e9;text-align:center;">${item.qty}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #e8f5e9;text-align:right;">PKR ${(item.price * item.qty).toLocaleString()}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f8e9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f8e9;padding:30px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#2e7d32,#43a047);padding:28px 32px;text-align:center;">
            <div style="background:#fff;display:inline-block;padding:6px 14px;border-radius:7px;font-weight:700;font-size:13px;color:#2e7d32;letter-spacing:1px;margin-bottom:10px;">AGS</div>
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">${STORE_NAME}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <h2 style="margin:0 0 6px;color:#2e7d32;font-size:17px;">Order Confirmation</h2>
            <p style="margin:0 0 22px;color:#555;font-size:14px;">Hi <strong>${customerName}</strong>, your order has been placed successfully! We'll contact you shortly to confirm delivery.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px;">
              <thead>
                <tr style="background:#e8f5e9;">
                  <th style="padding:9px 14px;text-align:left;font-size:13px;color:#2e7d32;">Product</th>
                  <th style="padding:9px 14px;text-align:center;font-size:13px;color:#2e7d32;">Qty</th>
                  <th style="padding:9px 14px;text-align:right;font-size:13px;color:#2e7d32;">Amount</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
              <tfoot>
                <tr style="background:#f9fbe7;">
                  <td colspan="2" style="padding:10px 14px;font-weight:700;font-size:14px;color:#1b5e20;">Total</td>
                  <td style="padding:10px 14px;font-weight:700;font-size:14px;color:#1b5e20;text-align:right;">${orderTotal}</td>
                </tr>
              </tfoot>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fdf9;border-radius:8px;margin-bottom:22px;">
              <tr>
                <td style="padding:8px 14px;font-size:13px;color:#666;width:130px;">Phone</td>
                <td style="padding:8px 14px;font-size:13px;color:#222;">${customerPhone}</td>
              </tr>
              <tr style="background:#f1f8e9;">
                <td style="padding:8px 14px;font-size:13px;color:#666;">Delivery Address</td>
                <td style="padding:8px 14px;font-size:13px;color:#222;">${deliveryAddress}</td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#888;">If you have any questions, reply to this email or contact us directly.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#e8f5e9;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#666;">&copy; ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

module.exports = async function handler(req, res) {
  // CORS headers — allow all origins (covers Vercel domain + local file)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const { customerName, customerPhone, customerEmail, deliveryAddress, orderItems, orderTotal } = req.body;

  if (!customerName || !customerEmail || !Array.isArray(orderItems) || !orderItems.length) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const htmlBody  = buildOrderHtml({ customerName, customerPhone, deliveryAddress, orderItems, orderTotal });
  const plainText = [
    `Order Confirmation — ${STORE_NAME}`,
    `================================================`,
    `Customer : ${customerName}`,
    `Phone    : ${customerPhone}`,
    `Email    : ${customerEmail}`,
    `Address  : ${deliveryAddress}`,
    ``,
    `Items:`,
    ...orderItems.map(i => `  - ${i.name}  x${i.qty}  =  PKR ${(i.price * i.qty).toLocaleString()}`),
    ``,
    `Total    : ${orderTotal}`,
    `================================================`,
    `Thank you for shopping with us!`,
  ].join('\n');

  const errors = [];

  // 1) Customer confirmation email
  try {
    await transporter.sendMail({
      from:    `"${STORE_NAME}" <${GMAIL_USER}>`,
      to:      customerEmail,
      subject: `Order Confirmation — ${STORE_NAME}`,
      text:    plainText,
      html:    htmlBody,
    });
  } catch (err) {
    console.error('[Customer email]', err.message);
    errors.push('customer');
  }

  // 2) Admin notification email
  try {
    await transporter.sendMail({
      from:    `"${STORE_NAME}" <${GMAIL_USER}>`,
      to:      ADMIN_EMAIL,
      subject: `New Order from ${customerName} — ${orderTotal}`,
      html: `<h3 style="color:#2e7d32;">New Order Received</h3>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Phone:</strong> ${customerPhone}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Address:</strong> ${deliveryAddress}</p>
        <p><strong>Items:</strong></p>
        <ul>${orderItems.map(i => `<li>${i.name} × ${i.qty} = PKR ${(i.price * i.qty).toLocaleString()}</li>`).join('')}</ul>
        <p><strong>Total:</strong> ${orderTotal}</p>`,
    });
  } catch (err) {
    console.error('[Admin email]', err.message);
    errors.push('admin');
  }

  if (errors.length === 2) return res.status(500).json({ error: 'Both emails failed to send.' });
  res.status(200).json({ success: true, skipped: errors });
};
