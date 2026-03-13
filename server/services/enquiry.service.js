import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildAvailabilityEmailHtml({ name, productName, size }) {
  const safeName = escapeHtml(name);
  const safeProductName = escapeHtml(productName);
  const safeSize = escapeHtml(size);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your size is available!</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                Great news, ${safeName}! 🎉
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
                The size you enquired about is <strong>now available</strong>:
              </p>

              <!-- Product Card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin:20px 0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">
                      Product
                    </p>
                    <p style="margin:0;font-size:17px;font-weight:800;color:#111827;">
                      ${safeProductName}
                    </p>
                    <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">
                      Size: <strong style="color:#111827;">${safeSize}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
                Head back to our store to complete your purchase before it sells out!
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#111827;border-radius:10px;">
                    <a href="${process.env.STORE_URL || "#"}"
                      style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                      Shop Now →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                You received this email because you submitted a size enquiry.<br/>
                If you have questions, simply reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Sends a product availability notification email.
 * @param {{ name: string, email: string, productName: string, size: string }} options
 */
export async function sendAvailabilityEmail({
  name,
  email,
  productName,
  size,
}) {
  await transporter.sendMail({
    from: `"${process.env.STORE_NAME || "Our Store"}" <${process.env.SMTP_MAIL}>`,
    to: email,
    subject: `Great news — ${productName} in size ${size} is available!`,
    html: buildAvailabilityEmailHtml({ name, productName, size }),
  });
}
