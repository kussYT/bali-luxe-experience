import type { Currency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/messages";

const LOCALE_BY_SITE: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  id: "id-ID",
  es: "es-ES",
};

/** European-style amounts: 119,00 € · 1 199,00 € · Rp 1.234.567 */
export function formatMoneyAmount(amount: number, currency: Currency, locale: Locale = "fr") {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";

  if (currency === "IDR") {
    return `Rp ${n.toLocaleString(LOCALE_BY_SITE[locale] || "fr-FR", { maximumFractionDigits: 0 })}`;
  }

  const code = currency === "USD" ? "USD" : "EUR";
  return new Intl.NumberFormat(LOCALE_BY_SITE[locale] || "fr-FR", {
    style: "currency",
    currency: code,
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPlainAmount(amount: number, locale: Locale = "fr") {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(LOCALE_BY_SITE[locale] || "fr-FR", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
