/** Mondial Relay Point Relais — countries & helpers shared by client/server. */

export const MONDIAL_RELAY_COUNTRIES = ["FR", "BE", "LU", "NL", "ES"];

export function isMondialRelayCountry(countryCode) {
  const code = String(countryCode || "")
    .trim()
    .toUpperCase();
  return MONDIAL_RELAY_COUNTRIES.includes(code);
}

/** Brand must be exactly 8 characters (pad with spaces on the right). */
export function padMondialRelayBrand(brandId) {
  const raw = String(brandId || "BDTEST").trim();
  return (raw + "        ").slice(0, 8);
}

export function getMondialRelayBrandId() {
  return padMondialRelayBrand(process.env.MONDIAL_RELAY_BRAND_ID || "BDTEST");
}

/**
 * Normalize pickup payload from the cart widget / API body.
 * @returns {null | {
 *   method: 'mondial_relay',
 *   pickupId: string,
 *   name: string,
 *   line1: string | null,
 *   line2: string | null,
 *   city: string | null,
 *   state: null,
 *   postalCode: string | null,
 *   country: string,
 *   phone: null
 * }}
 */
export function normalizePickupPoint(input, fallbackCountry = "FR") {
  if (!input || typeof input !== "object") return null;
  const pickupId = String(input.id || input.pickupId || input.ID || "").trim();
  if (!pickupId) return null;

  const country = String(input.country || input.Pays || fallbackCountry)
    .trim()
    .toUpperCase()
    .slice(0, 2);
  if (!isMondialRelayCountry(country)) return null;

  const name = String(input.name || input.Nom || "").trim() || `Point Relais ${pickupId}`;
  const line1 = String(input.line1 || input.Adresse1 || input.address1 || "").trim() || null;
  const line2 = String(input.line2 || input.Adresse2 || input.address2 || "").trim() || null;
  const city = String(input.city || input.Ville || "").trim() || null;
  const postalCode = String(input.postalCode || input.CP || input.zip || "").trim() || null;

  return {
    method: "mondial_relay",
    pickupId,
    name,
    line1,
    line2,
    city,
    state: null,
    postalCode,
    country,
    phone: null,
  };
}

export function isMondialRelayAddress(details) {
  return details?.method === "mondial_relay" && Boolean(details?.pickupId);
}
