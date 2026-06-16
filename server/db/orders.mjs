import { randomUUID } from "node:crypto";
import { query, withTransaction, isDatabaseConfigured } from "./pool.mjs";
import { decrementInventoryForSale } from "./fulfillment.mjs";
import { getDefaultVariant } from "../warehouse-allocation.mjs";

function mapOrderRow(row, items = []) {
  return {
    id: row.id,
    status: row.status,
    currency: row.currency,
    countryCode: row.country_code || null,
    shippingCountryCode: row.shipping_country_code || null,
    fulfillmentWarehouse: row.fulfillment_warehouse || null,
    customerEmail: row.customer_email || null,
    stripeSessionId: row.stripe_session_id || null,
    stripePaymentIntentId: row.stripe_payment_intent_id || null,
    amountSubtotal: row.amount_subtotal ?? null,
    amountShipping: row.amount_shipping ?? null,
    amountTotal: row.amount_total ?? null,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    shippedAt: row.shipped_at ? new Date(row.shipped_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    items,
  };
}

function mapItemRow(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id || null,
    variantId: row.variant_id || null,
    slug: row.product_slug,
    name: row.product_name,
    variantTitle: row.variant_title || null,
    qty: row.qty,
    unitPrice: row.unit_price,
    warehouseId: row.warehouse_id,
    image: row.image_url || null,
  };
}

async function loadItemsForOrders(orderIds, client = null) {
  if (orderIds.length === 0) return new Map();
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `SELECT * FROM order_items WHERE order_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
    [orderIds],
  );
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.order_id)) map.set(row.order_id, []);
    map.get(row.order_id).push(mapItemRow(row));
  }
  return map;
}

export async function createPendingOrder({
  items,
  currency,
  countryCode,
  customerEmail,
}) {
  if (!isDatabaseConfigured()) {
    const err = new Error("Database not configured");
    err.status = 503;
    throw err;
  }

  const orderId = randomUUID();
  const fulfillmentWarehouse = items[0]?.warehouseId || null;

  return withTransaction(async (client) => {
    await client.query(
      `INSERT INTO orders (id, status, currency, country_code, fulfillment_warehouse, customer_email)
       VALUES ($1, 'pending', $2, $3, $4, $5)`,
      [orderId, currency, countryCode || null, fulfillmentWarehouse, customerEmail || null],
    );

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (
           order_id, product_id, variant_id, product_slug, product_name, variant_title,
           qty, unit_price, warehouse_id, image_url
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          orderId,
          item.productId || null,
          item.variantId || null,
          item.slug,
          item.name,
          item.variantTitle || null,
          item.qty,
          item.unitPrice,
          item.warehouseId,
          item.image || null,
        ],
      );
    }

    return findOrderById(orderId, client);
  });
}

export async function attachStripeSession(orderId, stripeSessionId) {
  const { rows } = await query(
    `UPDATE orders SET stripe_session_id = $2, updated_at = now()
     WHERE id = $1
     RETURNING id`,
    [orderId, stripeSessionId],
  );
  if (rows.length === 0) return null;
  return findOrderById(orderId);
}

export async function findOrderById(orderId, client = null) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  if (rows.length === 0) return null;
  const itemsMap = await loadItemsForOrders([orderId], client);
  return mapOrderRow(rows[0], itemsMap.get(orderId) || []);
}

export async function findOrderBySessionId(stripeSessionId) {
  const { rows } = await query(`SELECT * FROM orders WHERE stripe_session_id = $1`, [stripeSessionId]);
  if (rows.length === 0) return null;
  const itemsMap = await loadItemsForOrders([rows[0].id]);
  return mapOrderRow(rows[0], itemsMap.get(rows[0].id) || []);
}

/**
 * Mark order paid + decrement inventory (idempotent).
 */
export async function fulfillOrderPayment({
  orderId,
  stripeSessionId,
  stripePaymentIntentId,
  stripeEventId,
  customerEmail,
  amountTotal,
  amountSubtotal,
  amountShipping,
  currency,
  shippingCountryCode,
}) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(`SELECT * FROM orders WHERE id = $1 FOR UPDATE`, [orderId]);
    if (rows.length === 0) {
      const err = new Error(`Order not found: ${orderId}`);
      err.status = 404;
      throw err;
    }

    const order = rows[0];
    if (order.status === "paid") {
      const itemsMap = await loadItemsForOrders([orderId], client);
      return mapOrderRow(order, itemsMap.get(orderId) || []);
    }

    if (stripeEventId) {
      const dup = await client.query(`SELECT id FROM orders WHERE stripe_event_id = $1`, [stripeEventId]);
      if (dup.rows.length > 0 && dup.rows[0].id !== orderId) {
        const dupId = dup.rows[0].id;
        const itemsMap = await loadItemsForOrders([dupId], client);
        const existing = await client.query(`SELECT * FROM orders WHERE id = $1`, [dupId]);
        return mapOrderRow(existing.rows[0], itemsMap.get(dupId) || []);
      }
    }

    const { rows: itemRows } = await client.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [orderId],
    );

    for (const item of itemRows) {
      if (!item.variant_id || !item.warehouse_id) {
        const err = new Error(`Order item missing variant or warehouse: ${item.product_slug}`);
        err.status = 500;
        throw err;
      }
      await decrementInventoryForSale(client, {
        variantId: item.variant_id,
        warehouseId: item.warehouse_id,
        qty: item.qty,
        orderId,
      });
    }

    const shipCountry = shippingCountryCode || order.country_code;
    const fulfillmentWarehouse = order.fulfillment_warehouse || itemRows[0]?.warehouse_id || null;

    await client.query(
      `UPDATE orders SET
         status = 'paid',
         stripe_session_id = COALESCE($2, stripe_session_id),
         stripe_payment_intent_id = COALESCE($3, stripe_payment_intent_id),
         stripe_event_id = COALESCE($4, stripe_event_id),
         customer_email = COALESCE($5, customer_email),
         amount_total = COALESCE($6, amount_total),
         amount_subtotal = COALESCE($7, amount_subtotal),
         amount_shipping = COALESCE($8, amount_shipping),
         currency = COALESCE($9, currency),
         shipping_country_code = COALESCE($10, shipping_country_code),
         fulfillment_warehouse = COALESCE($11, fulfillment_warehouse),
         paid_at = now(),
         updated_at = now()
       WHERE id = $1`,
      [
        orderId,
        stripeSessionId,
        stripePaymentIntentId,
        stripeEventId,
        customerEmail,
        amountTotal,
        amountSubtotal,
        amountShipping,
        currency,
        shipCountry,
        fulfillmentWarehouse,
      ],
    );

    const { rows: updated } = await client.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    const items = itemRows.map(mapItemRow);
    return mapOrderRow(updated[0], items);
  });
}

export async function listOrders({ limit = 100 } = {}) {
  const { rows } = await query(
    `SELECT * FROM orders ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  const ids = rows.map((r) => r.id);
  const itemsMap = await loadItemsForOrders(ids);
  return rows.map((r) => mapOrderRow(r, itemsMap.get(r.id) || []));
}

