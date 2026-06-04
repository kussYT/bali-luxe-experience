/**
 * Decrement variant stock after a paid order. Records inventory_movements (reason: sale).
 * @param {import('pg').PoolClient} client
 */
export async function decrementInventoryForSale(client, { variantId, warehouseId, qty, orderId }) {
  const amount = Number(qty);
  if (!Number.isFinite(amount) || amount < 1) {
    const err = new Error("Invalid sale quantity");
    err.status = 400;
    throw err;
  }

  const { rows } = await client.query(
    `SELECT quantity FROM product_inventory
     WHERE variant_id = $1 AND warehouse_id = $2
     FOR UPDATE`,
    [variantId, warehouseId],
  );

  if (rows.length === 0) {
    const err = new Error(`No inventory row for variant ${variantId} @ ${warehouseId}`);
    err.status = 409;
    throw err;
  }

  const current = rows[0].quantity;
  if (current < amount) {
    const err = new Error(`Insufficient stock (${current} < ${amount})`);
    err.status = 409;
    throw err;
  }

  const next = current - amount;
  await client.query(
    `UPDATE product_inventory
     SET quantity = $1, updated_at = now()
     WHERE variant_id = $2 AND warehouse_id = $3`,
    [next, variantId, warehouseId],
  );

  await client.query(
    `INSERT INTO inventory_movements (variant_id, warehouse_id, delta, reason, reference_id, note)
     VALUES ($1, $2, $3, 'sale', $4, $5)`,
    [variantId, warehouseId, -amount, orderId, `Order ${orderId}`],
  );

  return { variantId, warehouseId, previous: current, quantity: next, delta: -amount };
}
