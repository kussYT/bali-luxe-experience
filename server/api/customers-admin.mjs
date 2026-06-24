import { isDatabaseConfigured } from "../db/pool.mjs";
import { exportCustomersCsv, listCustomers } from "../customer-auth.mjs";

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
