export type ProductAnalyticsEventType = "view" | "cart" | "wishlist";

export function trackProductEvent(slug: string, type: ProductAnalyticsEventType) {
  if (typeof window === "undefined" || !slug?.trim()) return;

  const key = `bingin-analytics:${type}:${slug}`;
  if (type === "view" && sessionStorage.getItem(key)) return;
  if (type === "view") sessionStorage.setItem(key, "1");

  fetch("/api/analytics/product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, type }),
    keepalive: true,
  }).catch(() => {});
}

export function productFocalAt(product: { imageFocals?: { x: number; y: number }[] }, index: number) {
  const focal = product.imageFocals?.[index];
  if (!focal) return undefined;
  return `${focal.x}% ${focal.y}%`;
}
