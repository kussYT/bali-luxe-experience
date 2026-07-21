import type { ProductVariant } from "@/lib/catalog-types";

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL"];

function variantLabel(variant: ProductVariant) {
  return (variant.option1 || variant.title || "").trim();
}

function sizeRank(label: string) {
  const upper = label.toUpperCase();
  const index = SIZE_ORDER.indexOf(upper);
  return index >= 0 ? index : SIZE_ORDER.length + 1;
}

/** Display sizes in standard order (S, M, L…) regardless of stock or DB position. */
export function sortVariantsForDisplay(variants: ProductVariant[]) {
  return [...variants].sort((a, b) => {
    const la = variantLabel(a);
    const lb = variantLabel(b);
    const rankDiff = sizeRank(la) - sizeRank(lb);
    if (rankDiff !== 0) return rankDiff;
    return la.localeCompare(lb, undefined, { sensitivity: "base" });
  });
}
