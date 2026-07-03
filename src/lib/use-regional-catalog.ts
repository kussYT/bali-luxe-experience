import { useMemo } from "react";
import { useCatalog } from "@/lib/catalog-context";
import { useCurrency } from "@/lib/currency";
import { useFulfillment } from "@/lib/fulfillment-context";
import type { Product } from "@/lib/catalog-types";
import {
  filterProductsForRegion,
  fulfillmentWarehouseForCountry,
  fulfillmentWarehouseLabel,
  maxCartQty,
  productHasRegionalStock,
} from "@/lib/warehouse-allocation";

export function useRegionalCatalog() {
  const { publishedProducts, featuredProducts, collections, loading, error, refresh, catalog, products } =
    useCatalog();
  const { shipping } = useCurrency();
  const { zones } = useFulfillment();

  const regionalProducts = useMemo(
    () => filterProductsForRegion(publishedProducts, shipping.code, zones),
    [publishedProducts, shipping.code, zones],
  );

  const regionalFeaturedProducts = useMemo(() => {
    const featured = regionalProducts.filter((p) => p.featured);
    const pool = featured.length > 0 ? featured : regionalProducts;
    const sale = pool.filter((p) => p.onSale);
    const rest = pool.filter((p) => !p.onSale);
    return [...sale, ...rest]
      .filter((p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i)
      .slice(0, 8);
  }, [regionalProducts]);

  const warehouse = useMemo(
    () => fulfillmentWarehouseForCountry(shipping.code, zones),
    [shipping.code, zones],
  );

  return {
    catalog,
    products,
    collections,
    publishedProducts,
    regionalProducts,
    featuredProducts,
    regionalFeaturedProducts,
    loading,
    error,
    refresh,
    countryCode: shipping.code,
    warehouse,
    warehouseLabel: fulfillmentWarehouseLabel(warehouse),
    zones,
    isRegionallyAvailable: (product: Product) => productHasRegionalStock(product, shipping.code, zones),
    maxQty: (product: Product, variantId?: string | null) =>
      maxCartQty(product, shipping.code, variantId, zones),
  };
}