export async function listOrdersAdmin() {
  return listOrders({ limit: 200 });
}

export async function markOrderShipped(orderId) {
  if (!isDatabaseConfigured()) {
    const err = new Error("Database not configured");
    err.status = 503;
    throw err;
  }

  const { rows } = await query(
    `UPDATE orders SET status = 'shipped', shipped_at = now(), updated_at = now()
     WHERE id = $1 AND status IN ('paid', 'shipped')
     RETURNING id`,
    [orderId],
  );

  if (rows.length === 0) {
    const existing = await findOrderById(orderId);
    if (!existing) {
      const err = new Error("Order not found");
      err.status = 404;
      throw err;
    }
    const err = new Error("Only paid orders can be marked as shipped");
    err.status = 409;
    throw err;
  }

  return findOrderById(orderId);
}

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportOrdersCsv() {
  const orders = await listOrdersAdmin();
  const headers = [
    "id",
    "status",
    "created_at",
    "paid_at",
    "shipped_at",
    "customer_email",
    "currency",
    "amount_total",
    "shipping_country",
    "fulfillment_warehouse",
    "items",
  ];

  const lines = [headers.join(",")];
  for (const order of orders) {
    const itemsSummary = order.items
      .map((i) => {
        const label = i.variantTitle && i.variantTitle !== "Default"
          ? `${i.name} (${i.variantTitle})`
          : i.name;
        return `${label} x${i.qty}`;
      })
      .join("; ");

    lines.push(
      [
        order.id,
        order.status,
        order.createdAt,
        order.paidAt || "",
        order.shippedAt || "",
        order.customerEmail || "",
        order.currency,
        order.amountTotal ?? "",
        order.shippingCountryCode || order.countryCode || "",
        order.fulfillmentWarehouse || "",
        itemsSummary,
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  return lines.join("\n");
}

/** Resolve catalog line to DB-backed order item fields */
export function buildOrderItemFromCartLine({ product, variant, qty, fulfillmentWarehouse, unitPriceAmount }) {
  const resolved = variant || getDefaultVariant(product);
  return {
    productId: product.id || null,
    variantId: resolved?.id || null,
    slug: product.slug,
    name: product.name,
    variantTitle: resolved?.title || "Default",
    qty,
    unitPrice: unitPriceAmount,
    warehouseId: fulfillmentWarehouse || "bali",
    image: product.image,
  };
}
