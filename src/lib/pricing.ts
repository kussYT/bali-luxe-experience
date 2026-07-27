import type { Product } from "@/lib/catalog-types";
import type { Currency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/messages";
import { formatMoneyAmount } from "@/lib/format-money";

/** Keep in sync with server/pricing.mjs */
export const EUR_TO_USD = 1.1;
/** Boutique FX — update with server/pricing.mjs when Beatrice changes the rate. */
export const EUR_TO_IDR = 20_000;

export function getUnitPriceEur(product: Product) {
  if (product.onSale && product.compareAtEUR != null) return product.compareAtEUR;
  return product.priceEUR;
}

export function getUnitPrice(product: Product, currency: Currency) {
  const eur = getUnitPriceEur(product);
  if (currency === "EUR") return eur;
  if (currency === "USD") {
    if (product.priceUSD != null && product.priceUSD > 0) return product.priceUSD;
    return Math.round(eur * EUR_TO_USD);
  }
  if (product.priceIDR != null && product.priceIDR > 0) return product.priceIDR;
  return Math.round(eur * EUR_TO_IDR);
}

export function formatMoney(amount: number, currency: Currency, locale: Locale = "fr") {
  return formatMoneyAmount(amount, currency, locale);
}
