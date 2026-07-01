import { query, isDatabaseConfigured } from "./pool.mjs";

function mapRow(row) {
  return {
    id: row.id,
    code: row.code,
    label: row.label || "",
    discountType: row.discount_type,
    discountValue: row.discount_value,
    freeShipping: Boolean(row.free_shipping),
    maxUses: row.max_uses,
    usedCount: row.used_count,
    influencerName: row.influencer_name || "",
    active: Boolean(row.active),
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPromoCodes() {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required");
    err.status = 503;
    throw err;
  }
  const { rows } = await query(
    `SELECT * FROM promo_codes ORDER BY created_at DESC`,
  );
  return rows.map(mapRow);
}

export async function findPromoByCode(code) {
  if (!isDatabaseConfigured() || !code?.trim()) return null;
  const { rows } = await query(
    `SELECT * FROM promo_codes WHERE LOWER(code) = LOWER($1) LIMIT 1`,
    [code.trim()],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export function validatePromoRecord(promo) {
  if (!promo) {
    const err = new Error("Code promo invalide");
    err.status = 400;
    throw err;
  }
  if (!promo.active) {
    const err = new Error("Ce code promo n'est plus actif");
    err.status = 400;
    throw err;
  }
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    const err = new Error("Ce code promo a expiré");
    err.status = 400;
    throw err;
  }
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    const err = new Error("Ce code promo a atteint sa limite d'utilisation");
    err.status = 400;
    throw err;
  }
  return promo;
}

export async function validatePromoCode(code) {
  const promo = await findPromoByCode(code);
  return validatePromoRecord(promo);
}

export async function incrementPromoUsage(code, client = null) {
  const q = client?.query?.bind(client) || query;
  await q(
    `UPDATE promo_codes SET used_count = used_count + 1, updated_at = now() WHERE LOWER(code) = LOWER($1)`,
    [code],
  );
}

export async function createPromoCode(payload) {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required");
    err.status = 503;
    throw err;
  }
  const code = String(payload.code || "").trim().toUpperCase();
  if (!code) {
    const err = new Error("Code requis");
    err.status = 400;
    throw err;
  }
  const discountType = payload.discountType || "percent";
  if (!["percent", "fixed", "free"].includes(discountType)) {
    const err = new Error("Type de réduction invalide");
    err.status = 400;
    throw err;
  }
  const { rows } = await query(
    `INSERT INTO promo_codes (
       code, label, discount_type, discount_value, free_shipping,
       max_uses, influencer_name, active, expires_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      code,
      payload.label || "",
      discountType,
      Number(payload.discountValue) || 0,
      Boolean(payload.freeShipping),
      payload.maxUses != null ? Number(payload.maxUses) : null,
      payload.influencerName || null,
      payload.active !== false,
      payload.expiresAt || null,
    ],
  );
  return mapRow(rows[0]);
}

export async function updatePromoCode(id, patch) {
  const { rows } = await query(
    `UPDATE promo_codes SET
       label = COALESCE($2, label),
       discount_type = COALESCE($3, discount_type),
       discount_value = COALESCE($4, discount_value),
       free_shipping = COALESCE($5, free_shipping),
       max_uses = COALESCE($6, max_uses),
       influencer_name = COALESCE($7, influencer_name),
       active = COALESCE($8, active),
       expires_at = COALESCE($9, expires_at),
       updated_at = now()
     WHERE id = $1::uuid
     RETURNING *`,
    [
      id,
      patch.label ?? null,
      patch.discountType ?? null,
      patch.discountValue != null ? Number(patch.discountValue) : null,
      patch.freeShipping != null ? Boolean(patch.freeShipping) : null,
      patch.maxUses !== undefined ? (patch.maxUses == null ? null : Number(patch.maxUses)) : null,
      patch.influencerName ?? null,
      patch.active != null ? Boolean(patch.active) : null,
      patch.expiresAt !== undefined ? patch.expiresAt : null,
    ],
  );
  if (!rows.length) {
    const err = new Error("Promo not found");
    err.status = 404;
    throw err;
  }
  return mapRow(rows[0]);
}

export async function deletePromoCode(id) {
  await query(`DELETE FROM promo_codes WHERE id = $1::uuid`, [id]);
}
