import { isDatabaseConfigured, query } from "../db/pool.mjs";
import {
  listOrdersAdmin,
  findOrderById,
  markOrderShipped,
  updateOrderStatus,
  exportOrdersCsv,
  createMarketplaceOrder,
  createManualInvoiceOrder,
  isManualInvoiceOrder,
  listAbandonedCheckouts,
  markRecoveryEmailSent,
  estimateOrderTotalCents,
  ORDER_CHANNELS,
} from "../db/orders.mjs";
import {
  sendOrderShippedEmail,
  sendOrderConfirmationEmail,
  sendPaymentInvoiceEmail,
  notifyOrderPaid,
} from "../emails/order-emails.mjs";
import { sendAbandonedCheckoutEmail } from "../emails/abandoned-checkout-email.mjs";
import {
  getAbandonedRecoverySettings,
  abandonedRecoveryEmailCopy,
} from "../db/abandoned-recovery.mjs";
import { siteUrl } from "../email.mjs";
import { shippingAmountForCountry } from "../shipping-rates.mjs";
import { toStripeAmount } from "../pricing.mjs";

export async function getAdminOrdersResponse({ channel } = {}) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for orders admin");
    err.status = 503;
    throw err;
  }
  const orders = await listOrdersAdmin(channel ? { channel } : {});
  return { orders, count: orders.length, source: "postgres" };
}

export async function getAdminOrderResponse(orderId) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for orders admin");
    err.status = 503;
    throw err;
  }
  const order = await findOrderById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }
  return { order, source: "postgres" };
}

function parseFulfillBody(body) {
  return {
    trackingNumber: typeof body.trackingNumber === "string" ? body.trackingNumber : undefined,
    trackingCarrier: typeof body.trackingCarrier === "string" ? body.trackingCarrier : undefined,
    trackingUrl: typeof body.trackingUrl === "string" ? body.trackingUrl : undefined,
    notifyCustomer: body.notifyCustomer === true,
  };
}

function maybeSendShippedEmail(_before, after, notifyCustomer) {
  if (!notifyCustomer) return;
  if (after.status !== "shipped") return;
  sendOrderShippedEmail(after).catch((e) => {
    console.error("[email] shipped notification failed:", e.message);
  });
}

export async function shipAdminOrder(orderId, body = {}) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for orders admin");
    err.status = 503;
    throw err;
  }

  const before = await findOrderById(orderId);
  if (!before) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  const { trackingNumber, trackingCarrier, trackingUrl, notifyCustomer } = parseFulfillBody(body);
  const order = await markOrderShipped(orderId, { trackingNumber, trackingCarrier, trackingUrl });
  maybeSendShippedEmail(before, order, notifyCustomer);

  return { order, source: "postgres" };
}

export async function patchAdminOrder(orderId, body) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for orders admin");
    err.status = 503;
    throw err;
  }

  if (!body || typeof body.status !== "string") {
    const err = new Error("status is required");
    err.status = 400;
    throw err;
  }

  const before = await findOrderById(orderId);
  if (!before) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  const refundRaw = body.refundAmountCents;
  const refundAmountCents =
    refundRaw === undefined || refundRaw === null || refundRaw === ""
      ? undefined
      : Number(refundRaw);

  if (refundAmountCents !== undefined && (!Number.isFinite(refundAmountCents) || refundAmountCents < 0)) {
    const err = new Error("refundAmountCents must be a non-negative number");
    err.status = 400;
    throw err;
  }

  const { trackingNumber, trackingCarrier, trackingUrl, notifyCustomer } = parseFulfillBody(body);

  const order = await updateOrderStatus(orderId, {
    status: body.status.trim(),
    trackingNumber,
    trackingCarrier,
    trackingUrl,
    refundAmountCents,
    notes: typeof body.notes === "string" ? body.notes : undefined,
  });

  maybeSendShippedEmail(before, order, notifyCustomer);

  return { order, source: "postgres" };
}

