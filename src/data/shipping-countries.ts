import type { Currency } from "@/lib/currency";

export type ShippingCountry = {
  code: string;
  name: string;
  currency: Currency;
  /** Display like Shopify: "EUR €" */
  currencyLabel: string;
};

function eur(name: string, code: string): ShippingCountry {
  return { code, name, currency: "EUR", currencyLabel: "EUR €" };
}

function usd(name: string, code: string): ShippingCountry {
  return { code, name, currency: "USD", currencyLabel: "USD $" };
}

function idr(name: string, code: string): ShippingCountry {
  return { code, name, currency: "IDR", currencyLabel: "IDR Rp" };
}

/** Shipping destinations — aligned with bingindiaries.com currency selector */
export const SHIPPING_COUNTRIES: ShippingCountry[] = [
  eur("France", "FR"),
  eur("Germany", "DE"),
  eur("Austria", "AT"),
  eur("Belgium", "BE"),
  eur("Bulgaria", "BG"),
  eur("Croatia", "HR"),
  eur("Cyprus", "CY"),
  eur("Czechia", "CZ"),
  eur("Denmark", "DK"),
  eur("Spain", "ES"),
  eur("Estonia", "EE"),
  eur("Finland", "FI"),
  eur("Greece", "GR"),
  eur("Hungary", "HU"),
  eur("Ireland", "IE"),
  eur("Italy", "IT"),
  eur("Latvia", "LV"),
  eur("Lithuania", "LT"),
  eur("Luxembourg", "LU"),
  eur("Malta", "MT"),
  eur("Monaco", "MC"),
  eur("Netherlands", "NL"),
  eur("Poland", "PL"),
  eur("Portugal", "PT"),
  eur("Romania", "RO"),
  eur("Slovakia", "SK"),
  eur("Slovenia", "SI"),
  eur("Sweden", "SE"),
  eur("Andorra", "AD"),
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
  eur("Argentina", "AR"),
  eur("Armenia", "AM"),
  eur("Belarus", "BY"),
  eur("Brazil", "BR"),
  eur("Chile", "CL"),
  eur("Colombia", "CO"),
  eur("Georgia", "GE"),
  eur("Haiti", "HT"),
  eur("Jersey", "JE"),
  eur("Kosovo", "XK"),
  eur("Malaysia", "MY"),
  eur("Mexico", "MX"),
  eur("Morocco", "MA"),
  eur("New Caledonia", "NC"),
  eur("Norway", "NO"),
  eur("Serbia", "RS"),
  eur("Suriname", "SR"),
  eur("Turkey", "TR"),
  eur("Ukraine", "UA"),
  eur("United Kingdom", "GB"),
  eur("Vatican City", "VA"),
  eur("Wallis and Futuna", "WF"),
  usd("United States", "US"),
  usd("Canada", "CA"),
  usd("Australia", "AU"),
  usd("New Zealand", "NZ"),
  usd("Singapore", "SG"),
  usd("Hong Kong", "HK"),
  usd("Japan", "JP"),
  usd("South Korea", "KR"),
  usd("Taiwan", "TW"),
  usd("Thailand", "TH"),
  usd("United Arab Emirates", "AE"),
  usd("Qatar", "QA"),
  usd("Switzerland", "CH"),
  usd("Bahamas", "BS"),
  usd("Barbados", "BB"),
  usd("Bermuda", "BM"),
  usd("Cayman Islands", "KY"),
  usd("Costa Rica", "CR"),
  usd("Dominican Republic", "DO"),
  usd("Ecuador", "EC"),
  usd("El Salvador", "SV"),
  usd("Guatemala", "GT"),
  usd("Honduras", "HN"),
  usd("Jamaica", "JM"),
  usd("Nicaragua", "NI"),
  usd("Panama", "PA"),
  usd("Paraguay", "PY"),
  usd("Peru", "PE"),
  usd("Uruguay", "UY"),
  usd("Venezuela", "VE"),
  usd("Vietnam", "VN"),
  idr("Indonesia", "ID"),
];

export const DEFAULT_SHIPPING_COUNTRY = "FR";

export function getShippingCountry(code: string): ShippingCountry {
  return SHIPPING_COUNTRIES.find((c) => c.code === code) ?? SHIPPING_COUNTRIES[0];
}

export function formatShippingLabel(c: ShippingCountry) {
  return `${c.name} (${c.currencyLabel})`;
}
