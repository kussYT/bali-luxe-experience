/** Parse "49,50", "1 199,50", "49.50" → number. */
export function parseMoneyValue(value) {
  let n = 0;
  if (typeof value === "number") n = Number.isFinite(value) ? value : 0;
  else if (typeof value === "string") {
    const s = value.trim().replace(/\s/g, "");
    if (!s) return 0;
    const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
    const parsed = Number(normalized);
    n = Number.isFinite(parsed) ? parsed : 0;
  } else {
    n = Number(value) || 0;
  }
  return Math.round(n * 100) / 100;
}
