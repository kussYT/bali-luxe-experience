import type { Currency } from "@/lib/currency";

export type ShippingCountry = {
  code: string;
  name: string;
  currency: Currency;
  /** Display like Shopify: "EUR €" */
  currencyLabel: string;
};

function entry(name: string, code: string, currency: Currency): ShippingCountry {
  const currencyLabel =
    currency === "EUR" ? "EUR €" : currency === "USD" ? "USD $" : "IDR Rp";
  return { code, name, currency, currencyLabel };
}

const eur = (name: string, code: string) => entry(name, code, "EUR");
const usd = (name: string, code: string) => entry(name, code, "USD");
const idr = (name: string, code: string) => entry(name, code, "IDR");

/**
 * Shipping destinations — currency is EUR, USD, or IDR (checkout supports these three).
 * EUR: eurozone + linked territories. USD: rest of world. IDR: Indonesia.
 */
export const SHIPPING_COUNTRIES: ShippingCountry[] = [
  // —— Eurozone & €-linked territories ——
  eur("France", "FR"),
  eur("Germany", "DE"),
  eur("Austria", "AT"),
  eur("Belgium", "BE"),
  eur("Croatia", "HR"),
  eur("Cyprus", "CY"),
  eur("Estonia", "EE"),
  eur("Spain", "ES"),
  eur("Finland", "FI"),
  eur("Greece", "GR"),
  eur("Ireland", "IE"),
  eur("Italy", "IT"),
  eur("Latvia", "LV"),
  eur("Lithuania", "LT"),
  eur("Luxembourg", "LU"),
  eur("Malta", "MT"),
  eur("Monaco", "MC"),
  eur("Netherlands", "NL"),
  eur("Portugal", "PT"),
  eur("Slovakia", "SK"),
  eur("Slovenia", "SI"),
  eur("Andorra", "AD"),
  eur("Kosovo", "XK"),
  eur("Vatican City", "VA"),
  eur("French Guiana", "GF"),
  eur("Guadeloupe", "GP"),
  eur("Martinique", "MQ"),
  eur("Mayotte", "YT"),
  eur("Réunion", "RE"),
  eur("Saint Barthélemy", "BL"),
  eur("Saint Martin", "MF"),
  eur("Saint Pierre and Miquelon", "PM"),
  eur("French Southern Territories", "TF"),
  eur("Åland Islands", "AX"),
  eur("New Caledonia", "NC"),
  eur("Wallis and Futuna", "WF"),

  // —— EU & Europe (local currency → USD display at checkout) ——
  usd("Bulgaria", "BG"),
  usd("Czechia", "CZ"),
  usd("Denmark", "DK"),
  usd("Hungary", "HU"),
  usd("Poland", "PL"),
  usd("Romania", "RO"),
  usd("Sweden", "SE"),
  usd("Norway", "NO"),
  usd("United Kingdom", "GB"),
  usd("Switzerland", "CH"),
  usd("Jersey", "JE"),
  usd("Belarus", "BY"),
  usd("Ukraine", "UA"),
  usd("Serbia", "RS"),
  usd("Turkey", "TR"),
  usd("Armenia", "AM"),
  usd("Georgia", "GE"),

  // —— Americas ——
  usd("United States", "US"),
  usd("Canada", "CA"),
  usd("Mexico", "MX"),
  usd("Brazil", "BR"),
  usd("Argentina", "AR"),
  usd("Chile", "CL"),
  usd("Colombia", "CO"),
  usd("Peru", "PE"),
  usd("Uruguay", "UY"),
  usd("Paraguay", "PY"),
  usd("Venezuela", "VE"),
  usd("Ecuador", "EC"),
  usd("Costa Rica", "CR"),
  usd("Panama", "PA"),
  usd("Guatemala", "GT"),
  usd("Honduras", "HN"),
  usd("El Salvador", "SV"),
  usd("Nicaragua", "NI"),
  usd("Dominican Republic", "DO"),
  usd("Jamaica", "JM"),
  usd("Haiti", "HT"),
  usd("Bahamas", "BS"),
  usd("Barbados", "BB"),
  usd("Bermuda", "BM"),
  usd("Cayman Islands", "KY"),
  usd("Suriname", "SR"),

  // —— Asia-Pacific & Middle East ——
  usd("Australia", "AU"),
  usd("New Zealand", "NZ"),
  usd("Singapore", "SG"),
  usd("Hong Kong", "HK"),
  usd("Japan", "JP"),
  usd("South Korea", "KR"),
  usd("Taiwan", "TW"),
  usd("Thailand", "TH"),
  usd("Vietnam", "VN"),
  usd("Malaysia", "MY"),
  usd("United Arab Emirates", "AE"),
  usd("Qatar", "QA"),
  usd("Morocco", "MA"),

  // —— Indonesia ——
  idr("Indonesia", "ID"),
];

export const DEFAULT_SHIPPING_COUNTRY = "FR";

export function getShippingCountry(code: string): ShippingCountry {
  return SHIPPING_COUNTRIES.find((c) => c.code === code) ?? SHIPPING_COUNTRIES[0];
}

export function formatShippingLabel(c: ShippingCountry) {
  return `${c.name} (${c.currencyLabel})`;
}
