import type { Locale } from "@/lib/i18n/messages";

export const CMS_LOCALES: { code: Locale; label: string; adminLabel: string }[] = [
  { code: "fr", label: "Français", adminLabel: "Français" },
  { code: "en", label: "English", adminLabel: "English" },
  { code: "id", label: "Bahasa Indonesia", adminLabel: "Bahasa Indonesia" },
  { code: "es", label: "Español", adminLabel: "Español" },
];

export function emptyPageLocaleFields() {
  return { title: "", eyebrow: "", metaDescription: "", body: [] as string[] };
}

export function emptyPostLocaleFields() {
  return { title: "", excerpt: "", category: "", body: [] as string[] };
}

export function emptyProductMessagesLocaleFields() {
  return {
    regionalUnavailable: "",
    soldOut: "",
    unavailableInRegion: "",
    addToBag: "",
    inStock: "",
  };
}