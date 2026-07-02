import { isDatabaseConfigured } from "../db/pool.mjs";
import {
  listOrdersAdmin,
  findOrderById,
  markOrderShipped,
  updateOrderStatus,
  exportOrdersCsv,
  createMarketplaceOrder,
  ORDER_CHANNELS,
} from "../db/orders.mjs";
import { sendOrderShippedEmail, sendOrderConfirmationEmail } from "../emails/order-emails.mjs";
import { sendAbandonedCheckoutEmail } from "../emails/abandoned-checkout-email.mjs";
import {
  listAbandonedCheckouts,
  markRecoveryEmailSent,
  estimateOrderTotalCents,
} from "../db/orders.mjs";
import { siteUrl } from "../email.mjs";

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

  sendOrderConfirmationEmail(order).catch((e) => {
    console.error("[email] marketplace confirmation failed:", e.message);
  });

  return { order, source: "postgres" };
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

  try {
    const result = await sendAbandonedCheckoutEmail(order, { resumeUrl });
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
