import { isDatabaseConfigured } from "../db/pool.mjs";
import {
  listOrdersAdmin,
  findOrderById,
  markOrderShipped,
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

export async function shipAdminOrder(orderId) {
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

  const order = await markOrderShipped(orderId);

  if (before.status !== "shipped") {
    sendOrderShippedEmail(order).catch((e) => {
      console.error("[email] shipped notification failed:", e.message);
    });
  }

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
