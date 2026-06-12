import { config as loadEnv } from "dotenv";
import {
  readCatalog,
  writeCatalog,
  saveUploadedImage,
  slugify,
  normalizeCatalog,
} from "./server/catalog-store.mjs";
import {
  getAdminPassword,
  createSessionToken,
  verifySessionToken,
  getSessionFromRequest,
  requireAdmin,
  sessionCookieHeader,
  clearSessionCookieHeader,
} from "./server/admin-auth.mjs";
import { fetchInstagramFeed, INSTAGRAM_PROFILE } from "./server/instagram-feed.mjs";
import { subscribeNewsletter } from "./server/newsletter.mjs";
import { createCheckoutSession, handleStripeWebhook, getCheckoutSessionStatus } from "./server/checkout.mjs";
import { getCatalogResponse } from "./server/api/catalog.mjs";
import { getAdminInventoryResponse, patchAdminInventory } from "./server/api/inventory.mjs";
import { getAdminOrdersResponse, getAdminOrderResponse } from "./server/api/orders.mjs";
import {
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "./server/api/products-admin.mjs";
import { isDatabaseConfigured } from "./server/db/pool.mjs";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __root = join(dirname(fileURLToPath(import.meta.url)));

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function readBody(req) {
  const raw = await readRawBody(req);
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    return {};
  }
}

async function parseMultipart(req) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) return null;
  const boundary = contentType.split("boundary=")[1];
  if (!boundary) return null;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  const parts = buffer.toString("binary").split(`--${boundary}`);
  const files = [];

  for (const part of parts) {
    if (!part.includes("filename=")) continue;
    const nameMatch = part.match(/name="([^"]+)"/);
    const fileMatch = part.match(/filename="([^"]+)"/);
    const dataStart = part.indexOf("\r\n\r\n");
    if (dataStart === -1) continue;
    const header = part.slice(0, dataStart);
    const body = part.slice(dataStart + 4, part.lastIndexOf("\r\n"));
    files.push({
      field: nameMatch?.[1] || "file",
      filename: fileMatch?.[1] || "upload.jpg",
      buffer: Buffer.from(body, "binary"),
    });
  }
  return files;
}

