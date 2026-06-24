import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCatalog } from "@/lib/catalog-context";
import { ProductCard } from "@/components/site/ProductCard";
import { useLocale } from "@/lib/i18n/locale-context";

export const Route = createFileRoute("/wishlist/$token")({
  head: () => ({ meta: [{ title: "Shared wishlist — Bingin Diaries" }] }),
  component: SharedWishlistPage,
});

function SharedWishlistPage() {
  const { token } = Route.useParams();
  const { publishedProducts } = useCatalog();
  const { t } = useLocale();
  const [slugs, setSlugs] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/wishlist/share/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data.slugs)) throw new Error("Not found");
        setSlugs(data.slugs);
      })
      .catch(() => setError("Not found"));
  }, [token]);

  const products = useMemo(() => {
    if (!slugs) return [];
    return slugs
      .map((slug) => publishedProducts.find((p) => p.slug === slug))
      .filter(Boolean) as typeof publishedProducts;
  }, [slugs, publishedProducts]);

  if (error) {
    return (
      <section className="page-wrap section-pad py-24 text-center">
        <p className="font-display text-3xl">Wishlist not found</p>
        <Link to="/collection" className="mt-6 inline-block text-eyebrow link-underline">
          Browse collection
        </Link>
      </section>
    );
  }

  if (!slugs) {
    return <p className="page-wrap section-pad py-24 text-muted-foreground">Loading…</p>;
  }

  return (
    <section className="page-wrap section-pad py-16 md:py-20">
      <p className="text-eyebrow text-muted-foreground">{t("account.sharedWishlist")}</p>
      <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[0.95]">Wishlist</h1>
      {products.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8 mt-12">
          {products.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-muted-foreground">{t("search.noResults")}</p>
      )}
    </section>
  );
}
