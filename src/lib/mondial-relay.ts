/** Client-side Mondial Relay helpers (mirror server country list). */

export const MONDIAL_RELAY_COUNTRIES = ["FR", "BE", "LU", "NL", "ES"] as const;

export type MondialRelayCountry = (typeof MONDIAL_RELAY_COUNTRIES)[number];

export type MondialRelayPickup = {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
};

export function isMondialRelayCountry(countryCode: string | null | undefined): boolean {
  const code = String(countryCode || "")
    .trim()
    .toUpperCase();
  return (MONDIAL_RELAY_COUNTRIES as readonly string[]).includes(code);
}

export type ShippingMethod = "home" | "mondial_relay";
