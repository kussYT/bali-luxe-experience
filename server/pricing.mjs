/** Shared unit pricing (EUR list/sale → display currencies) */

export function unitPriceEur(product) {
  if (product.onSale && product.compareAtEUR != null) return Number(product.compareAtEUR);
  return Number(product.priceEUR);
}

export function unitPrice(product, currency) {
  const eur = unitPriceEur(product);
  if (currency === "EUR") return eur;
  if (currency === "USD") return Number(product.priceUSD) || Math.round(eur * 1.1);
  return Number(product.priceIDR) || Math.round(eur * 17_000);
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
