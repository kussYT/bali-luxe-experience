import type { Catalog, Product } from "@/lib/catalog-types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export async function fetchPublicCatalog() {
  return request<Catalog>("/api/catalog");
}

export async function fetchAdminCatalog() {
  return request<Catalog>("/api/admin/catalog");
}

export async function checkAdminSession() {
  return request<{ authenticated: boolean }>("/api/admin/me");
}

export async function adminLogin(password: string) {
  return request<{ ok: boolean }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export async function adminLogout() {
  return request<{ ok: boolean }>("/api/admin/logout", { method: "POST" });
}

export async function createProduct(product: Partial<Product>) {
  return request<{ product: Product; catalog: Catalog }>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function updateProduct(slug: string, product: Partial<Product>) {
  return request<{ product: Product; catalog: Catalog }>(`/api/admin/products/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(slug: string) {
  return request<{ ok: boolean; catalog: Catalog }>(`/api/admin/products/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}

export type InventoryRow = {
  productId: string;
  productSlug: string;
  productName: string;
  status: string;
  origin: string;
  defaultWarehouse: string;
  variantId: string;
  variantSlug: string;
  variantTitle: string;
  sku?: string;
  isDefault: boolean;
  france: number;
  bali: number;
  franceReserved: number;
  baliReserved: number;
  franceAvailable: number;
  baliAvailable: number;
};

export type AdminInventoryResponse = {
  items: InventoryRow[];
  totals: { france: number; bali: number };
  lowStock: {
    productSlug: string;
    productName: string;
    variantTitle: string;
    franceAvailable: number;
    baliAvailable: number;
  }[];
  lowStockCount: number;
  source: string;
};

export async function fetchAdminInventory() {
  return request<AdminInventoryResponse>("/api/admin/inventory");
}

export type AdminOrder = {
  id: string;
  status: string;
  currency: string;
  countryCode: string | null;
  shippingCountryCode: string | null;
  fulfillmentWarehouse: string | null;
  customerEmail: string | null;
  stripeSessionId: string | null;
  amountTotal: number | null;
  paidAt: string | null;
  createdAt: string;
  items: {
    id: string;
    slug: string;
    name: string;
    variantTitle: string | null;
    qty: number;
    unitPrice: number;
    warehouseId: string;
    image: string | null;
  }[];
};

export async function fetchAdminOrders() {
  return request<{ orders: AdminOrder[]; count: number; source: string }>("/api/admin/orders");
}

export async function fetchAdminOrder(orderId: string) {
  return request<{ order: AdminOrder; source: string }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}`,
  );
}

export async function updateInventoryQuantity(payload: {
  variantId: string;
  warehouseId: "france" | "bali";
  quantity: number;
  note?: string;
}) {
  return request<{ ok: boolean; variantId: string; warehouseId: string; previous: number; quantity: number; delta: number }>(
    "/api/admin/inventory",
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export async function uploadProductImages(slug: string, files: FileList | File[]) {
  const form = new FormData();
  for (const file of files) form.append("images", file);
  const res = await fetch(`/api/admin/upload?slug=${encodeURIComponent(slug)}`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data as { urls: string[] };
}
