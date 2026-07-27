/** Shared unit pricing (EUR list/sale → display currencies) */

/** Keep storefront + checkout in sync (admin prices are EUR; IDR/USD are derived unless overridden). */
export const EUR_TO_USD = 1.1;
/** Boutique FX — update when Beatrice wants a new rate (was 17_000). */
export const EUR_TO_IDR = 20_000;

export function unitPriceEur(product) {
  if (product.onSale && product.compareAtEUR != null) return Number(product.compareAtEUR);
  return Number(product.priceEUR);
}

export function unitPrice(product, currency) {
  const eur = unitPriceEur(product);
  if (currency === "EUR") return eur;
  // Prefer catalog prices when set (admin can override FX); else derive from EUR.
  if (currency === "USD") {
    const stored = Number(product.priceUSD);
    if (Number.isFinite(stored) && stored > 0) return stored;
    return Math.round(eur * EUR_TO_USD);
  }
  const storedIdr = Number(product.priceIDR);
  if (Number.isFinite(storedIdr) && storedIdr > 0) return storedIdr;
  return Math.round(eur * EUR_TO_IDR);
}

/** Stripe amount in smallest currency unit */
export function toStripeAmount(amount, currency) {
  if (currency === "IDR") return Math.round(amount);
  return Math.round(amount * 100);
}

export function stripeCurrency(currency) {
  return currency.toLowerCase();
}

export const SHIPPING_FLAT = {
  EUR: 8,
  USD: 10,
  IDR: 120_000,
};
