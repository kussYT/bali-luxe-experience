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
    const err = new Error("channel must be wolf_badger or other");
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
