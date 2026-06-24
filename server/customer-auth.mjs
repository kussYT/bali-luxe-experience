import crypto from "node:crypto";
import { query, isDatabaseConfigured } from "./db/pool.mjs";
import { parseCookies } from "./admin-auth.mjs";

const COOKIE_NAME = "bd_customer_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;
const MAGIC_MAX_AGE_SEC = 60 * 60;

function getSecret() {
  const secret = process.env.ADMIN_SECRET || process.env.CUSTOMER_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET is not configured");
  return secret;
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createCustomerSessionToken(customerId, email) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload = JSON.stringify({ exp, role: "customer", customerId, email: email.toLowerCase() });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function createCustomerMagicToken(email) {
  const exp = Math.floor(Date.now() / 1000) + MAGIC_MAX_AGE_SEC;
  const payload = JSON.stringify({ exp, purpose: "magic", email: email.toLowerCase() });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function verifyToken(token, kind) {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || sign(encoded) !== signature) return null;
  try {
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (kind === "customer" && data.role !== "customer") return null;
    if (kind === "magic" && data.purpose !== "magic") return null;
    if (typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function verifyCustomerSessionToken(token) {
  const data = verifyToken(token, "customer");
  if (!data?.customerId || !data.email) return null;
  return data;
}

export function verifyCustomerMagicToken(token) {
  const data = verifyToken(token, "magic");
  if (!data?.email) return null;
  return data;
}

export function customerSessionCookieHeader(token, request) {
  const secure =
    process.env.NODE_ENV === "production" ||
    (request?.url && new URL(request.url).protocol === "https:")
      ? "; Secure"
      : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SEC}${secure}`;
}

export function clearCustomerSessionCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getCustomerSessionFromRequest(req) {
  const cookies = parseCookies(
    typeof req?.headers?.get === "function" ? req.headers.get("cookie") : req?.headers?.cookie,
  );
  return cookies[COOKIE_NAME];
}

export async function upsertCustomer(email) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    const err = new Error("Valid email required");
    err.status = 400;
    throw err;
  }
  const { rows } = await query(
    `INSERT INTO customers (email, updated_at)
     VALUES ($1, now())
     ON CONFLICT (email) DO UPDATE SET updated_at = now()
     RETURNING id, email, wishlist, created_at, updated_at`,
    [normalized],
  );
  return {
    id: rows[0].id,
    email: rows[0].email,
    wishlist: Array.isArray(rows[0].wishlist) ? rows[0].wishlist : [],
  };
}

export async function getCustomerById(id) {
  const { rows } = await query(`SELECT id, email, wishlist FROM customers WHERE id = $1`, [id]);
  if (!rows.length) return null;
  return {
    id: rows[0].id,
    email: rows[0].email,
    wishlist: Array.isArray(rows[0].wishlist) ? rows[0].wishlist : [],
  };
}

export async function updateCustomerWishlist(customerId, slugs) {
  const list = [...new Set(slugs.filter((s) => typeof s === "string" && s.length > 0))];
  await query(`UPDATE customers SET wishlist = $2::jsonb, updated_at = now() WHERE id = $1`, [
    customerId,
    JSON.stringify(list),
  ]);
  return list;
}

export async function getCustomerOrders(email) {
  const { rows } = await query(
    `SELECT id, status, currency, amount_total, paid_at, created_at
     FROM orders
     WHERE LOWER(customer_email) = LOWER($1) AND status = 'paid'
     ORDER BY created_at DESC
     LIMIT 50`,
    [email],
  );
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    currency: r.currency,
    amountTotal: r.amount_total,
    paidAt: r.paid_at,
    createdAt: r.created_at,
  }));
}

export async function createWishlistShare(slugs) {
  const token = crypto.randomBytes(12).toString("base64url");
  const list = [...new Set(slugs.filter((s) => typeof s === "string" && s.length > 0))];
  await query(
    `INSERT INTO wishlist_shares (token, slugs, expires_at)
     VALUES ($1, $2::jsonb, now() + interval '90 days')`,
    [token, JSON.stringify(list)],
  );
  return { token, slugs: list };
}

export async function getWishlistShare(token) {
  const { rows } = await query(
    `SELECT slugs FROM wishlist_shares
     WHERE token = $1 AND (expires_at IS NULL OR expires_at > now())`,
    [token],
  );
  if (!rows.length) return null;
  return Array.isArray(rows[0].slugs) ? rows[0].slugs : [];
}

export function requireCustomerSession(req) {
  if (!isDatabaseConfigured()) {
    const err = new Error("Accounts require DATABASE_URL");
    err.status = 503;
    throw err;
  }
  const token = getCustomerSessionFromRequest(req);
  const data = verifyCustomerSessionToken(token);
  if (!data) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return data;
}
