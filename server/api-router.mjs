import {
  readCatalog,
  writeCatalog,
  slugify,
  normalizeCatalog,
} from "./catalog-store.mjs";
import {
  getAdminPassword,
  createSessionToken,
  verifySessionToken,
  getSessionFromRequest,
  requireAdmin,
  sessionCookieHeader,
  clearSessionCookieHeader,
} from "./admin-auth.mjs";
import { fetchInstagramFeed, INSTAGRAM_PROFILE } from "./instagram-feed.mjs";
import { subscribeNewsletter } from "./newsletter.mjs";
import {
  createCheckoutSession,
  handleStripeWebhook,
  getCheckoutSessionStatus,
} from "./checkout.mjs";
import { getCatalogResponse } from "./api/catalog.mjs";
import { getAdminInventoryResponse, patchAdminInventory } from "./api/inventory.mjs";
import {
  getAdminOrdersResponse,
  getAdminOrderResponse,
  shipAdminOrder,
  getAdminOrdersCsv,
} from "./api/orders.mjs";
import { postContactMessage } from "./api/contact.mjs";
import {
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "./api/products-admin.mjs";
import { isDatabaseConfigured } from "./db/pool.mjs";
import { saveUploadedImage, getUploadedImage } from "./uploads.mjs";

function jsonResponse(status, body, extraHeaders = {}) {
  return Response.json(body, { status, headers: extraHeaders });
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function parseMultipartRequest(request) {
  const form = await request.formData();
  const files = [];
  for (const [field, value] of form.entries()) {
    if (value instanceof File && value.size > 0) {
      files.push({
        field,
        filename: value.name,
        buffer: Buffer.from(await value.arrayBuffer()),
      });
    }
  }
  return files;
}

async function instagramResponse(request) {
  let liveError = null;
  try {
    const live = await fetchInstagramFeed();
    if (live) return jsonResponse(200, live);
  } catch (e) {
    liveError = e;
    console.warn("[api/instagram]", e.message);
  }

  try {
    const staticUrl = new URL("/instagram-feed.json", request.url);
    const res = await fetch(staticUrl);
    if (res.ok) {
      const payload = await res.json();
      return jsonResponse(200, {
        ...payload,
        source: payload.source || "static",
        error: liveError ? "Instagram live feed unavailable. Using cached content." : undefined,
      });
    }
  } catch {
    /* static asset unavailable */
  }

  return jsonResponse(200, {
    profile: INSTAGRAM_PROFILE,
    posts: [],
    source: "fallback",
    error: liveError ? "Instagram API unavailable" : "No instagram fallback content found",
  });
}

/**
 * Central API router for dev (Vite middleware) and production (TanStack server route / Cloudflare Worker).
 * @param {Request} request
 * @param {{ env?: { UPLOADS?: { get: (key: string) => Promise<{ body: ReadableStream, httpMetadata?: { contentType?: string } } | null> } } }} [context]
 */
export async function handleApiRequest(request, context = {}) {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method.toUpperCase();

  if (!pathname.startsWith("/api/")) return null;

  try {
    if (pathname === "/api/stripe/webhook" && method === "POST") {
      const raw = Buffer.from(await request.arrayBuffer());
      const signature = request.headers.get("stripe-signature");
      const result = await handleStripeWebhook(raw, signature);
      return jsonResponse(200, result);
    }

    if (pathname === "/api/checkout/session" && method === "POST") {
      const body = await readJsonBody(request);
      const result = await createCheckoutSession({
        items: body.items,
        currency: body.currency,
        countryCode: body.countryCode,
      });
      return jsonResponse(200, result);
    }

    if (pathname === "/api/checkout/session" && method === "GET") {
      const sessionId = url.searchParams.get("session_id");
      const result = await getCheckoutSessionStatus(sessionId);
      return jsonResponse(200, result);
    }

    if (pathname === "/api/instagram" && method === "GET") {
      return instagramResponse(request);
    }

    if (pathname === "/api/catalog" && method === "GET") {
      const includeDrafts = url.searchParams.get("all") === "1";
      const catalog = await getCatalogResponse({ includeDrafts });
      return jsonResponse(200, catalog);
    }

    if (pathname === "/api/newsletter" && method === "POST") {
      const body = await readJsonBody(request);
      const email = typeof body.email === "string" ? body.email : "";
      const source = typeof body.source === "string" ? body.source : "website";
      const result = await subscribeNewsletter({ email, source });
      return jsonResponse(200, result);
    }

    if (pathname === "/api/contact" && method === "POST") {
      const body = await readJsonBody(request);
      const result = await postContactMessage(body);
      return jsonResponse(200, result);
    }

    if (pathname === "/api/admin/login" && method === "POST") {
      const body = await readJsonBody(request);
      if (body.password !== getAdminPassword()) {
        return jsonResponse(401, { error: "Invalid credentials" });
      }
      const token = createSessionToken();
      return jsonResponse(200, { ok: true }, {
        "Set-Cookie": sessionCookieHeader(token, request),
      });
    }

    if (pathname === "/api/admin/logout" && method === "POST") {
      return jsonResponse(200, { ok: true }, {
        "Set-Cookie": clearSessionCookieHeader(),
      });
    }

    if (pathname === "/api/admin/me" && method === "GET") {
      const token = getSessionFromRequest(request);
      return jsonResponse(200, { authenticated: verifySessionToken(token) });
    }

    requireAdmin(request);

    if (pathname === "/api/admin/catalog" && method === "GET") {
      const catalog = await getCatalogResponse({ includeDrafts: true });
      return jsonResponse(200, catalog);
    }

    if (pathname === "/api/admin/inventory" && method === "GET") {
      const inventory = await getAdminInventoryResponse();
      return jsonResponse(200, inventory);
    }

    if (pathname === "/api/admin/inventory" && method === "PATCH") {
      const body = await readJsonBody(request);
      const result = await patchAdminInventory(body);
      return jsonResponse(200, result);
    }

    if (pathname === "/api/admin/orders" && method === "GET") {
      const orders = await getAdminOrdersResponse();
      return jsonResponse(200, orders);
    }

    if (pathname === "/api/admin/orders/export.csv" && method === "GET") {
      const csv = await getAdminOrdersCsv();
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="bingin-orders.csv"',
        },
      });
    }

    const orderShipMatch = pathname.match(/^\/api\/admin\/orders\/([^/]+)\/ship$/);
    if (orderShipMatch && method === "PATCH") {
      const orderId = decodeURIComponent(orderShipMatch[1]);
      const result = await shipAdminOrder(orderId);
      return jsonResponse(200, result);
    }

    const orderMatch = pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
    if (orderMatch && method === "GET") {
      const orderId = decodeURIComponent(orderMatch[1]);
      const detail = await getAdminOrderResponse(orderId);
      return jsonResponse(200, detail);
    }

    if (pathname === "/api/admin/products" && method === "POST") {
      const body = await readJsonBody(request);
      if (isDatabaseConfigured()) {
        const result = await createAdminProduct(body);
        return jsonResponse(201, result);
      }
      const catalog = await readCatalog();
      const slug = body.slug || slugify(body.name);
      if (catalog.products.some((p) => p.slug === slug)) {
        return jsonResponse(409, { error: "Product slug already exists" });
      }
      const product = normalizeCatalog({ products: [{ ...body, slug }] }).products[0];
      catalog.products.unshift(product);
      const saved = await writeCatalog(catalog);
      return jsonResponse(201, { product, catalog: saved });
    }

    const productMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)$/);
    if (productMatch) {
      const slug = decodeURIComponent(productMatch[1]);

      if (method === "PUT") {
        const body = await readJsonBody(request);
        if (isDatabaseConfigured()) {
          const result = await updateAdminProduct(slug, body);
          return jsonResponse(200, result);
        }
        const catalog = await readCatalog();
        const index = catalog.products.findIndex((p) => p.slug === slug);
        if (index === -1) return jsonResponse(404, { error: "Product not found" });
        const updated = normalizeCatalog({
          products: [{ ...catalog.products[index], ...body, slug }],
        }).products[0];
        catalog.products[index] = updated;
        const saved = await writeCatalog(catalog);
        return jsonResponse(200, { product: updated, catalog: saved });
      }

      if (method === "DELETE") {
        if (isDatabaseConfigured()) {
          const result = await deleteAdminProduct(slug);
          return jsonResponse(200, result);
        }
        const catalog = await readCatalog();
        const index = catalog.products.findIndex((p) => p.slug === slug);
        if (index === -1) return jsonResponse(404, { error: "Product not found" });
        catalog.products.splice(index, 1);
        const saved = await writeCatalog(catalog);
        return jsonResponse(200, { ok: true, catalog: saved });
      }
    }

    if (pathname === "/api/admin/upload" && method === "POST") {
      const slug = url.searchParams.get("slug");
      if (!slug) return jsonResponse(400, { error: "slug query param required" });
      const files = await parseMultipartRequest(request);
      if (!files?.length) return jsonResponse(400, { error: "No file uploaded" });
      const urls = [];
      for (const file of files) {
        const urlPath = await saveUploadedImage(slug, file.filename, file.buffer, context.env);
        urls.push(urlPath);
      }
      return jsonResponse(200, { urls });
    }

    return jsonResponse(404, { error: "Not found" });
  } catch (err) {
    const status = err.status || 500;
    return jsonResponse(status, { error: err.message || "Server error" });
  }
}
