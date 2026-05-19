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

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
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
          // Public catalog (published products only by default)
          if (pathname === "/api/catalog" && req.method === "GET") {
            const catalog = await readCatalog();
            const includeDrafts = url.searchParams.get("all") === "1";
            const products = includeDrafts
              ? catalog.products
              : catalog.products.filter((p) => p.status === "published");
            return json(res, 200, { ...catalog, products, productCount: products.length });
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
            const catalog = await readCatalog();
            return json(res, 200, catalog);
          }

          if (pathname === "/api/admin/products" && req.method === "POST") {
            const body = await readBody(req);
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
            const catalog = await readCatalog();
            const index = catalog.products.findIndex((p) => p.slug === slug);

            if (req.method === "PUT") {
              if (index === -1) return json(res, 404, { error: "Product not found" });
              const body = await readBody(req);
              const updated = normalizeCatalog({
                products: [{ ...catalog.products[index], ...body, slug }],
              }).products[0];
              catalog.products[index] = updated;
              const saved = await writeCatalog(catalog);
              return json(res, 200, { product: updated, catalog: saved });
            }

            if (req.method === "DELETE") {
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
