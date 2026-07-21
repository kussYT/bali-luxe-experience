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

/** Same fallback chain as pages — post blocks use title, excerpt, category, body. */
export function resolvePostLocaleBlock(locales, locale) {
  return resolvePageLocaleBlock(locales, locale);
}

/** Product blocks use name, story, seoTitle, metaDescription. */
export function resolveProductLocaleBlock(locales, locale) {
  const map = locales && typeof locales === "object" ? locales : {};
  const order = locale ? [locale, ...FALLBACK_CHAIN.filter((c) => c !== locale)] : FALLBACK_CHAIN;
  for (const code of order) {
    const block = map[code];
    if (block?.name?.trim()) return { code, block };
  }
  return null;
}

/** Collection blocks use name, description. */
export function resolveCollectionLocaleBlock(locales, locale) {
  const map = locales && typeof locales === "object" ? locales : {};
  const order = locale ? [locale, ...FALLBACK_CHAIN.filter((c) => c !== locale)] : FALLBACK_CHAIN;
  for (const code of order) {
    const block = map[code];
    if (block?.name?.trim()) return { code, block };
  }
  return null;
}

/** Top nav labels — valid when shop or newCollection is set. */
export function resolveNavigationLocaleBlock(locales, locale) {
  const map = locales && typeof locales === "object" ? locales : {};
  const order = locale ? [locale, ...FALLBACK_CHAIN.filter((c) => c !== locale)] : FALLBACK_CHAIN;
  for (const code of order) {
    const block = map[code];
    if (block?.shop?.trim() || block?.newCollection?.trim()) return { code, block };
  }
  return null;
}

/** Product page CMS strings — block is valid when addToBag is set. */
export function resolveProductMessagesLocaleBlock(locales, locale) {
  const map = locales && typeof locales === "object" ? locales : {};
  const order = locale ? [locale, ...FALLBACK_CHAIN.filter((c) => c !== locale)] : FALLBACK_CHAIN;
  for (const code of order) {
    const block = map[code];
    if (block?.addToBag?.trim()) return { code, block };
  }
  return null;
}
