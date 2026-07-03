import type { Product } from "@/lib/catalog-types";
import type { Locale } from "@/lib/i18n/messages";

export type ProductLocaleFields = {
  name: string;
  story: string;
  seoTitle: string;
  metaDescription: string;
};

const FALLBACK_CHAIN: Locale[] = ["fr", "en", "id", "es"];

export function emptyProductLocaleFields(): ProductLocaleFields {
  return { name: "", story: "", seoTitle: "", metaDescription: "" };
}

export function resolveProductLocaleFields(
  product: Pick<Product, "name" | "story" | "seoTitle" | "metaDescription" | "locales">,
  locale: Locale,
): ProductLocaleFields {
  const map = product.locales && typeof product.locales === "object" ? product.locales : {};
  const order: Locale[] = locale ? [locale, ...FALLBACK_CHAIN.filter((c) => c !== locale)] : FALLBACK_CHAIN;

  for (const code of order) {
    const block = map[code];
    if (block?.name?.trim()) {
      return {
        name: block.name.trim(),
        story: block.story?.trim() || product.story || "",
        seoTitle: block.seoTitle?.trim() || product.seoTitle?.trim() || block.name.trim(),
        metaDescription: block.metaDescription?.trim() || product.metaDescription?.trim() || "",
      };
    }
  }

  return {
    name: product.name,
    story: product.story,
    seoTitle: product.seoTitle?.trim() || product.name,
    metaDescription: product.metaDescription?.trim() || "",
  };
}

export function applyProductLocale<T extends Product>(product: T, locale: Locale): T {
  const resolved = resolveProductLocaleFields(product, locale);
  return {
    ...product,
    name: resolved.name,
    story: resolved.story,
    seoTitle: resolved.seoTitle,
    metaDescription: resolved.metaDescription,
  };
}
