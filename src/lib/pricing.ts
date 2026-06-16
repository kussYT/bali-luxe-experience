import type { Product } from "@/lib/catalog-types";
import type { Currency } from "@/lib/currency";

export function getUnitPriceEur(product: Product) {
  if (product.onSale && product.compareAtEUR != null) return product.compareAtEUR;
  return product.priceEUR;
}

export function getUnitPrice(product: Product, currency: Currency) {
  const eur = getUnitPriceEur(product);
  if (currency === "EUR") return eur;
  if (currency === "USD") return product.priceUSD || Math.round(eur * 1.1);
  return product.priceIDR || Math.round(eur * 17_000);
}

export function formatMoney(amount: number, currency: Currency) {
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "Rp ";
  return `${symbol}${amount.toLocaleString("en-US")}`;
}
