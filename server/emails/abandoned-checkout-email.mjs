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
      const label =
        item.variantTitle && item.variantTitle !== "Default"
          ? `${item.name} — ${item.variantTitle}`
          : item.name;
      const lineCents =
        currency === "IDR" ? item.unitPrice * item.qty : item.unitPrice * item.qty * 100;
      const lineTotal = formatMoneyEmail(lineCents, currency);
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${label} × ${item.qty}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${lineTotal}</td>
      </tr>`;
    })
    .join("");
}

export async function sendAbandonedCheckoutEmail(order, { resumeUrl, promoCode }) {
  const email = order.customerEmail?.trim();
  if (!email) return { skipped: true, reason: "no customer email" };

  const currency = order.currency || "EUR";
  const totalCents =
    order.amountTotal ??
    (currency === "IDR"
      ? order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0)
      : order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0) * 100);
  const total = formatMoneyEmail(totalCents, currency);

  const promoBlock = promoCode?.trim()
    ? `<p style="margin:20px 0;padding:14px 18px;background:#f5f0e8;border:1px solid #e8e0d4;text-align:center;">
        <span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8278;">Offre exclusive</span><br/>
        <strong style="font-size:18px;letter-spacing:0.08em;">${promoCode.trim()}</strong>
      </p>`
    : "";

  const body = `
    <p>Vous aviez commencé une commande sur Bingin Diaries — votre sélection vous attend encore.</p>
    ${promoBlock}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;font-size:14px;">
      ${itemsHtml(order.items, currency)}
    </table>
    <p style="text-align:right;font-size:16px;margin-top:8px;"><strong>Total estimé : ${total}</strong></p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${resumeUrl}" style="display:inline-block;background:#1a1a1a;color:#f5f0e8;text-decoration:none;padding:14px 28px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;">
        Finaliser ma commande
      </a>
    </p>
    <p style="font-size:13px;color:#8a8278;margin-top:24px;">
      Ce lien est valable 30 jours. Si vous avez des questions, répondez simplement à cet e-mail.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: "Votre panier vous attend — Bingin Diaries",
    html: layout({ title: "Votre panier vous attend", body }),
  });
}
