import { isDatabaseConfigured } from "../db/pool.mjs";
import { exportCustomersCsv, listCustomers } from "../customer-auth.mjs";
import { readCatalog } from "../catalog-store.mjs";

function csvCell(value, separator = ",") {
  const text = value == null ? "" : String(value);
  if (text.includes(separator) || /["\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

async function productNameBySlug() {
  try {
    const catalog = await readCatalog();
    const map = {};
    for (const product of catalog.products || []) map[product.slug] = product.name;
    return map;
  } catch {
    return {};
  }
}

function requireCustomersDb() {
  if (!isDatabaseConfigured()) {
    const err = new Error("Customer accounts require DATABASE_URL");
    err.status = 503;
    throw err;
  }
}

export async function getAdminCustomersResponse(request) {
  requireCustomersDb();
  const url = new URL(request.url);
  const wishlistOnly = url.searchParams.get("wishlist") === "1";
  const customers = await listCustomers({ wishlistOnly });
  const withWishlist = customers.filter((c) => c.wishlist.length > 0).length;

  return {
    customers,
    stats: {
      total: customers.length,
      withWishlist,
      totalWishlistItems: customers.reduce((sum, c) => sum + c.wishlist.length, 0),
    },
    source: "postgres",
  };
}

export async function getAdminCustomersExportCsv(request) {
  requireCustomersDb();
  const url = new URL(request.url);
  const wishlistOnly = url.searchParams.get("wishlist") === "1";
  return exportCustomersCsv({ wishlistOnly });
}

/** Semicolon-separated CSV for Brevo contact import (create matching custom attributes first). */
export async function getAdminCustomersExportBrevoCsv(request) {
  requireCustomersDb();
  const url = new URL(request.url);
  const wishlistOnly = url.searchParams.get("wishlist") === "1";
  const customers = await listCustomers({ wishlistOnly });
  const names = await productNameBySlug();
  const sep = ";";
  const header = [
    "EMAIL",
    "WISHLIST_SLUGS",
    "WISHLIST_PRODUCTS",
    "WISHLIST_COUNT",
    "PAID_ORDERS",
    "LAST_ACTIVE",
  ].join(sep);
  const lines = [header];

  for (const customer of customers) {
    const productNames = customer.wishlist.map((slug) => names[slug] || slug);
    lines.push(
      [
        csvCell(customer.email, sep),
        csvCell(customer.wishlist.join("|"), sep),
        csvCell(productNames.join(" | "), sep),
        csvCell(customer.wishlist.length, sep),
        csvCell(customer.orderCount, sep),
        csvCell(customer.updatedAt ? new Date(customer.updatedAt).toISOString().slice(0, 10) : "", sep),
      ].join(sep),
    );
  }

  return lines.join("\n");
}
