import type { ProductMessagesContent, ProductMessagesLocaleFields, ProductMessagesStored } from "@/lib/content-types";
import type { Locale } from "@/lib/i18n/messages";
import { FALLBACK_PRODUCT_MESSAGES } from "@/lib/cms-fallbacks";

const FALLBACK_CHAIN: Locale[] = ["fr", "en", "id", "es"];

export function resolveProductMessagesFields(
  stored: ProductMessagesStored | ProductMessagesContent | null | undefined,
  locale: Locale,
): ProductMessagesContent {
  const locales =
    stored && typeof stored === "object" && "locales" in stored && stored.locales
      ? stored.locales
      : isLegacyFlat(stored)
        ? { fr: stored as ProductMessagesLocaleFields }
        : {};

  const order: Locale[] = locale ? [locale, ...FALLBACK_CHAIN.filter((c) => c !== locale)] : FALLBACK_CHAIN;

  for (const code of order) {
    const block = locales[code];
    if (block?.addToBag?.trim()) {
      return {
        regionalUnavailable: block.regionalUnavailable?.trim() || FALLBACK_PRODUCT_MESSAGES.regionalUnavailable,
        soldOut: block.soldOut?.trim() || FALLBACK_PRODUCT_MESSAGES.soldOut,
        unavailableInRegion: block.unavailableInRegion?.trim() || FALLBACK_PRODUCT_MESSAGES.unavailableInRegion,
        addToBag: block.addToBag.trim(),
        inStock: block.inStock?.trim() || FALLBACK_PRODUCT_MESSAGES.inStock,
      };
    }
  }

  return FALLBACK_PRODUCT_MESSAGES;
}

function isLegacyFlat(
  value: ProductMessagesStored | ProductMessagesContent | null | undefined,
): value is ProductMessagesContent {
  return Boolean(value && typeof value === "object" && "addToBag" in value && !("locales" in value));
}
