import { sendEmail, formatMoneyEmail, siteUrl } from "../email.mjs";

function layout({ title, body }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border:1px solid #e8e0d4;">
        <tr><td style="padding:32px 28px 8px;text-align:center;">
          <p style="margin:0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8a8278;">Bingin Diaries</p>
          <h1 style="margin:12px 0 0;font-size:26px;font-weight:normal;">${title}</h1>
        </td></tr>
        <tr><td style="padding:8px 28px 32px;font-size:15px;line-height:1.6;color:#3d3d3d;">
          ${body}
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid #e8e0d4;font-size:11px;color:#8a8278;text-align:center;">
          Bali &amp; France · <a href="${siteUrl()}" style="color:#8a8278;">bingindiaries.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemsHtml(items, currency) {
  return items
    .map((item) => {
      const label = item.variantTitle && item.variantTitle !== "Default"
        ? `${item.name} — ${item.variantTitle}`
        : item.name;
      const lineTotal = formatMoneyEmail(item.unitPrice * item.qty, currency);
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${label} × ${item.qty}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${lineTotal}</td>
      </tr>`;
    })
    .join("");
}

export async function sendOrderConfirmationEmail(order) {
  const email = order.customerEmail?.trim();
  if (!email) return { skipped: true, reason: "no customer email" };

  const currency = order.currency || "EUR";
  const total = formatMoneyEmail(order.amountTotal, currency);
  const shipping = order.amountShipping != null ? formatMoneyEmail(order.amountShipping, currency) : null;

  const body = `
    <p>Thank you for your order. We are preparing your pieces with care.</p>
    <p style="font-size:12px;color:#8a8278;">Order <span style="font-family:monospace;">${order.id.slice(0, 8)}…</span></p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;font-size:14px;">
      ${itemsHtml(order.items, currency)}
    </table>
    ${shipping ? `<p style="text-align:right;font-size:14px;">Shipping: ${shipping}</p>` : ""}
    <p style="text-align:right;font-size:16px;margin-top:8px;"><strong>Total: ${total}</strong></p>
    <p style="font-size:13px;color:#8a8278;margin-top:24px;">You will receive another email when your order ships.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Order confirmed — Bingin Diaries`,
    html: layout({ title: "Order confirmed", body }),
  });
}

export async function sendOrderShippedEmail(order) {
  const email = order.customerEmail?.trim();
  if (!email) return { skipped: true, reason: "no customer email" };

  const body = `
    <p>Your order is on its way.</p>
    <p style="font-size:12px;color:#8a8278;">Order <span style="font-family:monospace;">${order.id.slice(0, 8)}…</span></p>
    <ul style="padding-left:18px;font-size:14px;">
      ${order.items.map((i) => {
        const label = i.variantTitle && i.variantTitle !== "Default"
          ? `${i.name} — ${i.variantTitle}`
          : i.name;
        return `<li>${label} × ${i.qty}</li>`;
      }).join("")}
    </ul>
    <p style="font-size:13px;color:#8a8278;margin-top:24px;">Thank you for supporting slow fashion between Bali and France.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Your order has shipped — Bingin Diaries`,
    html: layout({ title: "Your order has shipped", body }),
  });
}