export async function getAdminOrdersCsv() {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for orders export");
    err.status = 503;
    throw err;
  }
  return exportOrdersCsv();
}

export async function postMarketplaceOrder(body) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for marketplace orders");
    err.status = 503;
    throw err;
  }

  const channel = typeof body.channel === "string" ? body.channel : "";
  if (!ORDER_CHANNELS.includes(channel) || channel === "website") {
    const err = new Error("channel must be wolf_badger, influencer, or other");
    err.status = 400;
    throw err;
  }

  const order = await createMarketplaceOrder({
    channel,
    externalRef: typeof body.externalRef === "string" ? body.externalRef.trim() : null,
    customerEmail: typeof body.customerEmail === "string" ? body.customerEmail.trim() : null,
    shippingCountryCode: typeof body.shippingCountryCode === "string" ? body.shippingCountryCode : "FR",
    currency: typeof body.currency === "string" ? body.currency : "EUR",
    items: body.items,
    notes: typeof body.notes === "string" ? body.notes.trim() : null,
  });

  notifyOrderPaid(order);

  return { order, source: "postgres" };
}

export async function postManualInvoiceOrder(body) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for invoice orders");
    err.status = 503;
    throw err;
  }

  const preview = await buildManualInvoicePreview(body);
  const sendEmailNow = body.sendEmail !== false;

  const order = await createManualInvoiceOrder({
    customerEmail: preview.customerEmail,
    shippingCountryCode: preview.shippingCountryCode,
    currency: preview.currency,
    items: preview.itemsForDb,
    notes: preview.notes,
    amountShipping: preview.amountShipping,
    amountSubtotal: preview.amountSubtotal,
    amountTotal: preview.amountTotal,
  });

  let emailResult = null;
  if (sendEmailNow) {
    emailResult = await sendPaymentInvoiceLink(order.id);
  }

  return {
    order: emailResult?.order || order,
    emailSent: Boolean(emailResult?.ok),
    email: emailResult?.email || null,
    paymentUrl: emailResult?.paymentUrl || null,
    preview,
    source: "postgres",
  };
}

export async function previewManualInvoiceOrder(body) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for invoice orders");
    err.status = 503;
    throw err;
  }
  const preview = await buildManualInvoicePreview(body);
  return { preview, source: "postgres" };
}

