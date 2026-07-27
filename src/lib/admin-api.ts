import type { UploadProgress } from "@/lib/upload-admin-files";
import { uploadAdminFiles } from "@/lib/upload-admin-files";
import type { CountryShippingRow } from "@/lib/country-shipping-types";
import type { Catalog, Product } from "@/lib/catalog-types";
import type {
  AboutStored,
  AnnouncementContent,
  CareContent,
  CmsPage,
  ContactContent,
  FindUsContent,
  FooterContent,
  HomepageContent,
  JournalPost,
  JournalPostBlock,
  ProductMessagesContent,
  ProductMessagesStored,
  SizingStored,
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

export async function fetchPublicCatalog(locale?: string) {
  const qs = locale ? `?locale=${encodeURIComponent(locale)}` : "";
  return request<Catalog>(`/api/catalog${qs}`);
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
  collectionSlug?: string;
  collectionName?: string;
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

export type AdminOrderShippingAddress = {
  method?: "home" | "mondial_relay" | string | null;
  pickupId?: string | null;
  name: string | null;
  phone: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

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
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: AdminOrderShippingAddress | null;
  stripeSessionId: string | null;
  amountSubtotal?: number | null;
  amountShipping?: number | null;
  amountTotal: number | null;
  paidAt: string | null;
  shippedAt: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  trackingUrl: string | null;
  refundAmountCents: number | null;
  promoCode?: string | null;
  recoveryEmailSentAt?: string | null;
  recoveryEmailCount?: number;
  createdAt: string;
  items: {
    id: string;
    slug: string;
    name: string;
    variantTitle: string | null;
    sku?: string | null;
    productCode?: string | null;
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
  salesByMonth: { month: string; orders: number; revenueCents: number }[];
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
  brevoListId: string;
  copy: NewsletterCopy;
  hasBrevoKey: boolean;
};

export async function fetchAdminOrders(channel?: string) {
  const qs = channel ? `?channel=${encodeURIComponent(channel)}` : "";
  return request<{ orders: AdminOrder[]; count: number; source: string }>(`/api/admin/orders${qs}`);
}

export type AbandonedCheckout = AdminOrder & {
  estimatedTotalCents: number | null;
  recoveryStatus: "not_recovered" | "email_sent";
  productSummary: string;
};

export type AbandonedCheckoutsResponse = {
  checkouts: AbandonedCheckout[];
  count: number;
  withEmail: number;
  recoverySent: number;
  source: string;
};

export async function fetchAbandonedCheckouts(minAgeHours = 1) {
  return request<AbandonedCheckoutsResponse>(
    `/api/admin/orders/abandoned?minAgeHours=${encodeURIComponent(String(minAgeHours))}`,
  );
}

export async function sendAbandonedCheckoutRecovery(orderId: string) {
  return request<{ ok: boolean; order: AbandonedCheckout; email: string; provider: string }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}/send-recovery`,
    { method: "POST" },
  );
}

export async function fetchAdminOrder(orderId: string) {
  return request<{ order: AdminOrder; source: string }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}`,
  );
}

export type UpdateAdminOrderInput = {
  status: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  trackingUrl?: string;
  notifyCustomer?: boolean;
  refundAmountCents?: number;
  notes?: string;
};

export async function shipAdminOrder(
  orderId: string,
  body: {
    trackingNumber?: string;
    trackingCarrier?: string;
    trackingUrl?: string;
    notifyCustomer?: boolean;
  } = {},
) {
  return request<{ order: AdminOrder; source: string }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}/ship`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function updateAdminOrder(orderId: string, body: UpdateAdminOrderInput) {
  return request<{ order: AdminOrder; source: string }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function resendOrderConfirmation(orderId: string) {
  return request<{ ok: boolean; order: AdminOrder; email: string; provider: string }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}/resend-confirmation`,
    { method: "POST" },
  );
}

export function adminOrdersExportUrl(opts?: { from?: string; to?: string }) {
  const params = new URLSearchParams();
  if (opts?.from) params.set("from", opts.from);
  if (opts?.to) params.set("to", opts.to);
  const qs = params.toString();
  return qs ? `/api/admin/orders/export.csv?${qs}` : "/api/admin/orders/export.csv";
}

