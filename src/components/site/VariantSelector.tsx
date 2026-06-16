import type { Product, ProductVariant } from "@/lib/catalog-types";
import { maxCartQty } from "@/lib/warehouse-allocation";

type VariantSelectorProps = {
  product: Product;
  selectedId: string | null;
  countryCode: string;
  onSelect: (variantId: string) => void;
};

function variantStock(variant: ProductVariant) {
  return (variant.inventory?.france ?? 0) + (variant.inventory?.bali ?? 0);
}

export function VariantSelector({ product, selectedId, countryCode, onSelect }: VariantSelectorProps) {
  const variants = product.variants ?? [];
  if (variants.length <= 1) return null;

  const optionLabel = variants.some((v) => v.option1) ? "Size" : "Variant";

  return (
    <div className="mt-8">
      <p className="text-eyebrow text-muted-foreground mb-3">{optionLabel}</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const stock = variantStock(variant);
          const max = maxCartQty(product, countryCode, variant.id);
          const disabled = max < 1;
          const selected = selectedId === variant.id;

          return (
            <button
              key={variant.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(variant.id)}
              className={`min-w-[2.75rem] px-4 py-2.5 text-sm border rounded-sm transition-colors duration-300 ${
                selected
                  ? "border-foreground bg-foreground text-surface"
                  : disabled
                    ? "border-border text-muted-foreground opacity-45 cursor-not-allowed"
                    : "border-border hover:border-foreground"
              }`}
              aria-pressed={selected}
              title={disabled ? "Out of stock" : stock <= 3 ? `${stock} left` : undefined}
            >
              {variant.option1 || variant.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
