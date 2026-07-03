/** Parse "49,50", "1 199,50", "49.50" → number. Returns null if invalid. */
export function parseMoneyInput(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "");
  if (!s) return null;

  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** Coerce API / form values that may use comma decimals. Rounded to 2 decimal places. */
export function parseMoneyValue(value: unknown): number {
  let n = 0;
  if (typeof value === "number") n = Number.isFinite(value) ? value : 0;
  else if (typeof value === "string") n = parseMoneyInput(value) ?? 0;
  else n = Number(value) || 0;
  return Math.round(n * 100) / 100;
}

/** Display amount in inputs with French-style decimals (49,50). */
export function formatMoneyInput(amount: number | undefined | null): string {
  if (amount == null || !Number.isFinite(amount)) return "";
  if (Number.isInteger(amount)) return String(amount);
  return amount.toFixed(2).replace(".", ",");
}
