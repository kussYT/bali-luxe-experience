/** ISO 3166-1 alpha-2 — lat/lon for fallback projection. */
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

/** Pin positions tuned to public/admin/world-map.svg (950×620). */
const MAP_PIN_POSITIONS: Partial<Record<string, { x: number; y: number }>> = {
  FR: { x: 462, y: 192 },
  BE: { x: 468, y: 178 },
  NL: { x: 472, y: 172 },
  DE: { x: 488, y: 172 },
  CH: { x: 482, y: 186 },
  AT: { x: 498, y: 182 },
  LU: { x: 472, y: 178 },
  MC: { x: 478, y: 198 },
  GB: { x: 448, y: 158 },
  IE: { x: 434, y: 168 },
  ES: { x: 452, y: 212 },
  PT: { x: 436, y: 218 },
  IT: { x: 492, y: 198 },
  DK: { x: 482, y: 158 },
  SE: { x: 498, y: 128 },
  NO: { x: 478, y: 108 },
  FI: { x: 512, y: 128 },
  PL: { x: 502, y: 168 },
  GR: { x: 512, y: 218 },
  ID: { x: 738, y: 368 },
  AU: { x: 812, y: 468 },
  US: { x: 248, y: 198 },
  CA: { x: 228, y: 128 },
  JP: { x: 828, y: 208 },
};

const MAP_WIDTH = 950;
const MAP_HEIGHT = 620;

/**
 * Project lat/lon onto the admin world map SVG.
 * Y uses a calibrated scale — the SVG is not a pure equirectangular grid.
 */
export function projectCountry(lon: number, lat: number, width = MAP_WIDTH, height = MAP_HEIGHT) {
  const sx = width / MAP_WIDTH;
  const sy = height / MAP_HEIGHT;
  const x = ((lon + 180) / 360) * MAP_WIDTH * sx;
  const latNorm = (90 - lat) / 180;
  const yRatio = 0.016 + latNorm * 1.195;
  const y = Math.min(MAP_HEIGHT - 8, Math.max(8, yRatio * MAP_HEIGHT)) * sy;
  return { x, y };
}

export function countryMapPosition(code: string, width = MAP_WIDTH, height = MAP_HEIGHT) {
  const pin = MAP_PIN_POSITIONS[code];
  if (pin) {
    const sx = width / MAP_WIDTH;
    const sy = height / MAP_HEIGHT;
    return { x: pin.x * sx, y: pin.y * sy };
  }
  const centroid = COUNTRY_CENTROIDS[code] || COUNTRY_CENTROIDS.XX;
  return projectCountry(centroid.lon, centroid.lat, width, height);
}

export function countryLabel(code: string) {
  return COUNTRY_CENTROIDS[code]?.name || code;
}
