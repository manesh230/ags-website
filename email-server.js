// ===== AGS Email Server =====
// Runs on port 3001 — receives order data from the frontend and sends emails via Gmail SMTP
// Requires: npm install express nodemailer cors
//
// SETUP (one-time):
//   1. Go to https://myaccount.google.com/apppasswords
//   2. Create an App Password for "Mail" on "Windows Computer"
//   3. Paste the 16-char password into GMAIL_APP_PASSWORD below

const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
  origin: (origin, cb) => cb(null, true), // allow file://, localhost:5500, and any local origin
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// ===== GMAIL SMTP CONFIG — fill in your App Password =====
const GMAIL_USER     = 'maneshharyani@gmail.com';
const GMAIL_APP_PASS = 'xeifkfkwyevzffsh';
const ADMIN_EMAIL    = 'manesh100130@gmail.com';
const STORE_NAME     = 'Awami General Store & Cloth House';

const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   587,
  secure: false,          // STARTTLS
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASS,
  },
});

// ===== Helper — build a styled HTML email body ==============
function buildOrderHtml({ customerName, customerPhone, customerEmail, deliveryAddress, orderItems, orderTotal }) {
  const rows = orderItems.map(item =>
    `<tr>
      <td style="padding:8px 14px;border-bottom:1px solid #e8f5e9;">${item.name}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #e8f5e9;text-align:center;">${item.qty}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #e8f5e9;text-align:right;">PKR ${(item.price * item.qty).toLocaleString()}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f8e9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f8e9;padding:30px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2e7d32,#43a047);padding:28px 32px;text-align:center;">
            <div style="background:#fff;display:inline-block;padding:6px 14px;border-radius:7px;font-weight:700;font-size:13px;color:#2e7d32;letter-spacing:1px;margin-bottom:10px;">AGS</div>
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">${STORE_NAME}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <h2 style="margin:0 0 6px;color:#2e7d32;font-size:17px;">Order Confirmation</h2>
            <p style="margin:0 0 22px;color:#555;font-size:14px;">Hi <strong>${customerName}</strong>, your order has been placed successfully! We'll contact you shortly to confirm delivery.</p>

            <!-- Order items table -->
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

            <!-- Customer details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fdf9;border-radius:8px;padding:4px 0;margin-bottom:22px;">
              <tr>
                <td style="padding:8px 14px;font-size:13px;color:#666;width:130px;">Phone</td>
                <td style="padding:8px 14px;font-size:13px;color:#222;">${customerPhone}</td>
              </tr>
              <tr style="background:#f1f8e9;">
                <td style="padding:8px 14px;font-size:13px;color:#666;">Delivery Address</td>
                <td style="padding:8px 14px;font-size:13px;color:#222;">${deliveryAddress}</td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#888;">If you have any questions, reply to this email or call us directly.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#e8f5e9;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#666;">&copy; ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ===== /send-order-email endpoint =====
app.post('/send-order-email', async (req, res) => {
  const {
    customerName, customerPhone, customerEmail,
    deliveryAddress, orderItems, orderTotal,
  } = req.body;

  if (!customerName || !customerEmail || !orderItems?.length) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const htmlBody  = buildOrderHtml({ customerName, customerPhone, customerEmail, deliveryAddress, orderItems, orderTotal });

  // Plain-text fallback
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

  // 1) Email to CUSTOMER
  try {
    await transporter.sendMail({
      from:    `"${STORE_NAME}" <${GMAIL_USER}>`,
      to:      customerEmail,
      subject: `Order Confirmation — ${STORE_NAME}`,
      text:    plainText,
      html:    htmlBody,
    });
  } catch (err) {
    console.error('[Customer email error]', err.message);
    errors.push('customer');
  }

  // 2) Notification to ADMIN
  const adminSubject = `New Order from ${customerName} — PKR ${orderTotal}`;
  const adminHtml = `
    <h3 style="color:#2e7d32;">New Order Received</h3>
    <p><strong>Customer:</strong> ${customerName}</p>
    <p><strong>Phone:</strong> ${customerPhone}</p>
    <p><strong>Email:</strong> ${customerEmail}</p>
    <p><strong>Address:</strong> ${deliveryAddress}</p>
    <p><strong>Items:</strong></p>
    <ul>${orderItems.map(i => `<li>${i.name} × ${i.qty} = PKR ${(i.price * i.qty).toLocaleString()}</li>`).join('')}</ul>
    <p><strong>Total:</strong> ${orderTotal}</p>`;

  try {
    await transporter.sendMail({
      from:    `"${STORE_NAME}" <${GMAIL_USER}>`,
      to:      ADMIN_EMAIL,
      subject: adminSubject,
      html:    adminHtml,
    });
  } catch (err) {
    console.error('[Admin email error]', err.message);
    errors.push('admin');
  }

  if (errors.length === 2) {
    return res.status(500).json({ error: 'Both emails failed to send.' });
  }
  res.json({ success: true, skipped: errors });
});

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ AGS Email Server running at http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/send-order-email`);
});