async function buildManualInvoicePreview(body) {
  const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";
  const shippingCountryCode =
    typeof body.shippingCountryCode === "string" ? body.shippingCountryCode.trim().toUpperCase() : "FR";
  const currency = typeof body.currency === "string" ? body.currency : "EUR";
  let notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (!customerEmail || !customerEmail.includes("@")) {
    const err = new Error("Email client requis");
    err.status = 400;
    throw err;
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    const err = new Error("Au moins un article est requis");
    err.status = 400;
    throw err;
  }

  const rawItems = body.items.map((item) => ({
    productSlug: String(item.productSlug || "").trim(),
    variantSlug: typeof item.variantSlug === "string" ? item.variantSlug.trim() || null : null,
    qty: Number(item.qty),
    unitPrice: Number(item.unitPrice),
  }));

  for (const item of rawItems) {
    if (!item.productSlug || !Number.isFinite(item.qty) || item.qty < 1) {
      const err = new Error("Chaque ligne doit avoir un produit et une quantité");
      err.status = 400;
      throw err;
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      const err = new Error(`Prix invalide pour ${item.productSlug}`);
      err.status = 400;
      throw err;
    }
  }

  const discountType =
    body.discountType === "percent" || body.discountType === "fixed" ? body.discountType : null;
  const discountValue = Number(body.discountValue) || 0;

  const grossSubtotal = rawItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  let discountCents = 0;
  if (discountType === "percent" && discountValue > 0) {
    discountCents = Math.min(grossSubtotal, Math.round((grossSubtotal * discountValue) / 100));
  } else if (discountType === "fixed" && discountValue > 0) {
    discountCents = Math.min(grossSubtotal, Math.round(discountValue));
  }

  // Distribute discount across lines so Stripe charges the discounted unit prices.
  let itemsForDb = rawItems;
  if (discountCents > 0 && grossSubtotal > 0) {
    let remaining = discountCents;
    itemsForDb = rawItems.map((item, index) => {
      const lineGross = item.unitPrice * item.qty;
      const share =
        index === rawItems.length - 1
          ? remaining
          : Math.round((discountCents * lineGross) / grossSubtotal);
      remaining -= share;
      const lineNet = Math.max(0, lineGross - share);
      const unitPrice = item.qty > 0 ? Math.round(lineNet / item.qty) : item.unitPrice;
      return { ...item, unitPrice };
    });
    const label =
      discountType === "percent"
        ? `[discount] -${discountValue}% (−${(discountCents / 100).toFixed(2)} €)`
        : `[discount] −${(discountCents / 100).toFixed(2)} €`;
    notes = notes ? `${notes}\n${label}` : label;
  }

  let amountShipping = 0;
  let shippingLabel = "";
  try {
    const shippingDisplay = await shippingAmountForCountry(shippingCountryCode, currency);
    amountShipping = toStripeAmount(shippingDisplay, currency);
    shippingLabel =
      currency === "IDR"
        ? `Rp ${shippingDisplay.toLocaleString("en-US")}`
        : currency === "USD"
          ? `$${Number(shippingDisplay).toFixed(2)}`
          : `€${Number(shippingDisplay).toFixed(2)}`;
  } catch (e) {
    const err = new Error(e.message || "Livraison non disponible pour ce pays");
    err.status = e.status || 400;
    throw err;
  }

  const amountSubtotal = itemsForDb.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const amountTotal = amountSubtotal + amountShipping;

  // Resolve display names without creating the order
  const lines = [];
  for (const item of itemsForDb) {
    const { rows: products } = await query(
      `SELECT p.name FROM products p WHERE p.slug = $1`,
      [item.productSlug],
    );
    if (!products.length) {
      const err = new Error(`Produit introuvable: ${item.productSlug}`);
      err.status = 404;
      throw err;
    }
    let variantTitle = null;
    if (item.variantSlug) {
      const { rows: variants } = await query(
        `SELECT v.title FROM product_variants v
         JOIN products p ON p.id = v.product_id
         WHERE p.slug = $1 AND v.slug = $2`,
        [item.productSlug, item.variantSlug],
      );
      variantTitle = variants[0]?.title || item.variantSlug;
    }
    lines.push({
      productSlug: item.productSlug,
      name: products[0].name,
      variantSlug: item.variantSlug,
      variantTitle,
      qty: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.qty,
    });
  }

  return {
    customerEmail,
    shippingCountryCode,
    currency,
    notes: notes || null,
    discountType,
    discountValue: discountCents > 0 ? discountValue : 0,
    discountCents,
    grossSubtotal,
    amountSubtotal,
    amountShipping,
    amountTotal,
    shippingLabel,
    lines,
    itemsForDb,
  };
}

export async function sendPaymentInvoiceLink(orderId) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for invoice orders");
    err.status = 503;
    throw err;
  }

  const order = await findOrderById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }
  if (order.status !== "pending") {
    const err = new Error("Cette commande n'est plus en attente de paiement");
    err.status = 400;
    throw err;
  }
  if (!isManualInvoiceOrder(order) && order.channel !== "website") {
    const err = new Error("Lien de paiement indisponible pour ce type de commande");
    err.status = 400;
    throw err;
  }
  if (!order.customerEmail?.trim()) {
    const err = new Error("Aucune adresse e-mail client");
    err.status = 400;
    throw err;
  }

  const paymentUrl = `${siteUrl()}/checkout/resume?order=${encodeURIComponent(orderId)}`;

  try {
    const result = await sendPaymentInvoiceEmail(order, { paymentUrl });
    if (result?.skipped) {
      const err = new Error(result.reason || "Email non envoyé");
      err.status = 400;
      throw err;
    }
    const updated = await markRecoveryEmailSent(orderId);
    return {
      ok: true,
      order: updated,
      email: order.customerEmail.trim(),
      paymentUrl,
      provider: result?.provider ?? "resend",
    };
  } catch (e) {
    console.error("[email] payment invoice failed:", e.message);
    const err = new Error(e.message || "Échec d'envoi Resend");
    err.status = e.status || 502;
    throw err;
  }
}

