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
import { getStaticInstagramFeed } from "./instagram-static.mjs";
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
  patchAdminOrder,
  getAdminOrdersCsv,
  postMarketplaceOrder,
} from "./api/orders.mjs";
import { getAdminAnalyticsResponse } from "./api/analytics.mjs";
import {
  getNewsletterCopyResponse,
  getAdminNewsletterResponse,
  patchAdminNewsletter,
  getAdminNewsletterExportCsv,
} from "./api/newsletter-admin.mjs";
import { postContactMessage } from "./api/contact.mjs";
import {
  getSiteContentResponse,
  getPostsListResponse,
  getPostResponse,
  getPageResponse,
} from "./api/content.mjs";
import {
  getAdminContentResponse,
  patchAdminContentResponse,
  getAdminPostsResponse,
  getAdminPostResponse,
  saveAdminPostResponse,
  removeAdminPostResponse,
  getAdminPagesResponse,
  getAdminPageResponse,
  saveAdminPageResponse,
  removeAdminPageResponse,
  getAdminCollectionsResponse,
  patchAdminCollectionResponse,
  seedCmsContent,
} from "./api/content-admin.mjs";
import { getAdminCmsStatusResponse } from "./api/cms-status.mjs";
import { mergeFeedWithLocalImages, sanitizeInstagramFeed } from "./instagram-utils.mjs";
import {
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "./api/products-admin.mjs";
import { isDatabaseConfigured } from "./db/pool.mjs";
import { saveUploadedImage, getUploadedImage } from "./uploads.mjs";
import {
  postAccountRequestLink,
  getAccountVerify,
  getAccountMe,
  postAccountWishlist,
  postAccountLogout,
  postWishlistShare,
  getWishlistShareResponse,
} from "./api/account.mjs";
import {
  getAdminCustomersResponse,
  getAdminCustomersExportCsv,
  getAdminCustomersExportBrevoCsv,
} from "./api/customers-admin.mjs";
import { postAdminTranslatePage, getAdminTranslateStatusResponse } from "./api/translate-admin.mjs";

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
    if (live) {
      const merged = mergeFeedWithLocalImages(live, getStaticInstagramFeed());
      return jsonResponse(200, merged);
    }
  } catch (e) {
    liveError = e;
    console.warn("[api/instagram]", e.message);
  }

  try {
    const payload = sanitizeInstagramFeed(getStaticInstagramFeed());
    if (payload?.posts?.length) {
      return jsonResponse(200, {
        ...payload,
        source: payload.source || "static",
        error: liveError ? "Instagram live feed unavailable. Using cached content." : undefined,
      });
    }
  } catch {
    /* static feed unavailable */
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

    if (pathname === "/api/geo" && method === "GET") {
      const countryCode = request.cf?.country || null;
      return jsonResponse(200, { countryCode });
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

    if (pathname === "/api/newsletter/copy" && method === "GET") {
      const result = await getNewsletterCopyResponse();
      return jsonResponse(200, result);
    }

    if (pathname === "/api/contact" && method === "POST") {
      const body = await readJsonBody(request);
      const result = await postContactMessage(body);
      return jsonResponse(200, result);
    }

    if (pathname === "/api/content/site" && method === "GET") {
      return getSiteContentResponse();
    }

    if (pathname === "/api/content/posts" && method === "GET") {
      return getPostsListResponse();
    }

    const contentPostMatch = pathname.match(/^\/api\/content\/posts\/([^/]+)$/);
    if (contentPostMatch && method === "GET") {
      return getPostResponse(decodeURIComponent(contentPostMatch[1]));
    }

    const contentPageMatch = pathname.match(/^\/api\/content\/pages\/([^/]+)$/);
    if (contentPageMatch && method === "GET") {
      const locale = url.searchParams.get("locale") || undefined;
      return getPageResponse(decodeURIComponent(contentPageMatch[1]), locale);
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

    if (pathname === "/api/account/request-link" && method === "POST") {
      const body = await readJsonBody(request);
      const result = await postAccountRequestLink(body);
      return jsonResponse(200, result);
    }

    if (pathname === "/api/account/verify" && method === "GET") {
      const token = url.searchParams.get("token");
      const result = await getAccountVerify(token, request);
      return jsonResponse(200, { ok: true, customer: result.customer }, result.headers || {});
    }

    if (pathname === "/api/account/me" && method === "GET") {
      const result = await getAccountMe(request);
      return jsonResponse(200, result);
    }

    if (pathname === "/api/account/wishlist" && method === "POST") {
      const body = await readJsonBody(request);
      const result = await postAccountWishlist(request, body);
      return jsonResponse(200, result);
    }

    if (pathname === "/api/account/logout" && method === "POST") {
      const result = await postAccountLogout();
      return jsonResponse(200, { ok: true }, result.headers || {});
    }

    if (pathname === "/api/wishlist/share" && method === "POST") {
      const body = await readJsonBody(request);
      const result = await postWishlistShare(body);
      return jsonResponse(200, result);
    }

    const wishlistShareMatch = pathname.match(/^\/api\/wishlist\/share\/([^/]+)$/);
    if (wishlistShareMatch && method === "GET") {
      const token = decodeURIComponent(wishlistShareMatch[1]);
      const result = await getWishlistShareResponse(token);
      return jsonResponse(200, result);
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

    if (pathname === "/api/admin/analytics" && method === "GET") {
      const analytics = await getAdminAnalyticsResponse();
      return jsonResponse(200, analytics);
    }

    if (pathname === "/api/admin/newsletter" && method === "GET") {
      const newsletter = await getAdminNewsletterResponse();
      return jsonResponse(200, newsletter);
    }

    if (pathname === "/api/admin/newsletter" && method === "PATCH") {
      const body = await readJsonBody(request);
      const result = await patchAdminNewsletter(body);
      return jsonResponse(200, result);
    }

    if (pathname === "/api/admin/newsletter/export.csv" && method === "GET") {
      const csv = await getAdminNewsletterExportCsv();
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="bingin-newsletter-subscribers.csv"',
        },
      });
    }

    if (pathname === "/api/admin/orders" && method === "GET") {
      const channel = url.searchParams.get("channel") || undefined;
      const orders = await getAdminOrdersResponse({ channel });
      return jsonResponse(200, orders);
    }

    if (pathname === "/api/admin/orders/marketplace" && method === "POST") {
      const body = await readJsonBody(request);
      const result = await postMarketplaceOrder(body);
      return jsonResponse(201, result);
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
      const body = await readJsonBody(request).catch(() => ({}));
      const result = await shipAdminOrder(orderId, body);
      return jsonResponse(200, result);
    }

    const orderMatch = pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
    if (orderMatch && method === "GET") {
      const orderId = decodeURIComponent(orderMatch[1]);
      const detail = await getAdminOrderResponse(orderId);
      return jsonResponse(200, detail);
    }

    if (orderMatch && method === "PATCH") {
      const orderId = decodeURIComponent(orderMatch[1]);
      const body = await readJsonBody(request);
      const result = await patchAdminOrder(orderId, body);
      return jsonResponse(200, result);
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

    if (pathname === "/api/admin/cms/status" && method === "GET") {
      const result = await getAdminCmsStatusResponse(context.env);
      return jsonResponse(200, result);
    }

    if (pathname === "/api/admin/content/site" && method === "GET") {
      const result = await getAdminContentResponse();
      return jsonResponse(200, result);
    }

    if (pathname === "/api/admin/content/site" && method === "PATCH") {
      const body = await readJsonBody(request);
      const result = await patchAdminContentResponse(body);
      return jsonResponse(200, result);
    }

    if (pathname === "/api/admin/content/seed" && method === "POST") {
      const result = await seedCmsContent();
      return jsonResponse(200, result);
    }

    if (pathname === "/api/admin/content/posts" && method === "GET") {
      const result = await getAdminPostsResponse();
      return jsonResponse(200, result);
    }

    if (pathname === "/api/admin/content/posts" && method === "POST") {
      const body = await readJsonBody(request);
      const result = await saveAdminPostResponse(body);
      return jsonResponse(200, result);
    }

    const adminPostMatch = pathname.match(/^\/api\/admin\/content\/posts\/([^/]+)$/);
    if (adminPostMatch) {
      const slug = decodeURIComponent(adminPostMatch[1]);
      if (method === "GET") {
        const result = await getAdminPostResponse(slug);
        return jsonResponse(200, result);
      }
      if (method === "DELETE") {
        const result = await removeAdminPostResponse(slug);
        return jsonResponse(200, result);
      }
    }

    if (pathname === "/api/admin/content/pages" && method === "GET") {
      const result = await getAdminPagesResponse();
      return jsonResponse(200, result);
    }

    if (pathname === "/api/admin/content/pages" && method === "POST") {
      const body = await readJsonBody(request);
      const result = await saveAdminPageResponse(body);
      return jsonResponse(200, result);
    }

    const adminPageMatch = pathname.match(/^\/api\/admin\/content\/pages\/([^/]+)$/);
    if (adminPageMatch) {
      const slug = decodeURIComponent(adminPageMatch[1]);
      if (method === "GET") {
        const result = await getAdminPageResponse(slug);
        return jsonResponse(200, result);
      }
      if (method === "DELETE") {
        const result = await removeAdminPageResponse(slug);
        return jsonResponse(200, result);
      }
    }

    if (pathname === "/api/admin/collections" && method === "GET") {
      const result = await getAdminCollectionsResponse();
      return jsonResponse(200, result);
    }

    const adminCollectionMatch = pathname.match(/^\/api\/admin\/collections\/([^/]+)$/);
    if (adminCollectionMatch && method === "PATCH") {
      const slug = decodeURIComponent(adminCollectionMatch[1]);
      const body = await readJsonBody(request);
      const result = await patchAdminCollectionResponse(slug, body);
      return jsonResponse(200, result);
    }

    if (pathname === "/api/admin/customers" && method === "GET") {
      const result = await getAdminCustomersResponse(request);
      return jsonResponse(200, result);
    }

    if (pathname === "/api/admin/customers/export.csv" && method === "GET") {
      const csv = await getAdminCustomersExportCsv(request);
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="bingin-customers-wishlists.csv"',
        },
      });
    }

    if (pathname === "/api/admin/customers/export-brevo.csv" && method === "GET") {
      const csv = await getAdminCustomersExportBrevoCsv(request);
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="bingin-customers-brevo.csv"',
        },
      });
    }

    if (pathname === "/api/admin/translate-page" && method === "GET") {
      const status = await getAdminTranslateStatusResponse();
      return jsonResponse(200, status);
    }

    if (pathname === "/api/admin/translate-page" && method === "POST") {
      const body = await readJsonBody(request);
      const result = await postAdminTranslatePage(body);
      return jsonResponse(200, result);
    }

    return jsonResponse(404, { error: "Not found" });
  } catch (err) {
    const status = err.status || 500;
    return jsonResponse(status, { error: err.message || "Server error" });
  }
}
