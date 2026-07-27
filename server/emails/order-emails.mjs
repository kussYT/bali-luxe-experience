import { sendEmail, formatMoneyEmail, siteUrl, opsInbox } from "../email.mjs";

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

function channelLabel(channel) {
  if (channel === "wolf_badger") return "Wolf & Badger";
  if (channel === "influencer") return "Influenceur";
  if (channel === "other") return "Marketplace";
  return "Site web";
}

/** Alert the ops inbox when a new order is paid (team notification). */
export async function sendNewOrderAlertEmail(order) {
  const currency = order.currency || "EUR";
  const total = formatMoneyEmail(order.amountTotal, currency);
  const adminUrl = `${siteUrl()}/admin/orders/${encodeURIComponent(order.id)}`;
  const channel = channelLabel(order.channel || "website");
  const customer = order.customerEmail?.trim() || "—";
  const country = (order.shippingCountryCode || order.countryCode || "—").toUpperCase();
  const promo = order.promoCode?.trim();

  const body = `
    <p>Nouvelle commande payée sur Bingin Diaries.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;">
      <tr><td style="padding:6px 0;color:#8a8278;">Canal</td><td style="padding:6px 0;text-align:right;"><strong>${channel}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#8a8278;">Client</td><td style="padding:6px 0;text-align:right;">${customer}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8278;">Pays</td><td style="padding:6px 0;text-align:right;">${country}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8278;">Total</td><td style="padding:6px 0;text-align:right;"><strong>${total}</strong></td></tr>
      ${promo ? `<tr><td style="padding:6px 0;color:#8a8278;">Code promo</td><td style="padding:6px 0;text-align:right;font-family:monospace;">${promo}</td></tr>` : ""}
      <tr><td style="padding:6px 0;color:#8a8278;">Réf.</td><td style="padding:6px 0;text-align:right;font-family:monospace;font-size:12px;">${order.id.slice(0, 8)}…</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;font-size:14px;">
      ${itemsHtml(order.items || [], currency)}
    </table>
    <p style="margin-top:24px;">
      <a href="${adminUrl}" style="display:inline-block;padding:12px 20px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:13px;letter-spacing:0.06em;">Voir dans l'admin</a>
    </p>
  `;

  return sendEmail({
    to: opsInbox(),
    subject: `[Commande] ${total} — ${customer}`,
    html: layout({ title: "Nouvelle commande", body }),
  });
}

export function notifyOrderPaid(order) {
  sendOrderConfirmationEmail(order).catch((e) => {
    console.error("[email] order confirmation failed:", e.message);
  });
  sendNewOrderAlertEmail(order).catch((e) => {
    console.error("[email] order alert failed:", e.message);
  });
}

/** Email the customer a payment link for a manual (admin-created) invoice order. */
export async function sendPaymentInvoiceEmail(order, { paymentUrl }) {
  const email = order.customerEmail?.trim();
  if (!email) return { skipped: true, reason: "no customer email" };
  if (!paymentUrl) return { skipped: true, reason: "no payment url" };

  const currency = order.currency || "EUR";
  const total = formatMoneyEmail(order.amountTotal, currency);
  const shipping =
    order.amountShipping != null ? formatMoneyEmail(order.amountShipping, currency) : null;

  const body = `
    <p>Here is a summary of your Bingin Diaries order.</p>
    <p>Click the button below to pay securely by card (Stripe).</p>
    <p style="font-size:12px;color:#8a8278;">Order <span style="font-family:monospace;">${order.id.slice(0, 8)}…</span></p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;font-size:14px;">
      ${itemsHtml(order.items || [], currency)}
    </table>
    ${shipping ? `<p style="text-align:right;font-size:14px;">Shipping : ${shipping}</p>` : ""}
    <p style="text-align:right;font-size:16px;margin-top:8px;"><strong>Total : ${total}</strong></p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${paymentUrl}" style="display:inline-block;background:#1a1a1a;color:#f5f0e8;text-decoration:none;padding:14px 28px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;">
        Complete your purchase
      </a>
    </p>
    <p style="font-size:12px;color:#8a8278;word-break:break-all;margin-top:8px;">
      If the button does not work, open this link:<br/>
      <a href="${paymentUrl}" style="color:#1a1a1a;">${paymentUrl}</a>
    </p>
    <p style="font-size:13px;color:#8a8278;margin-top:24px;">
      This link is valid for 30 days. Once payment is received, you will get a confirmation email.
      For any question, just reply to this email.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `Complete your purchase — Bingin Diaries (${total})`,
    html: layout({ title: "Complete your purchase", body }),
  });
}

export async function sendOrderShippedEmail(order) {
  const email = order.customerEmail?.trim();
  if (!email) return { skipped: true, reason: "no customer email" };

  const tracking = order.trackingNumber?.trim();
  const carrier = order.trackingCarrier?.trim();
  const trackingUrl = order.trackingUrl?.trim();

  let trackingBlock = "";
  if (tracking) {
    const carrierLabel = carrier ? `${carrier} — ` : "";
    const link = trackingUrl
      ? `<a href="${trackingUrl}" style="color:#1a1a1a;">${carrierLabel}${tracking}</a>`
      : `${carrierLabel}${tracking}`;
    trackingBlock = `
      <p style="margin-top:20px;padding:16px;background:#f5f0e8;border:1px solid #e8e0d4;font-size:14px;">
        <strong>Numéro de suivi :</strong><br>${link}
      </p>`;
  }

  const body = `
    <p>Bonne nouvelle — votre commande est en cours d'acheminement.</p>
    <p style="font-size:12px;color:#8a8278;">Commande <span style="font-family:monospace;">${order.id.slice(0, 8)}…</span></p>
    ${trackingBlock}
    <ul style="padding-left:18px;font-size:14px;margin-top:20px;">
      ${order.items.map((i) => {
        const label = i.variantTitle && i.variantTitle !== "Default"
          ? `${i.name} — ${i.variantTitle}`
          : i.name;
        return `<li>${label} × ${i.qty}</li>`;
      }).join("")}
    </ul>
    <p style="font-size:13px;color:#8a8278;margin-top:24px;">Merci de soutenir Bingin Diaries.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Votre commande est en route — Bingin Diaries`,
    html: layout({ title: "Commande expédiée", body }),
  });
}
