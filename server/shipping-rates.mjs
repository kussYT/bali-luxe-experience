import { SHIPPING_FLAT } from "./pricing.mjs";
import { getSetting, setSetting } from "./db/settings-store.mjs";
import { shippingPriceForCountry as matrixPrice } from "./db/country-shipping.mjs";

export const DEFAULT_SHIPPING_SETTINGS = {
  zones: [
    {
      id: "europe",
      name: "Europe",
      countries: [
        "FR", "DE", "AT", "BE", "ES", "IT", "NL", "PT", "IE", "GB", "CH", "LU", "MC",
      ],
      rates: { EUR: 8, USD: 12, IDR: 120_000 },
    },
    {
      id: "world",
      name: "Rest of world",
      countries: ["*"],
      rates: { EUR: 15, USD: 18, IDR: 200_000 },
    },
  ],
};

export async function getShippingSettings() {
  const stored = await getSetting("shipping", null);
  if (!stored?.zones?.length) return DEFAULT_SHIPPING_SETTINGS;
  return { zones: stored.zones };
}

export async function saveShippingSettings(settings) {
  await setSetting("shipping", settings);
  return settings;
}

export async function shippingAmountForCountry(countryCode, currency) {
  const countryShipping = await getSetting("countryShipping", null);
  if (countryShipping?.countries && Object.keys(countryShipping.countries).length > 0) {
    const price = await matrixPrice(countryCode, currency);
    if (price == null) {
      const err = new Error(`Livraison non disponible pour ce pays (${countryCode})`);
      err.status = 400;
      throw err;
    }
    return price;
  }
  const settings = await getShippingSettings();
  const code = (countryCode || "FR").toUpperCase();
  let zone = settings.zones.find((z) => z.countries.includes(code));
  if (!zone) {
    zone = settings.zones.find((z) => z.countries.includes("*"));
  }
  const rates = zone?.rates || SHIPPING_FLAT;
  return rates[currency] ?? SHIPPING_FLAT[currency] ?? SHIPPING_FLAT.EUR;
}
