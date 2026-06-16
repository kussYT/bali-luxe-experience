import { withTransaction, query, isDatabaseConfigured } from "./pool.mjs";

const WAREHOUSES = ["france", "bali"];

export async function fetchInventoryGrid() {
  if (!isDatabaseConfigured()) {
    const err = new Error("Database not configured");
    err.status = 503;
    throw err;
  }

  const { rows } = await query(
    `
    SELECT
      p.id AS product_id,
      p.slug AS product_slug,
      p.name AS product_name,
      p.status,
      p.origin,
      p.default_warehouse,
      v.id AS variant_id,
      v.slug AS variant_slug,
      v.title AS variant_title,
      v.sku,
      v.is_default,
      COALESCE(fr.quantity, 0) AS france_qty,
      COALESCE(fr.reserved, 0) AS france_reserved,
      COALESCE(ba.quantity, 0) AS bali_qty,
      COALESCE(ba.reserved, 0) AS bali_reserved
    FROM products p
    JOIN product_variants v ON v.product_id = p.id
    LEFT JOIN product_inventory fr ON fr.variant_id = v.id AND fr.warehouse_id = 'france'
    LEFT JOIN product_inventory ba ON ba.variant_id = v.id AND ba.warehouse_id = 'bali'
    ORDER BY p.name ASC, v.position ASC, v.title ASC
    `,
  );

  const totals = { france: 0, bali: 0 };
  const lowStock = [];

  const items = rows.map((r) => {
    const franceAvailable = Math.max(0, r.france_qty - r.france_reserved);
    const baliAvailable = Math.max(0, r.bali_qty - r.bali_reserved);
    totals.france += franceAvailable;
    totals.bali += baliAvailable;

    if (franceAvailable <= 3 || baliAvailable <= 3) {
      lowStock.push({
        productSlug: r.product_slug,
        productName: r.product_name,
        variantTitle: r.variant_title,
        franceAvailable,
        baliAvailable,
      });
    }

    return {
      productId: r.product_id,
      productSlug: r.product_slug,
      productName: r.product_name,
      status: r.status,
      origin: r.origin,
      defaultWarehouse: r.default_warehouse,
      variantId: r.variant_id,
      variantSlug: r.variant_slug,
      variantTitle: r.variant_title,
      sku: r.sku || undefined,
      isDefault: r.is_default,
      france: r.france_qty,
      bali: r.bali_qty,
      franceReserved: r.france_reserved,
      baliReserved: r.bali_reserved,
      franceAvailable,
      baliAvailable,
    };
  });

  return { items, totals, lowStock, lowStockCount: lowStock.length };
}

/**
 * Set absolute quantity for variant × warehouse; records inventory_movements.
 */
export async function setVariantInventoryQuantity({
  variantId,
  warehouseId,
  quantity,
  reason = "adjustment",
  note = null,
  referenceId = null,
}) {
  if (!WAREHOUSES.includes(warehouseId)) {
    const err = new Error("Invalid warehouse_id");
    err.status = 400;
    throw err;
  }
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 0) {
    const err = new Error("quantity must be a non-negative number");
    err.status = 400;
    throw err;
  }

  return withTransaction(async (client) => {
    const { rows: vrows } = await client.query(`SELECT id FROM product_variants WHERE id = $1`, [variantId]);
    if (vrows.length === 0) {
      const err = new Error("Variant not found");
      err.status = 404;
      throw err;
    }

    const { rows: prevRows } = await client.query(
      `SELECT quantity FROM product_inventory WHERE variant_id = $1 AND warehouse_id = $2`,
      [variantId, warehouseId],
    );
    const previous = prevRows[0]?.quantity ?? 0;
    const delta = qty - previous;

    await client.query(
      `INSERT INTO product_inventory (variant_id, warehouse_id, quantity, reserved)
       VALUES ($1, $2, $3, 0)
       ON CONFLICT (variant_id, warehouse_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now()`,
      [variantId, warehouseId, qty],
    );

    if (delta !== 0) {
      await client.query(
        `INSERT INTO inventory_movements (variant_id, warehouse_id, delta, reason, note, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [variantId, warehouseId, delta, reason, note, referenceId],
      );
    }

    return { variantId, warehouseId, previous, quantity: qty, delta };
  });
}