export async function fetchAdminAnalytics() {
  return request<{ analytics: AdminAnalytics; source: string }>("/api/admin/analytics");
}

export type AbandonedRecoverySettings = {
  enabled: boolean;
  minAgeHours: number;
  maxEmailsPerCart: number;
  minHoursBetweenEmails: number;
  promoCode: string;
  emailSubject: string;
  emailTitle: string;
  emailIntro: string;
  emailButtonLabel: string;
  emailClosing: string;
};

export async function fetchAbandonedRecoverySettings() {
  return request<{ settings: AbandonedRecoverySettings }>("/api/admin/abandoned-recovery/settings");
}

export async function updateAbandonedRecoverySettings(patch: Partial<AbandonedRecoverySettings>) {
  return request<{ settings: AbandonedRecoverySettings }>("/api/admin/abandoned-recovery/settings", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function runAbandonedRecoveryNow() {
  return request<{
    processed: number;
    sent: number;
    skipped: number;
    reason?: string;
    settings?: AbandonedRecoverySettings;
  }>("/api/admin/abandoned-recovery/run", { method: "POST" });
}

export type ProductAnalyticsRow = {
  slug: string;
  views: number;
  cartAdds: number;
  wishlistAdds: number;
};

export async function fetchProductAnalytics(days = 30, limit = 50) {
  return request<{
    analytics: { days: number; products: ProductAnalyticsRow[] };
    source: string;
  }>(`/api/admin/analytics/products?days=${encodeURIComponent(String(days))}&limit=${encodeURIComponent(String(limit))}`);
}

export type SiteTrafficAnalytics = {
  days: number;
  summary: { pageviews: number; visitors: number };
  realtime: { pageviews: number; visitors: number };
  byDay: { day: string; pageviews: number; visitors: number }[];
  topPages: { path: string; pageviews: number; visitors: number }[];
  bySource: { source: string; pageviews: number; visitors: number }[];
  byDevice: { device: string; pageviews: number; visitors: number }[];
};

export async function fetchSiteTraffic(days = 30) {
  return request<{ analytics: SiteTrafficAnalytics; source: string }>(
    `/api/admin/analytics/traffic?days=${encodeURIComponent(String(days))}`,
  );
}

export async function fetchAdminNewsletter() {
  return request<{
    settings: AdminNewsletterSettings;
    stats: {
      total: number;
      siteSignups: number;
      brevoTotal: number | null;
      brevoListName: string | null;
      bySource: Record<string, number>;
    };
    subscribers: { email: string; source: string; subscribedAt: string | null }[];
    source: string;
  }>("/api/admin/newsletter");
}

export async function updateAdminNewsletter(payload: {
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
  channel: "wolf_badger" | "influencer" | "other";
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

export async function createManualInvoiceOrder(payload: {
  customerEmail: string;
  shippingCountryCode: string;
  currency?: string;
  items: { productSlug: string; variantSlug?: string; qty: number; unitPrice: number }[];
  notes?: string;
  sendEmail?: boolean;
  discountType?: "percent" | "fixed" | null;
  discountValue?: number;
}) {
  return request<{
    order: AdminOrder;
    emailSent: boolean;
    email: string | null;
    paymentUrl: string | null;
    source: string;
  }>("/api/admin/orders/invoice", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type ManualInvoicePreview = {
  customerEmail: string;
  shippingCountryCode: string;
  currency: string;
  discountType: "percent" | "fixed" | null;
  discountValue: number;
  discountCents: number;
  grossSubtotal: number;
  amountSubtotal: number;
  amountShipping: number;
  amountTotal: number;
  shippingLabel: string;
  lines: {
    productSlug: string;
    name: string;
    variantSlug: string | null;
    variantTitle: string | null;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }[];
};

export async function previewManualInvoiceOrder(payload: {
  customerEmail: string;
  shippingCountryCode: string;
  currency?: string;
  items: { productSlug: string; variantSlug?: string; qty: number; unitPrice: number }[];
  notes?: string;
  discountType?: "percent" | "fixed" | null;
  discountValue?: number;
}) {
  return request<{ preview: ManualInvoicePreview; source: string }>(
    "/api/admin/orders/invoice/preview",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function sendOrderPaymentLink(orderId: string) {
  return request<{
    ok: boolean;
    order: AdminOrder;
    email: string;
    paymentUrl: string;
    provider: string;
  }>(`/api/admin/orders/${encodeURIComponent(orderId)}/send-payment-link`, {
    method: "POST",
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

export async function uploadProductImages(
  slug: string,
  files: FileList | File[],
  onProgress?: (progress: UploadProgress) => void,
) {
  return uploadAdminFiles(slug, files, onProgress);
}

/** Upload CMS assets (hero, photo strip, about sidebar…) under /uploads/cms/… */
export async function uploadCmsMedia(
  folder: string,
  files: FileList | File[],
  onProgress?: (progress: UploadProgress) => void,
) {
  return uploadAdminFiles(`cms/${folder}`, files, onProgress);
}

export async function fetchAdminSiteContent() {
  return request<{
    announcement: AnnouncementContent;
    homepage: HomepageContent;
    about: AboutStored;
    findUs: FindUsContent;
    contact: ContactContent;
    care: CareContent;
    sizing: SizingStored;
    footer: FooterContent;
    productMessages: ProductMessagesStored;
    stored: {
      announcement: Partial<AnnouncementContent>;
      homepage: Partial<HomepageContent>;
      about: AboutStored;
      findUs: Partial<FindUsContent>;
      contact: Partial<ContactContent>;
      care: Partial<CareContent>;
      sizing: SizingStored;
      footer: Partial<FooterContent>;
      productMessages: Partial<ProductMessagesStored>;
    };
    source: string;
  }>("/api/admin/content/site");
}

export async function updateAdminSiteContent(payload: {
  announcement?: Partial<AnnouncementContent>;
  homepage?: Partial<HomepageContent>;
  about?: AboutStored;
  findUs?: FindUsContent;
  contact?: ContactContent;
  care?: CareContent;
  sizing?: SizingStored;
  footer?: FooterContent;
  productMessages?: ProductMessagesStored;
}) {
  return request<{
    announcement: AnnouncementContent;
    homepage: HomepageContent;
    about: AboutStored;
    findUs: FindUsContent;
    contact: ContactContent;
    care: CareContent;
    sizing: SizingStored;
    footer: FooterContent;
    productMessages: ProductMessagesStored;
    stored: {
      announcement: Partial<AnnouncementContent>;
      homepage: Partial<HomepageContent>;
      about: AboutStored;
      findUs: Partial<FindUsContent>;
      contact: Partial<ContactContent>;
      care: Partial<CareContent>;
      sizing: SizingStored;
      footer: Partial<FooterContent>;
      productMessages: Partial<ProductMessagesStored>;
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

export async function saveAdminPost(
  post: Partial<JournalPost> & {
    slug: string;
    status?: string;
    locales?: Partial<Record<import("@/lib/i18n/messages").Locale, import("@/lib/content-types").JournalPostLocaleFields>>;
  },
) {
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

export async function reorderAdminCollections(orders: { slug: string; sortOrder: number }[]) {
  return request<{ collections: AdminCollectionMeta[] }>("/api/admin/collections/reorder", {
    method: "PATCH",
    body: JSON.stringify({ orders }),
  });
}

export async function reorderAdminProducts(orders: { slug: string; sortOrder: number }[]) {
  return request<{ catalog: Catalog }>("/api/admin/products/reorder", {
    method: "PATCH",
    body: JSON.stringify({ orders }),
  });
}

export async function patchProductStatus(slug: string, status: "published" | "draft") {
  return request<{ product: Product; catalog: Catalog }>(
    `/api/admin/products/${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export type AdminCmsStatus = {
  source: string;
  database: boolean;
  uploads: "r2" | "filesystem" | "unavailable";
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

export type AdminCustomer = {
  id: string;
  email: string;
  wishlist: string[];
  createdAt: string;
  updatedAt: string;
  orderCount: number;
};

export async function fetchAdminCustomers(wishlistOnly = false) {
  const qs = wishlistOnly ? "?wishlist=1" : "";
  return request<{
    customers: AdminCustomer[];
    stats: { total: number; withWishlist: number; totalWishlistItems: number };
    source: string;
  }>(`/api/admin/customers${qs}`);
}

export function adminCustomersExportUrl(wishlistOnly = false) {
  return wishlistOnly ? "/api/admin/customers/export.csv?wishlist=1" : "/api/admin/customers/export.csv";
}

export function adminCustomersBrevoExportUrl(wishlistOnly = false) {
  return wishlistOnly
    ? "/api/admin/customers/export-brevo.csv?wishlist=1"
    : "/api/admin/customers/export-brevo.csv";
}

export type TranslateStatus = {
  available: boolean;
  provider: string | null;
  hint: string | null;
};

export async function fetchTranslateStatus() {
  return request<TranslateStatus>("/api/admin/translate-page");
}

export async function autoTranslatePage(payload: {
  sourceLocale: string;
  targetLocales: string[];
  fields: { title: string; eyebrow: string; metaDescription: string; body: string[] };
}) {
  return request<{
    locales: Record<string, { title: string; eyebrow: string; metaDescription: string; body: string[] }>;
    provider: string;
  }>("/api/admin/translate-page", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function autoTranslatePost(payload: {
  sourceLocale: string;
  targetLocales: string[];
  fields: {
    title: string;
    excerpt: string;
    category: string;
    body: string[];
    blocks?: JournalPostBlock[];
  };
}) {
  return request<{
    locales: Record<
      string,
      { title: string; excerpt: string; category: string; body: string[]; blocks?: JournalPostBlock[] }
    >;
    provider: string;
  }>("/api/admin/translate-post", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function autoTranslateProduct(payload: {
  sourceLocale: string;
  targetLocales: string[];
  fields: { name: string; story: string; seoTitle: string; metaDescription: string };
}) {
  return request<{
    locales: Record<string, { name: string; story: string; seoTitle: string; metaDescription: string }>;
    provider: string;
  }>("/api/admin/translate-product", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function autoTranslateProductMessages(payload: {
  sourceLocale: string;
  targetLocales: string[];
  fields: {
    regionalUnavailable: string;
    soldOut: string;
    unavailableInRegion: string;
    addToBag: string;
    inStock: string;
  };
}) {
  return request<{
    locales: Record<
      string,
      {
        regionalUnavailable: string;
        soldOut: string;
        unavailableInRegion: string;
        addToBag: string;
        inStock: string;
      }
    >;
    provider: string;
  }>("/api/admin/translate-product-messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function autoTranslateSizing(payload: {
  sourceLocale: string;
  targetLocales: string[];
  fields: {
    title: string;
    eyebrow: string;
    metaDescription: string;
    body: string[];
    imageAlt: string;
    backLink: string;
  };
}) {
  return request<{
    locales: Record<
      string,
      {
        title: string;
        eyebrow: string;
        metaDescription: string;
        body: string[];
        imageAlt: string;
        backLink: string;
      }
    >;
    provider: string;
  }>("/api/admin/translate-sizing", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function autoTranslateAbout(payload: {
  sourceLocale: string;
  targetLocales: string[];
  fields: {
    title: string;
    eyebrow: string;
    metaDescription: string;
    sections: { id: string; eyebrow: string; title: string; body: string }[];
    values: { n: string; t: string; d: string }[];
    sidebarLinks: {
      label: string;
      to: string;
      hash?: string;
      image: string;
      imageFocal?: { x: number; y: number };
    }[];
  };
}) {
  return request<{
    locales: Record<
      string,
      {
        title: string;
        eyebrow: string;
        metaDescription: string;
        sections: { id: string; eyebrow: string; title: string; body: string }[];
        values: { n: string; t: string; d: string }[];
        sidebarLinks: {
          label: string;
          to: string;
          hash?: string;
          image: string;
          imageFocal?: { x: number; y: number };
        }[];
      }
    >;
    provider: string;
  }>("/api/admin/translate-about", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchCollectionProducts(slug: string) {
  return request<{ products: { slug: string; name: string; isPrimary: boolean }[] }>(
    `/api/admin/collections/${encodeURIComponent(slug)}/products`,
  );
}

export async function patchCollectionProducts(
  slug: string,
  payload: { add?: string[]; remove?: string[] },
) {
  return request<{ products: { slug: string; name: string; isPrimary: boolean }[] }>(
    `/api/admin/collections/${encodeURIComponent(slug)}/products`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export type PromoRules = {
  scope: "all" | "collections" | "products";
  collectionSlugs: string[];
  productSlugs: string[];
  minSubtotalEur: number | null;
  startsAt: string | null;
  /** Empty = all countries. Otherwise ISO codes e.g. ["FR","DE"]. */
  countryCodes: string[];
};

export const DEFAULT_PROMO_RULES: PromoRules = {
  scope: "all",
  collectionSlugs: [],
  productSlugs: [],
  minSubtotalEur: null,
  startsAt: null,
  countryCodes: [],
};

export type AdminPromoCode = {
  id: string;
  code: string;
  label: string;
  category: string;
  discountType: "percent" | "fixed" | "free";
  discountValue: number;
  freeShipping: boolean;
  maxUses: number | null;
  usedCount: number;
  influencerName: string;
  active: boolean;
  expiresAt: string | null;
  rules: PromoRules;
};

export async function fetchAdminPromotions() {
  return request<{ promos: AdminPromoCode[] }>("/api/admin/promotions");
}

export async function createAdminPromotion(payload: Partial<AdminPromoCode>) {
  return request<{ promo: AdminPromoCode }>("/api/admin/promotions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminPromotion(id: string, payload: Partial<AdminPromoCode>) {
  return request<{ promo: AdminPromoCode }>(`/api/admin/promotions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminPromotion(id: string) {
  return request<{ ok: boolean }>(`/api/admin/promotions/${id}`, { method: "DELETE" });
}

export type AdminFinance = {
  summary: {
    paidOrders: number;
    revenueEurCents: number;
    activeOrders: number;
    refundCount: number;
  };
  refunds: {
    id: string;
    status: string;
    channel: string;
    currency: string;
    amountTotal: number | null;
    refundAmountCents: number | null;
    customerEmail: string | null;
    promoCode: string | null;
    paidAt: string | null;
    updatedAt: string;
  }[];
  stripeDashboardUrl: string;
  stripePayoutsUrl: string;
};

export async function fetchAdminFinance() {
  return request<AdminFinance>("/api/admin/finance");
}

export type ReadinessRow = {
  slug: string;
  name: string;
  status: string;
  collection: string;
  stockFrance: number;
  stockBali: number;
  hasImage: boolean;
  variantCount: number;
  problems: string[];
};

export async function fetchAdminReadiness() {
  return request<{
    summary: { total: number; published: number; ready: number; needsAttention: number };
    issues: ReadinessRow[];
    ready: ReadinessRow[];
  }>("/api/admin/readiness");
}

export async function fetchAdminCountryShipping() {
  return request<{ rows: CountryShippingRow[]; source: string }>("/api/admin/country-shipping");
}

export async function updateAdminCountryShipping(config: {
  countries: Record<
    string,
    { enabled: boolean; warehouse: "france" | "bali"; shippingPrice: number }
  >;
}) {
  return request<{ rows: CountryShippingRow[]; source: string }>("/api/admin/country-shipping", {
    method: "PATCH",
    body: JSON.stringify(config),
  });
}

export type ShippingZone = {
  id: string;
  name: string;
  countries: string[];
  rates: { EUR: number; USD: number; IDR: number };
};

export async function fetchAdminShipping() {
  return request<{ settings: { zones: ShippingZone[] } }>("/api/admin/shipping");
}

export async function updateAdminShipping(zones: ShippingZone[]) {
  return request<{ settings: { zones: ShippingZone[] } }>("/api/admin/shipping", {
    method: "PATCH",
    body: JSON.stringify({ zones }),
  });
}

export type FulfillmentZonesSettings = {
  franceWarehouseCountries: string[];
  baliWarehouseCountries: string[];
  restOfWorldWarehouse: "france" | "bali";
};

export async function fetchAdminFulfillmentZones() {
  return request<{ zones: FulfillmentZonesSettings; source: string }>("/api/admin/fulfillment-zones");
}

export async function updateAdminFulfillmentZones(zones: FulfillmentZonesSettings) {
  return request<{ zones: FulfillmentZonesSettings; source: string }>("/api/admin/fulfillment-zones", {
    method: "PATCH",
    body: JSON.stringify(zones),
  });
}
