import type { Catalog, Product } from "@/lib/catalog-types";
import type {
  AboutContent,
  AnnouncementContent,
  CmsPage,
  FindUsContent,
  HomepageContent,
  JournalPost,
  AdminCollectionMeta,
} from "@/lib/content-types";

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
  channel: string;
  externalRef: string | null;
  notes: string | null;
  currency: string;
  countryCode: string | null;
  shippingCountryCode: string | null;
  fulfillmentWarehouse: string | null;
  customerEmail: string | null;
  stripeSessionId: string | null;
  amountTotal: number | null;
  paidAt: string | null;
  shippedAt: string | null;
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

export type AdminAnalytics = {
  summary: {
    totalOrders: number;
    paidOrders: number;
    shippedOrders: number;
    revenueEurCents: number;
  };
  salesByWeek: { weekStart: string; orders: number; revenueCents: number }[];
  ordersByCountry: { country: string; orders: number; revenueCents: number }[];
  ordersByChannel: { channel: string; orders: number }[];
  stockByWarehouse: { france: number; bali: number };
};

export type NewsletterCopy = {
  eyebrow: string;
  title: string;
  description: string;
  placeholder: string;
  button: string;
  successMessage: string;
  duplicateMessage: string;
};

export type AdminNewsletterSettings = {
  provider: string;
  brevoListId: string;
  copy: NewsletterCopy;
  envProvider: string | null;
  hasBrevoKey: boolean;
  hasMailchimpKey: boolean;
  hasKlaviyoKey: boolean;
};

export async function fetchAdminOrders(channel?: string) {
  const qs = channel ? `?channel=${encodeURIComponent(channel)}` : "";
  return request<{ orders: AdminOrder[]; count: number; source: string }>(`/api/admin/orders${qs}`);
}

export async function fetchAdminOrder(orderId: string) {
  return request<{ order: AdminOrder; source: string }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}`,
  );
}

export async function shipAdminOrder(orderId: string) {
  return request<{ order: AdminOrder; source: string }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}/ship`,
    { method: "PATCH" },
  );
}

export function adminOrdersExportUrl() {
  return "/api/admin/orders/export.csv";
}

export async function fetchAdminAnalytics() {
  return request<{ analytics: AdminAnalytics; source: string }>("/api/admin/analytics");
}

export async function fetchAdminNewsletter() {
  return request<{
    settings: AdminNewsletterSettings;
    stats: { total: number; bySource: Record<string, number> };
    subscribers: { email: string; source: string; subscribedAt: string | null }[];
    source: string;
  }>("/api/admin/newsletter");
}

export async function updateAdminNewsletter(payload: {
  provider?: string;
  brevoListId?: string;
  copy?: Partial<NewsletterCopy>;
}) {
  return request<{ settings: AdminNewsletterSettings }>("/api/admin/newsletter", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function adminNewsletterExportUrl() {
  return "/api/admin/newsletter/export.csv";
}

export async function createMarketplaceOrder(payload: {
  channel: "wolf_badger" | "other";
  externalRef?: string;
  customerEmail?: string;
  shippingCountryCode: string;
  currency?: string;
  items: { productSlug: string; variantSlug?: string; qty: number; unitPrice: number }[];
  notes?: string;
}) {
  return request<{ order: AdminOrder; source: string }>("/api/admin/orders/marketplace", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

export async function fetchAdminSiteContent() {
  return request<{
    announcement: AnnouncementContent;
    homepage: HomepageContent;
    about: AboutContent;
    findUs: FindUsContent;
    stored: {
      announcement: Partial<AnnouncementContent>;
      homepage: Partial<HomepageContent>;
      about: Partial<AboutContent>;
      findUs: Partial<FindUsContent>;
    };
    source: string;
  }>("/api/admin/content/site");
}

export async function updateAdminSiteContent(payload: {
  announcement?: Partial<AnnouncementContent>;
  homepage?: Partial<HomepageContent>;
  about?: AboutContent;
  findUs?: FindUsContent;
}) {
  return request<{
    announcement: AnnouncementContent;
    homepage: HomepageContent;
    about: AboutContent;
    findUs: FindUsContent;
    stored: {
      announcement: Partial<AnnouncementContent>;
      homepage: Partial<HomepageContent>;
      about: Partial<AboutContent>;
      findUs: Partial<FindUsContent>;
    };
    source: string;
  }>("/api/admin/content/site", { method: "PATCH", body: JSON.stringify(payload) });
}

export async function seedAdminCms() {
  return request<{ posts: { seeded: number }; pages: { seeded: number }; source: string }>(
    "/api/admin/content/seed",
    { method: "POST" },
  );
}

export async function fetchAdminPosts() {
  return request<{ posts: JournalPost[]; source: string }>("/api/admin/content/posts");
}

export async function fetchAdminPost(slug: string) {
  return request<{ post: JournalPost; source: string }>(
    `/api/admin/content/posts/${encodeURIComponent(slug)}`,
  );
}

export async function saveAdminPost(post: Partial<JournalPost> & { slug: string; status?: string }) {
  return request<{ post: JournalPost; source: string }>("/api/admin/content/posts", {
    method: "POST",
    body: JSON.stringify(post),
  });
}

export async function deleteAdminPost(slug: string) {
  return request<{ ok: boolean; source: string }>(
    `/api/admin/content/posts/${encodeURIComponent(slug)}`,
    { method: "DELETE" },
  );
}

export async function fetchAdminPages() {
  return request<{ pages: CmsPage[]; source: string }>("/api/admin/content/pages");
}

export async function fetchAdminPage(slug: string) {
  return request<{ page: CmsPage; source: string }>(
    `/api/admin/content/pages/${encodeURIComponent(slug)}`,
  );
}

export async function saveAdminPage(page: Partial<CmsPage> & { slug: string; status?: string }) {
  return request<{ page: CmsPage; source: string }>("/api/admin/content/pages", {
    method: "POST",
    body: JSON.stringify(page),
  });
}

export async function deleteAdminPage(slug: string) {
  return request<{ ok: boolean; source: string }>(
    `/api/admin/content/pages/${encodeURIComponent(slug)}`,
    { method: "DELETE" },
  );
}

export async function fetchAdminCollections() {
  return request<{ collections: AdminCollectionMeta[]; source: string }>("/api/admin/collections");
}

export async function updateAdminCollection(slug: string, patch: Partial<AdminCollectionMeta>) {
  return request<{ collection: AdminCollectionMeta; source: string }>(
    `/api/admin/collections/${encodeURIComponent(slug)}`,
    { method: "PATCH", body: JSON.stringify(patch) },
  );
}

export type AdminCmsStatus = {
  source: string;
  database: boolean;
  instagram: {
    source: string;
    syncedAt: string | null;
    postCount: number;
    localImages: number;
    cdnImages: number;
    needsRefresh: boolean;
  };
  instagramApi: {
    hasToken: boolean;
    hasUserId: boolean;
  };
  cms: {
    posts: number;
    pages: number;
    collections: number;
    hasHomepage: boolean;
    hasAnnouncement: boolean;
  } | null;
};

export async function fetchAdminCmsStatus() {
  return request<AdminCmsStatus>("/api/admin/cms/status");
}
