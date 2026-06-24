import {
  DEFAULT_SHIPPING_COUNTRY,
  getShippingCountry,
  SHIPPING_COUNTRIES,
  type ShippingCountry,
} from "@/data/shipping-countries";
import { flagEmoji } from "@/lib/flags";
import type { Country, Currency } from "@/lib/currency";

export const SHIPPING_STORAGE_KEY = "bingin-shipping-country";
export const SHIPPING_MANUAL_KEY = "bingin-shipping-manual";
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

export function readShippingManual(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SHIPPING_MANUAL_KEY) === "1";
}

export function writeShippingManual(manual: boolean) {
  localStorage.setItem(SHIPPING_MANUAL_KEY, manual ? "1" : "0");
}

export function shippingToCountry(c: ShippingCountry): Country {
  return {
    code: c.code,
    name: c.name,
    currency: c.currency as Currency,
    flag: flagEmoji(c.code),
  };
}

export { getShippingCountry, SHIPPING_COUNTRIES, type ShippingCountry };
