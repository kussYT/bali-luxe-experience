import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const eur = (name, code) => ({ code, name, currency: "EUR" });
const usd = (name, code) => ({ code, name, currency: "USD" });
const idr = (name, code) => ({ code, name, currency: "IDR" });

const europe = [
  eur("France", "FR"), eur("Germany", "DE"), eur("Austria", "AT"), eur("Belgium", "BE"),
  eur("Croatia", "HR"), eur("Cyprus", "CY"), eur("Estonia", "EE"), eur("Spain", "ES"),
  eur("Finland", "FI"), eur("Greece", "GR"), eur("Ireland", "IE"), eur("Italy", "IT"),
  eur("Latvia", "LV"), eur("Lithuania", "LT"), eur("Luxembourg", "LU"), eur("Malta", "MT"),
  eur("Monaco", "MC"), eur("Netherlands", "NL"), eur("Portugal", "PT"), eur("Slovakia", "SK"),
  eur("Slovenia", "SI"), eur("Andorra", "AD"), eur("Kosovo", "XK"), eur("Vatican City", "VA"),
  eur("French Guiana", "GF"), eur("Guadeloupe", "GP"), eur("Martinique", "MQ"), eur("Mayotte", "YT"),
  eur("Réunion", "RE"), eur("Saint Barthélemy", "BL"), eur("Saint Martin", "MF"),
  eur("Saint Pierre and Miquelon", "PM"), eur("French Southern Territories", "TF"),
  eur("Åland Islands", "AX"), eur("New Caledonia", "NC"), eur("Wallis and Futuna", "WF"),
  usd("Bulgaria", "BG"), usd("Czechia", "CZ"), usd("Denmark", "DK"), usd("Hungary", "HU"),
  usd("Poland", "PL"), usd("Romania", "RO"), usd("Sweden", "SE"), usd("Norway", "NO"),
  usd("United Kingdom", "GB"), usd("Switzerland", "CH"), usd("Jersey", "JE"), usd("Belarus", "BY"),
  usd("Ukraine", "UA"), usd("Serbia", "RS"), usd("Turkey", "TR"), usd("Armenia", "AM"),
  usd("Georgia", "GE"),
];

const americas = [
  usd("United States", "US"), usd("Canada", "CA"), usd("Mexico", "MX"), usd("Brazil", "BR"),
  usd("Argentina", "AR"), usd("Chile", "CL"), usd("Colombia", "CO"), usd("Peru", "PE"),
  usd("Uruguay", "UY"), usd("Paraguay", "PY"), usd("Venezuela", "VE"), usd("Ecuador", "EC"),
  usd("Costa Rica", "CR"), usd("Panama", "PA"), usd("Guatemala", "GT"), usd("Honduras", "HN"),
  usd("El Salvador", "SV"), usd("Nicaragua", "NI"), usd("Dominican Republic", "DO"),
  usd("Jamaica", "JM"), usd("Haiti", "HT"), usd("Bahamas", "BS"), usd("Barbados", "BB"),
  usd("Bermuda", "BM"), usd("Cayman Islands", "KY"), usd("Suriname", "SR"),
];

const asiaPacific = [
  usd("Australia", "AU"), usd("New Zealand", "NZ"), usd("Singapore", "SG"), usd("Hong Kong", "HK"),
  usd("Japan", "JP"), usd("South Korea", "KR"), usd("Taiwan", "TW"), usd("Thailand", "TH"),
  usd("Vietnam", "VN"), usd("Malaysia", "MY"), usd("United Arab Emirates", "AE"),
  usd("Qatar", "QA"), usd("Morocco", "MA"),
];

const catalog = {
  baliWarehouseDefaults: ["ID", "AU", "NZ", "SG", "HK", "JP", "KR", "TW", "TH", "VN", "MY", "NC", "PF"],
  continents: [
    { id: "europe", label: "Europe", countries: europe },
    { id: "americas", label: "Amériques", countries: americas },
    { id: "asia-pacific", label: "Asie-Pacifique & Moyen-Orient", countries: asiaPacific },
    { id: "indonesia", label: "Indonésie", countries: [idr("Indonesia", "ID")] },
  ],
};

writeFileSync(join(__dirname, "../data/country-shipping-catalog.json"), JSON.stringify(catalog, null, 2));
console.log("catalog written");
