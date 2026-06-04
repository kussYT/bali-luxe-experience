import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORDERS_PATH = join(__root, "data", "orders.json");

async function readAll() {
  try {
    const raw = await readFile(ORDERS_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.orders) ? data.orders : [];
  } catch {
    return [];
  }
}

async function writeAll(orders) {
  await mkdir(join(__root, "data"), { recursive: true });
  await writeFile(ORDERS_PATH, JSON.stringify({ orders }, null, 2), "utf8");
}

export async function createPendingOrder({ items, currency, countryCode, customerEmail }) {
  const orders = await readAll();
  const order = {
    id: randomUUID(),
    status: "pending",
    currency,
    countryCode,
    customerEmail: customerEmail || null,
    items,
    stripeSessionId: null,
    createdAt: new Date().toISOString(),
    paidAt: null,
  };
  orders.unshift(order);
  await writeAll(orders);
  return order;
}

export async function attachStripeSession(orderId, stripeSessionId) {
  const orders = await readAll();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;
  orders[idx].stripeSessionId = stripeSessionId;
  await writeAll(orders);
  return orders[idx];
}

export async function findOrderBySessionId(stripeSessionId) {
  const orders = await readAll();
  return orders.find((o) => o.stripeSessionId === stripeSessionId) ?? null;
}

export async function findOrderById(orderId) {
  const orders = await readAll();
  return orders.find((o) => o.id === orderId) ?? null;
}

export async function markOrderPaid(orderId, { stripeSessionId, customerEmail, amountTotal, currency }) {
  const orders = await readAll();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;
  if (orders[idx].status === "paid") return orders[idx];

  orders[idx] = {
    ...orders[idx],
    status: "paid",
    stripeSessionId: stripeSessionId || orders[idx].stripeSessionId,
    customerEmail: customerEmail || orders[idx].customerEmail,
    amountTotal,
    currency: currency || orders[idx].currency,
    paidAt: new Date().toISOString(),
  };
  await writeAll(orders);
  return orders[idx];
}

export async function listOrders() {
  return readAll();
}
