/** ISO 3166-1 alpha-2 → regional indicator flag emoji */
export function flagEmoji(isoCode: string): string {
  const code = isoCode.toUpperCase();
  if (code.length !== 2 || code === "AS") return "🌐";
  const a = 0x1f1e6;
  return String.fromCodePoint(
    ...[...code].map((c) => a + (c.charCodeAt(0) - 65)),
  );
}
