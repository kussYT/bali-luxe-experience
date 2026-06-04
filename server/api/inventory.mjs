import { isDatabaseConfigured } from "../db/pool.mjs";
import { fetchInventoryGrid, setVariantInventoryQuantity } from "../db/inventory.mjs";

export async function getAdminInventoryResponse() {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for inventory admin");
    err.status = 503;
    throw err;
  }
  const grid = await fetchInventoryGrid();
  return { ...grid, source: "postgres" };
}

export async function patchAdminInventory(body) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for inventory writes");
    err.status = 503;
    throw err;
  }

  const variantId = body?.variantId;
  const warehouseId = body?.warehouseId;
  const quantity = body?.quantity;
  const note = typeof body?.note === "string" ? body.note : null;

  if (!variantId || !warehouseId || quantity === undefined) {
    const err = new Error("variantId, warehouseId, and quantity are required");
    err.status = 400;
    throw err;
  }

  const result = await setVariantInventoryQuantity({
    variantId,
    warehouseId,
    quantity,
    reason: "admin_adjustment",
    note,
  });

  return { ok: true, ...result };
}
