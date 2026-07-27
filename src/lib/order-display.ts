import type { AdminOrder } from "@/lib/admin-api";

/** Short product code from name, e.g. "Rimba Slightly" → "RS" (padded to 3 when possible). */
export function suggestProductCode(name: string): string {
  const words = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 0 && !/^(the|and|le|la|les|de|du|des|a|an|of|x)$/i.test(w));

  if (!words.length) return "REF";

  let code = words.map((w) => w[0].toUpperCase()).join("");
  if (code.length >= 3) return code.slice(0, 3);

  const first = words[0].toUpperCase();
  for (let i = 1; i < first.length && code.length < 3; i++) {
    code += first[i];
  }
  return code.slice(0, 3);
}

function sizeToken(variantTitle?: string | null): string | null {
  const raw = String(variantTitle || "").trim();
  if (!raw || /^default(\s+title)?$/i.test(raw)) return null;
  // Prefer trailing size token: "Size M" → M, "M" → M
  const m = raw.match(/\b(XXS|XS|S|M|L|XL|XXL|XXXL|\d{2,3})\b/i);
  if (m) return m[1].toUpperCase();
  return raw.replace(/\s+/g, "").slice(0, 6).toUpperCase();
}

/**
 * Display ref for packing: "RSP-M".
 * Uses stored SKU when present, otherwise derives from product name + size.
 */
export function productLineRef(opts: {
  name: string;
  variantTitle?: string | null;
  sku?: string | null;
  productCode?: string | null;
}): string {
  const sku = opts.sku?.trim();
  if (sku) return sku.toUpperCase();

  const base = (opts.productCode?.trim() || suggestProductCode(opts.name)).toUpperCase();
  const size = sizeToken(opts.variantTitle);
  return size ? `${base}-${size}` : base;
}

export function orderProductSummary(
  items: {
    name: string;
    variantTitle?: string | null;
    sku?: string | null;
    productCode?: string | null;
    qty: number;
  }[],
): { refs: string; count: number } {
  const count = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  if (!items.length) return { refs: "—", count: 0 };
  const refs = items
    .map((i) => {
      const ref = productLineRef(i);
      return i.qty > 1 ? `${ref}×${i.qty}` : ref;
    })
    .join(", ");
  return { refs, count };
}

export type OrderRowTone = "shipped" | "process" | "invoice" | "pending" | "neutral";

export function orderRowTone(order: Pick<AdminOrder, "status" | "externalRef" | "notes">): OrderRowTone {
  const manual =
    order.externalRef === "manual_invoice" || (order.notes || "").includes("[manual_invoice]");

  if (order.status === "shipped" || order.status === "cancelled" || order.status === "refunded") {
    return "shipped";
  }
  if (["paid", "processing", "on_hold"].includes(order.status)) {
    return "process";
  }
  if (order.status === "pending" && manual) {
    return "invoice";
  }
  if (order.status === "pending") {
    return "pending";
  }
  return "neutral";
}

export const ORDER_ROW_TONE_CLASS: Record<OrderRowTone, string> = {
  shipped: "bg-muted/70 text-muted-foreground",
  process: "bg-emerald-50/90",
  invoice: "bg-orange-50",
  pending: "bg-white",
  neutral: "",
};

export function sortOrdersForAdmin<T extends Pick<AdminOrder, "status" | "externalRef" | "notes" | "createdAt">>(
  orders: T[],
): T[] {
  const rank = (o: T) => {
    const tone = orderRowTone(o);
    if (tone === "process") return 0;
    if (tone === "invoice") return 1;
    if (tone === "pending") return 2;
    if (tone === "neutral") return 3;
    return 4;
  };
  return [...orders].sort((a, b) => {
    const d = rank(a) - rank(b);
    if (d !== 0) return d;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
