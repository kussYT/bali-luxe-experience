import type { Product, ProductVariant } from "@/lib/catalog-types";
import type { FulfillmentZones } from "@/lib/fulfillment-zones-types";
import { maxCartQty } from "@/lib/warehouse-allocation";
import { DEFAULT_FULFILLMENT_ZONES } from "@/lib/fulfillment-zones-default";

type VariantSelectorProps = {
  product: Product;
  selectedId: string | null;
  countryCode: string;
  zones?: FulfillmentZones;
  onSelect: (variantId: string) => void;
};

export function VariantSelector({
  product,
  selectedId,
  countryCode,
  zones = DEFAULT_FULFILLMENT_ZONES,
  onSelect,
}: VariantSelectorProps) {
  const variants = product.variants ?? [];
  if (variants.length <= 1) return null;

  const optionLabel = variants.some((v) => v.option1) ? "Size" : "Variant";

  return (
    <div className="mt-8">
      <p className="text-eyebrow text-muted-foreground mb-3">{optionLabel}</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const max = maxCartQty(product, countryCode, variant.id, zones);
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
              title={disabled ? "Out of stock in your region" : max <= 3 ? `${max} left` : undefined}
            >
              {variant.option1 || variant.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
