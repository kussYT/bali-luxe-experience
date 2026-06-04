import { isDatabaseConfigured } from "../db/pool.mjs";
import { listOrdersAdmin, findOrderById } from "../db/orders.mjs";

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
