/** Site + CMS locale codes (keep in sync with src/lib/i18n/messages.ts). */
export const SITE_LOCALE_CODES = ["fr", "en", "id", "es"];

export const CMS_LOCALE_LABELS = {
  fr: "Français",
  en: "English",
  id: "Bahasa Indonesia",
  es: "Español",
};

const FALLBACK_CHAIN = ["fr", "en", "id", "es"];

export function resolvePageLocaleBlock(locales, locale) {
  const map = locales && typeof locales === "object" ? locales : {};
  const order = locale ? [locale, ...FALLBACK_CHAIN.filter((c) => c !== locale)] : FALLBACK_CHAIN;
  for (const code of order) {
    const block = map[code];
    if (block?.title) return { code, block };
  }
  return null;
}
