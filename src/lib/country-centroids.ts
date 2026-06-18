/** ISO 3166-1 alpha-2 centroids for order heatmap (approximate). */
export const COUNTRY_CENTROIDS: Record<string, { lat: number; lon: number; name: string }> = {
  FR: { lat: 46.2, lon: 2.2, name: "France" },
  GB: { lat: 55.4, lon: -3.4, name: "United Kingdom" },
  US: { lat: 39.8, lon: -98.6, name: "United States" },
  DE: { lat: 51.2, lon: 10.5, name: "Germany" },
  IT: { lat: 41.9, lon: 12.6, name: "Italy" },
  ES: { lat: 40.5, lon: -3.7, name: "Spain" },
  NL: { lat: 52.1, lon: 5.3, name: "Netherlands" },
  BE: { lat: 50.5, lon: 4.5, name: "Belgium" },
  CH: { lat: 46.8, lon: 8.2, name: "Switzerland" },
  AT: { lat: 47.5, lon: 14.6, name: "Austria" },
  PT: { lat: 39.4, lon: -8.2, name: "Portugal" },
  IE: { lat: 53.4, lon: -8.2, name: "Ireland" },
  SE: { lat: 60.1, lon: 18.6, name: "Sweden" },
  NO: { lat: 60.5, lon: 8.5, name: "Norway" },
  DK: { lat: 56.3, lon: 9.5, name: "Denmark" },
  FI: { lat: 61.9, lon: 25.7, name: "Finland" },
  PL: { lat: 51.9, lon: 19.1, name: "Poland" },
  GR: { lat: 39.1, lon: 21.8, name: "Greece" },
  AU: { lat: -25.3, lon: 133.8, name: "Australia" },
  NZ: { lat: -40.9, lon: 174.9, name: "New Zealand" },
  ID: { lat: -0.8, lon: 113.9, name: "Indonesia" },
  SG: { lat: 1.35, lon: 103.8, name: "Singapore" },
  HK: { lat: 22.3, lon: 114.2, name: "Hong Kong" },
  JP: { lat: 36.2, lon: 138.3, name: "Japan" },
  KR: { lat: 35.9, lon: 127.8, name: "South Korea" },
  CN: { lat: 35.9, lon: 104.2, name: "China" },
  IN: { lat: 20.6, lon: 79.0, name: "India" },
  AE: { lat: 23.4, lon: 53.8, name: "UAE" },
  SA: { lat: 23.9, lon: 45.1, name: "Saudi Arabia" },
  CA: { lat: 56.1, lon: -106.3, name: "Canada" },
  MX: { lat: 23.6, lon: -102.6, name: "Mexico" },
  BR: { lat: -14.2, lon: -51.9, name: "Brazil" },
  ZA: { lat: -30.6, lon: 22.9, name: "South Africa" },
  MC: { lat: 43.7, lon: 7.4, name: "Monaco" },
  LU: { lat: 49.8, lon: 6.1, name: "Luxembourg" },
  CZ: { lat: 49.8, lon: 15.5, name: "Czechia" },
  RO: { lat: 45.9, lon: 24.9, name: "Romania" },
  HU: { lat: 47.2, lon: 19.5, name: "Hungary" },
  TR: { lat: 38.9, lon: 35.2, name: "Turkey" },
  RU: { lat: 61.5, lon: 105.3, name: "Russia" },
  TH: { lat: 15.9, lon: 100.9, name: "Thailand" },
  MY: { lat: 4.2, lon: 101.9, name: "Malaysia" },
  TW: { lat: 23.7, lon: 121.0, name: "Taiwan" },
  XX: { lat: 0, lon: 0, name: "Unknown" },
};

export function projectCountry(lon: number, lat: number, width: number, height: number) {
  return {
    x: ((lon + 180) / 360) * width,
    y: ((90 - lat) / 180) * height,
  };
}

export function countryLabel(code: string) {
  return COUNTRY_CENTROIDS[code]?.name || code;
}
