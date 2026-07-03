import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Catalog, Collection, Product } from "@/lib/catalog-types";
import fallbackCatalog from "@/data/catalog.json";
import { fetchPublicCatalog } from "@/lib/admin-api";
import { sortProductsForDisplay } from "@/lib/sort-products";
import { useLocale } from "@/lib/i18n/locale-context";
import { applyProductLocale } from "@/lib/product-locale";

const PENDING_CATALOG: Catalog = { products: [], collections: [] };

type CatalogContextValue = {
  catalog: Catalog;
  products: Product[];
  collections: Collection[];
  publishedProducts: Product[];
  featuredProducts: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

function normalizeFallback(): Catalog {
  return fallbackCatalog as Catalog;
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const [catalog, setCatalog] = useState<Catalog>(PENDING_CATALOG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const live = await fetchPublicCatalog(locale);
      setCatalog(live);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load catalog");
      setCatalog(normalizeFallback());
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const publishedProducts = useMemo(
    () =>
      sortProductsForDisplay(
        catalog.products.filter((p) => p.status === "published").map((p) => applyProductLocale(p, locale)),
      ),
    [catalog.products, locale],
  );

  const featuredProducts = useMemo(() => {
    const featured = publishedProducts.filter((p) => p.featured);
    const pool = featured.length > 0 ? featured : publishedProducts;
    const sale = pool.filter((p) => p.onSale);
    const rest = pool.filter((p) => !p.onSale);
    return [...sale, ...rest]
      .filter((p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i)
      .slice(0, 8);
  }, [publishedProducts]);

  const value = useMemo(
    () => ({
      catalog,
      products: catalog.products,
      collections: catalog.collections,
      publishedProducts,
      featuredProducts,
      loading,
      error,
      refresh,
    }),
    [catalog, publishedProducts, featuredProducts, loading, error, refresh],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
