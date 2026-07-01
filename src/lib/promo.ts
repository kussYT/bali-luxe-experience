import type { CartItem } from "@/lib/cart";
import type { Currency } from "@/lib/currency";

export const PROMO_STORAGE_KEY = "bingin-promo-code";

export type PromoPreview = {
  valid: boolean;
  promo?: {
    code: string;
    label: string;
    discountType: string;
    discountValue: number;
    freeShipping: boolean;
    influencerName?: string;
  };
  amounts?: {
    isFullyFree: boolean;
    totalSmallest: number;
  };
};

export function readStoredPromo(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PROMO_STORAGE_KEY)?.trim() || "";
}

export function writeStoredPromo(code: string) {
  if (typeof window === "undefined") return;
  const trimmed = code.trim();
  if (trimmed) localStorage.setItem(PROMO_STORAGE_KEY, trimmed);
  else localStorage.removeItem(PROMO_STORAGE_KEY);
}

export async function validatePromo(
  code: string,
  items: CartItem[],
  currency: Currency,
  countryCode: string,
): Promise<PromoPreview> {
  const res = await fetch("/api/promo/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, items, currency, countryCode }),
  });
  const data = (await res.json()) as PromoPreview & { error?: string };
  if (!res.ok) throw new Error(data.error || "Code invalide");
  return data;
}
