import type { Currency } from "@/lib/currency";

/** Extensible market — add shipping zones, locale, product availability later */
export type Market = {
  id: string;
  label: string;
  region: string;
  countryCode: string;
  currency: Currency;
  locale: string;
  flag: string;
  /** ISO 3166-1 alpha-2 for currency provider, or logical code */
  shipToCode: string;
  shippingNote?: string;
};

export const MARKETS: Market[] = [
  {
    id: "fr-eu",
    label: "France / Europe",
    region: "Europe",
    countryCode: "FR",
    shipToCode: "FR",
    currency: "EUR",
    locale: "fr",
    flag: "🇫🇷",
    shippingNote: "EU delivery · duties may apply outside the EU",
  },
  {
    id: "asia",
    label: "Asia",
    region: "Asia",
    countryCode: "AS",
    shipToCode: "SG",
    currency: "USD",
    locale: "en",
    flag: "🌏",
    shippingNote: "Regional shipping from Singapore hub",
  },
  {
    id: "id",
    label: "Indonesia",
    region: "Asia",
    countryCode: "ID",
    shipToCode: "ID",
    currency: "IDR",
    locale: "en",
    flag: "🇮🇩",
    shippingNote: "Ships from Bali",
  },
  {
    id: "us",
    label: "United States",
    region: "Americas",
    countryCode: "US",
    shipToCode: "US",
    currency: "USD",
    locale: "en",
    flag: "🇺🇸",
  },
  {
    id: "au",
    label: "Australia",
    region: "Oceania",
    countryCode: "AU",
    shipToCode: "AU",
    currency: "USD",
    locale: "en",
    flag: "🇦🇺",
  },
  {
    id: "gb",
    label: "United Kingdom",
    region: "Europe",
    countryCode: "GB",
    shipToCode: "GB",
    currency: "EUR",
    locale: "en",
    flag: "🇬🇧",
    shippingNote: "Prices in EUR · local duties may apply",
  },
];

export const DEFAULT_MARKET_ID = "fr-eu";

export function getMarketById(id: string): Market {
  return MARKETS.find((m) => m.id === id) ?? MARKETS[0];
}
