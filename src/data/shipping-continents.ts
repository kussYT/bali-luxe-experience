import type { Currency } from "@/lib/currency";
import { SHIPPING_COUNTRIES } from "@/data/shipping-countries";
import type { WarehouseId } from "@/lib/catalog-types";

export type ShippingContinentId = "europe" | "americas" | "asia-pacific" | "indonesia";

export type ShippingContinent = {
  id: ShippingContinentId;
  label: string;
  countryCodes: string[];
};

const EUROPE_CODES = new Set([
  "FR", "DE", "AT", "BE", "HR", "CY", "EE", "ES", "FI", "GR", "IE", "IT", "LV", "LT", "LU", "MT",
  "MC", "NL", "PT", "SK", "SI", "AD", "XK", "VA", "GF", "GP", "MQ", "YT", "RE", "BL", "MF", "PM",
  "TF", "AX", "NC", "WF", "BG", "CZ", "DK", "HU", "PL", "RO", "SE", "NO", "GB", "CH", "JE", "BY",
  "UA", "RS", "TR", "AM", "GE",
]);

const AMERICAS_CODES = new Set([
  "US", "CA", "MX", "BR", "AR", "CL", "CO", "PE", "UY", "PY", "VE", "EC", "CR", "PA", "GT", "HN",
  "SV", "NI", "DO", "JM", "HT", "BS", "BB", "BM", "KY", "SR",
]);

const ASIA_PACIFIC_CODES = new Set([
  "AU", "NZ", "SG", "HK", "JP", "KR", "TW", "TH", "VN", "MY", "AE", "QA", "MA",
]);

const BALI_WAREHOUSE_CODES = new Set([
  "ID", "AU", "NZ", "SG", "HK", "JP", "KR", "TW", "TH", "VN", "MY", "NC", "PF",
]);

export function continentForCountry(code: string): ShippingContinentId {
  if (code === "ID") return "indonesia";
  if (EUROPE_CODES.has(code)) return "europe";
  if (AMERICAS_CODES.has(code)) return "americas";
  if (ASIA_PACIFIC_CODES.has(code)) return "asia-pacific";
  return "asia-pacific";
}

export function defaultWarehouseForCountry(code: string): WarehouseId {
  if (BALI_WAREHOUSE_CODES.has(code)) return "bali";
  if (EUROPE_CODES.has(code)) return "france";
  return "bali";
}

export function defaultShippingPrice(currency: Currency): number {
  if (currency === "EUR") return 8;
  if (currency === "IDR") return 200_000;
  return 18;
}

export const SHIPPING_CONTINENTS: ShippingContinent[] = [
  { id: "europe", label: "Europe", countryCodes: [] },
  { id: "americas", label: "Amériques", countryCodes: [] },
  { id: "asia-pacific", label: "Asie-Pacifique & Moyen-Orient", countryCodes: [] },
  { id: "indonesia", label: "Indonésie", countryCodes: [] },
];

for (const c of SHIPPING_COUNTRIES) {
  const continent = continentForCountry(c.code);
  const group = SHIPPING_CONTINENTS.find((g) => g.id === continent);
  group?.countryCodes.push(c.code);
}

export function getCountryMeta(code: string) {
  return SHIPPING_COUNTRIES.find((c) => c.code === code);
}