export async function resendAdminOrderConfirmation(orderId) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for orders admin");
    err.status = 503;
    throw err;
  }

  const order = await findOrderById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  if (!order.customerEmail?.trim()) {
    const err = new Error("Cette commande n'a pas d'adresse email client");
    err.status = 400;
    throw err;
  }

  try {
    const result = await sendOrderConfirmationEmail(order);
    if (result?.skipped) {
      const err = new Error(result.reason || "Email non envoyé");
      err.status = 400;
      throw err;
    }
    return { ok: true, order, email: order.customerEmail.trim(), provider: result?.provider ?? "resend" };
  } catch (e) {
    console.error("[email] resend confirmation failed:", e.message);
    const err = new Error(e.message || "Échec d'envoi Resend");
    err.status = e.status || 502;
    throw err;
  }
}

function enrichAbandonedCheckout(order) {
  const recoveryStatus = order.recoveryEmailSentAt ? "email_sent" : "not_recovered";
  const productSummary = order.items
    .map((i) => {
      const label =
        i.variantTitle && i.variantTitle !== "Default" ? `${i.name} (${i.variantTitle})` : i.name;
      return `${label} ×${i.qty}`;
    })
    .join(", ");
  return {
    ...order,
    estimatedTotalCents: estimateOrderTotalCents(order),
    recoveryStatus,
    productSummary,
  };
}

export async function getAdminAbandonedCheckoutsResponse({ minAgeHours } = {}) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for orders admin");
    err.status = 503;
    throw err;
  }
  const checkouts = await listAbandonedCheckouts({ minAgeHours });
  const enriched = checkouts.map(enrichAbandonedCheckout);
  return {
    checkouts: enriched,
    count: enriched.length,
    withEmail: enriched.filter((c) => c.customerEmail?.trim()).length,
    recoverySent: enriched.filter((c) => c.recoveryStatus === "email_sent").length,
    source: "postgres",
  };
}

export async function sendAbandonedCheckoutRecovery(orderId) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for orders admin");
    err.status = 503;
    throw err;
  }

  const order = await findOrderById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }
  if (order.status !== "pending") {
    const err = new Error("Cette commande n'est plus un panier abandonné");
    err.status = 400;
    throw err;
  }
  if (!order.customerEmail?.trim()) {
    const err = new Error("Aucune adresse e-mail — le client n'a pas saisi son e-mail au checkout");
    err.status = 400;
    throw err;
  }

  const resumeUrl = `${siteUrl()}/checkout/resume?order=${encodeURIComponent(orderId)}`;
  const recoverySettings = await getAbandonedRecoverySettings();

  try {
    const result = await sendAbandonedCheckoutEmail(order, {
      resumeUrl,
      promoCode: recoverySettings.promoCode || undefined,
      copy: abandonedRecoveryEmailCopy(recoverySettings),
    });
    if (result?.skipped) {
      const err = new Error(result.reason || "Email non envoyé");
      err.status = 400;
      throw err;
    }
    const updated = await markRecoveryEmailSent(orderId);
    return {
      ok: true,
      order: enrichAbandonedCheckout(updated),
      email: order.customerEmail.trim(),
      provider: result?.provider ?? "resend",
    };
  } catch (e) {
    console.error("[email] abandoned checkout recovery failed:", e.message);
    const err = new Error(e.message || "Échec d'envoi Resend");
    err.status = e.status || 502;
    throw err;
  }
}