export function adminApiPlugin() {
  return {
    name: "bingin-admin-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();

        const url = new URL(req.url, "http://localhost");
        const pathname = url.pathname;

        try {
          if (pathname === "/api/stripe/webhook" && req.method === "POST") {
            const raw = await readRawBody(req);
            const signature = req.headers["stripe-signature"];
            const result = await handleStripeWebhook(raw, signature);
            return json(res, 200, result);
          }

          if (pathname === "/api/checkout/session" && req.method === "POST") {
            const body = await readBody(req);
            const result = await createCheckoutSession({
              items: body.items,
              currency: body.currency,
              countryCode: body.countryCode,
            });
            return json(res, 200, result);
          }

          if (pathname === "/api/checkout/session" && req.method === "GET") {
            const sessionId = url.searchParams.get("session_id");
            const result = await getCheckoutSessionStatus(sessionId);
            return json(res, 200, result);
          }

          // Public catalog (published products only by default)
          if (pathname === "/api/instagram" && req.method === "GET") {
            let liveError = null;
            try {
              const live = await fetchInstagramFeed();
              if (live) return json(res, 200, live);
            } catch (e) {
              liveError = e;
              console.warn("[api/instagram]", e.message);
            }
            try {
              const cached = await readFile(join(__root, "public", "instagram-feed.json"), "utf8");
              const payload = JSON.parse(cached);
              return json(res, 200, {
                ...payload,
                source: payload.source || "static",
                error: liveError ? "Instagram live feed unavailable. Using cached content." : undefined,
              });
            } catch {
              return json(res, 200, {
                profile: INSTAGRAM_PROFILE,
                posts: [],
                source: "fallback",
                error: liveError ? "Instagram API unavailable" : "No instagram fallback content found",
              });
            }
          }

          if (pathname === "/api/catalog" && req.method === "GET") {
            const includeDrafts = url.searchParams.get("all") === "1";
            const catalog = await getCatalogResponse({ includeDrafts });
            return json(res, 200, catalog);
          }

          if (pathname === "/api/newsletter" && req.method === "POST") {
            const body = await readBody(req);
            const email = typeof body.email === "string" ? body.email : "";
            const source = typeof body.source === "string" ? body.source : "website";
            const result = await subscribeNewsletter({ email, source });
            return json(res, 200, result);
          }

          if (pathname === "/api/admin/login" && req.method === "POST") {
            const body = await readBody(req);
            if (body.password !== getAdminPassword()) {
              return json(res, 401, { error: "Invalid credentials" });
            }
            const token = createSessionToken();
            res.setHeader("Set-Cookie", sessionCookieHeader(token));
            return json(res, 200, { ok: true });
          }

          if (pathname === "/api/admin/logout" && req.method === "POST") {
            res.setHeader("Set-Cookie", clearSessionCookieHeader());
            return json(res, 200, { ok: true });
          }

          if (pathname === "/api/admin/me" && req.method === "GET") {
            const token = getSessionFromRequest(req);
            return json(res, 200, { authenticated: verifySessionToken(token) });
          }

          requireAdmin(req);

          if (pathname === "/api/admin/catalog" && req.method === "GET") {
            const catalog = await getCatalogResponse({ includeDrafts: true });
            return json(res, 200, catalog);
          }

          if (pathname === "/api/admin/inventory" && req.method === "GET") {
            const inventory = await getAdminInventoryResponse();
            return json(res, 200, inventory);
          }

          if (pathname === "/api/admin/inventory" && req.method === "PATCH") {
            const body = await readBody(req);
            const result = await patchAdminInventory(body);
            return json(res, 200, result);
          }

          if (pathname === "/api/admin/orders" && req.method === "GET") {
            const orders = await getAdminOrdersResponse();
            return json(res, 200, orders);
          }

          const orderMatch = pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
          if (orderMatch && req.method === "GET") {
            const orderId = decodeURIComponent(orderMatch[1]);
            const detail = await getAdminOrderResponse(orderId);
            return json(res, 200, detail);
          }

          if (pathname === "/api/admin/products" && req.method === "POST") {
            const body = await readBody(req);
            if (isDatabaseConfigured()) {
              const result = await createAdminProduct(body);
              return json(res, 201, result);
            }
            const catalog = await readCatalog();
            const slug = body.slug || slugify(body.name);
            if (catalog.products.some((p) => p.slug === slug)) {
              return json(res, 409, { error: "Product slug already exists" });
            }
            const product = normalizeCatalog({ products: [{ ...body, slug }] }).products[0];
            catalog.products.unshift(product);
            const saved = await writeCatalog(catalog);
            return json(res, 201, { product, catalog: saved });
          }

          const productMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)$/);
          if (productMatch) {
            const slug = decodeURIComponent(productMatch[1]);

            if (req.method === "PUT") {
              const body = await readBody(req);
              if (isDatabaseConfigured()) {
                const result = await updateAdminProduct(slug, body);
                return json(res, 200, result);
              }
              const catalog = await readCatalog();
              const index = catalog.products.findIndex((p) => p.slug === slug);
              if (index === -1) return json(res, 404, { error: "Product not found" });
              const updated = normalizeCatalog({
                products: [{ ...catalog.products[index], ...body, slug }],
              }).products[0];
              catalog.products[index] = updated;
              const saved = await writeCatalog(catalog);
              return json(res, 200, { product: updated, catalog: saved });
            }

            if (req.method === "DELETE") {
              if (isDatabaseConfigured()) {
                const result = await deleteAdminProduct(slug);
                return json(res, 200, result);
              }
              const catalog = await readCatalog();
              const index = catalog.products.findIndex((p) => p.slug === slug);
              if (index === -1) return json(res, 404, { error: "Product not found" });
              catalog.products.splice(index, 1);
              const saved = await writeCatalog(catalog);
              return json(res, 200, { ok: true, catalog: saved });
            }
          }

          if (pathname === "/api/admin/upload" && req.method === "POST") {
            const slug = url.searchParams.get("slug");
            if (!slug) return json(res, 400, { error: "slug query param required" });
            const files = await parseMultipart(req);
            if (!files?.length) return json(res, 400, { error: "No file uploaded" });
            const urls = [];
            for (const file of files) {
              const urlPath = await saveUploadedImage(slug, file.filename, file.buffer);
              urls.push(urlPath);
            }
            return json(res, 200, { urls });
          }

          return json(res, 404, { error: "Not found" });
        } catch (err) {
          const status = err.status || 500;
          return json(res, status, { error: err.message || "Server error" });
        }
      });
    },
    configurePreviewServer(server) {
      this.configureServer(server);
    },
  };
}
