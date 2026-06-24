import type { Locale } from "@/lib/i18n/messages";
import { flagEmoji } from "@/lib/flags";

export const LOCALE_DEFAULT_COUNTRY: Record<Locale, string> = {
  fr: "FR",
  en: "US",
  id: "ID",
  es: "ES",
};

export const LOCALE_FLAG_COUNTRY: Record<Locale, string> = {
  fr: "FR",
  en: "GB",
  id: "ID",
  es: "ES",
};

export function localeFlag(locale: Locale): string {
  return flagEmoji(LOCALE_FLAG_COUNTRY[locale]);
}

export const LOCALE_CHANGED_EVENT = "bingin-locale-changed";
