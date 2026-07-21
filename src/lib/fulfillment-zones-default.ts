import type { FulfillmentZones } from "@/lib/fulfillment-zones-types";

export const DEFAULT_FULFILLMENT_ZONES: FulfillmentZones = {
  franceWarehouseCountries: [
    "FR", "DE", "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "ES", "EE", "FI", "GR", "HU", "IE",
    "IT", "LV", "LT", "LU", "MT", "MC", "NL", "PL", "PT", "RO", "SK", "SI", "SE", "GB", "CH",
    "NO", "AD", "GF", "GP", "MQ", "YT", "RE", "BL", "MF", "PM", "AX", "JE",
  ],
  baliWarehouseCountries: ["ID", "AU", "NZ", "SG", "HK", "JP", "KR", "TW", "TH", "VN", "MY", "NC", "PF"],
  restOfWorldWarehouse: "bali",
};

export function normalizeFulfillmentZones(raw: Partial<FulfillmentZones> | null | undefined): FulfillmentZones {
  const base = DEFAULT_FULFILLMENT_ZONES;
  const france = Array.isArray(raw?.franceWarehouseCountries)
    ? raw.franceWarehouseCountries.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
    : base.franceWarehouseCountries;
  const bali = Array.isArray(raw?.baliWarehouseCountries)
    ? raw.baliWarehouseCountries.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
    : base.baliWarehouseCountries;
  const rest = raw?.restOfWorldWarehouse === "france" ? "france" : "bali";
  return {
    franceWarehouseCountries: france,
    baliWarehouseCountries: bali,
    restOfWorldWarehouse: rest,
  };
}
