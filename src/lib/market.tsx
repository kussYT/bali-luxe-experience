import {
  DEFAULT_SHIPPING_COUNTRY,
  getShippingCountry,
  SHIPPING_COUNTRIES,
  type ShippingCountry,
} from "@/data/shipping-countries";
import type { Country, Currency } from "@/lib/currency";

export const SHIPPING_STORAGE_KEY = "bingin-shipping-country";
/** @deprecated use SHIPPING_STORAGE_KEY */
export const MARKET_STORAGE_KEY = SHIPPING_STORAGE_KEY;

const LEGACY_MARKET_MAP: Record<string, string> = {
  "fr-eu": "FR",
  asia: "SG",
  id: "ID",
  us: "US",
  au: "AU",
  gb: "GB",
};

export function readShippingCountryCode(): string | null {
  if (typeof window === "undefined") return null;

  const code = localStorage.getItem(SHIPPING_STORAGE_KEY);
  if (code && SHIPPING_COUNTRIES.some((c) => c.code === code)) return code;

  const legacyMarket = localStorage.getItem("bingin-market");
  if (legacyMarket && LEGACY_MARKET_MAP[legacyMarket]) {
    return LEGACY_MARKET_MAP[legacyMarket];
  }

  return null;
}

export function writeShippingCountryCode(code: string) {
  localStorage.setItem(SHIPPING_STORAGE_KEY, code);
}

export function shippingToCountry(c: ShippingCountry): Country {
  return {
    code: c.code,
    name: c.name,
    currency: c.currency as Currency,
    flag: "",
  };
}

export { getShippingCountry, SHIPPING_COUNTRIES, type ShippingCountry };
