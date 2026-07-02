import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { isDatabaseConfigured } from "./db/pool.mjs";
import { getProjectRoot } from "./runtime-root.mjs";
import * as dbOrders from "./db/orders.mjs";

function getOrdersPath() {
  const root = getProjectRoot();
  return root ? join(root, "data", "orders.json") : null;
}

async function getDbOrders() {
  return dbOrders;
}

async function readAllJson() {
  const ordersPath = getOrdersPath();
  if (!ordersPath) return [];
  try {
    const raw = await readFile(ordersPath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.orders) ? data.orders : [];
  } catch {
    return [];
  }
}

async function writeAllJson(orders) {
  const ordersPath = getOrdersPath();
  if (!ordersPath) {
    const err = new Error("Order file storage is not available in this runtime");
    err.status = 503;
    throw err;
  }
  await mkdir(join(getProjectRoot(), "data"), { recursive: true });
  await writeFile(ordersPath, JSON.stringify({ orders }, null, 2), "utf8");
}

export async function createPendingOrder(payload) {
  if (isDatabaseConfigured()) {
    const db = await getDbOrders();
    return db.createPendingOrder(payload);
  }

  const orders = await readAllJson();
  const order = {
    id: randomUUID(),
    status: "pending",
    currency: payload.currency,
    countryCode: payload.countryCode,
    shippingCountryCode: null,
    fulfillmentWarehouse: payload.items[0]?.warehouseId || null,
    customerEmail: payload.customerEmail || null,
    items: payload.items.map((i) => ({
      slug: i.slug,
      name: i.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
      image: i.image,
      warehouseId: i.warehouseId,
      variantId: i.variantId,
    })),
    stripeSessionId: null,
    createdAt: new Date().toISOString(),
    paidAt: null,
  };
  orders.unshift(order);
  await writeAllJson(orders);
  return order;
}

export async function attachStripeSession(orderId, stripeSessionId) {
  if (isDatabaseConfigured()) {
    const db = await getDbOrders();
    return db.attachStripeSession(orderId, stripeSessionId);
  }
  const orders = await readAllJson();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;
  orders[idx].stripeSessionId = stripeSessionId;
  await writeAllJson(orders);
  return orders[idx];
}

export async function findOrderBySessionId(stripeSessionId) {
  if (isDatabaseConfigured()) {
    const db = await getDbOrders();
    return db.findOrderBySessionId(stripeSessionId);
  }
  const orders = await readAllJson();
  return orders.find((o) => o.stripeSessionId === stripeSessionId) ?? null;
}

export async function findOrderById(orderId) {
  if (isDatabaseConfigured()) {
    const db = await getDbOrders();
    return db.findOrderById(orderId);
  }
  const orders = await readAllJson();
  return orders.find((o) => o.id === orderId) ?? null;
}

export async function markOrderPaid(orderId, paymentMeta) {
  if (isDatabaseConfigured()) {
    const db = await getDbOrders();
    return db.fulfillOrderPayment({
      orderId,
      stripeSessionId: paymentMeta.stripeSessionId,
      stripePaymentIntentId: paymentMeta.stripePaymentIntentId,
      stripeEventId: paymentMeta.stripeEventId,
      customerEmail: paymentMeta.customerEmail,
      amountTotal: paymentMeta.amountTotal,
      amountSubtotal: paymentMeta.amountSubtotal,
      amountShipping: paymentMeta.amountShipping,
      currency: paymentMeta.currency,
      shippingCountryCode: paymentMeta.shippingCountryCode,
      promoCode: paymentMeta.promoCode,
    });
  }

  const orders = await readAllJson();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;
  if (orders[idx].status === "paid") return orders[idx];

  orders[idx] = {
    ...orders[idx],
    status: "paid",
    stripeSessionId: paymentMeta.stripeSessionId || orders[idx].stripeSessionId,
    customerEmail: paymentMeta.customerEmail || orders[idx].customerEmail,
    amountTotal: paymentMeta.amountTotal,
    currency: paymentMeta.currency || orders[idx].currency,
    shippingCountryCode: paymentMeta.shippingCountryCode || null,
    paidAt: new Date().toISOString(),
  };
  await writeAllJson(orders);
  return orders[idx];
}

export async function listOrders() {
  if (isDatabaseConfigured()) {
    const db = await getDbOrders();
    return db.listOrders();
  }
  return readAllJson();
}
