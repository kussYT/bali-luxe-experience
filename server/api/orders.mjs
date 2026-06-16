import { isDatabaseConfigured } from "../db/pool.mjs";
import {
  listOrdersAdmin,
  findOrderById,
  markOrderShipped,
  exportOrdersCsv,
} from "../db/orders.mjs";
import { sendOrderShippedEmail } from "../emails/order-emails.mjs";

export async function getAdminOrdersResponse() {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for orders admin");
    err.status = 503;
    throw err;
  }
  const orders = await listOrdersAdmin();
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
