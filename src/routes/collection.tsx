import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCatalog } from "@/lib/catalog-context";
import { productInCollection, productMatchesQuery } from "@/lib/search";
import { ProductCard } from "@/components/site/ProductCard";
import { SALE_PAGE_SUBTITLE, SALE_PAGE_TITLE } from "@/data/sale-copy";

type CollectionSearch = {
  c?: string;
  cat?: string;
  sale?: string;
  q?: string;
};

export const Route = createFileRoute("/collection")({
  validateSearch: (search: Record<string, unknown>): CollectionSearch => ({
    c: typeof search.c === "string" ? search.c : undefined,
    cat: typeof search.cat === "string" ? search.cat : undefined,
    sale: search.sale === "true" || search.sale === true ? "true" : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "The Collection — Bingin Diaries" },
      { name: "description", content: "Browse all hats — collections and accessories." },
    ],
  }),
  component: Collection,
});

function Collection() {
  const { c, cat, sale, q } = Route.useSearch();
  const { publishedProducts, collections, loading } = useCatalog();

  let filtered = publishedProducts;

  if (c) filtered = filtered.filter((p) => productInCollection(p, c));
  if (cat) filtered = filtered.filter((p) => p.category === cat);
  if (sale === "true") filtered = filtered.filter((p) => p.onSale);
  if (q) filtered = filtered.filter((p) => productMatchesQuery(p, q));

  const activeCollection = c ? collections.find((col) => col.slug === c) : undefined;

  const title =
    q ? `Search: ${q}` :
    sale === "true" ? SALE_PAGE_TITLE :
    c ? (activeCollection?.name ?? "Collection") :
    cat === "accessories" ? "Accessories" :
    cat === "bags" ? "Bags" :
    "The Collection";

  const subtitle =
    sale === "true" ? SALE_PAGE_SUBTITLE :
    activeCollection?.description ||
    "Hand-woven, slow-finished, and shipped from our two ateliers in Canggu and Paris.";

  const saleCollectionSlugs = useMemo(() => {
    if (sale !== "true") return new Set<string>();
    const slugs = new Set<string>();
    for (const p of publishedProducts) {
      if (p.onSale && p.collectionSlug) slugs.add(p.collectionSlug);
    }
    return slugs;
  }, [sale, publishedProducts]);

  const saleCollections = useMemo(
    () => collections.filter((col) => saleCollectionSlugs.has(col.slug)),
    [collections, saleCollectionSlugs],
  );

  return (
    <>
      <section className="page-wrap section-pad pt-20 md:pt-28 pb-12 md:pb-16 border-b border-border">
        <p className="text-eyebrow">
          {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "piece" : "pieces"}`}
        </p>
        <h1 className="font-display text-3xl sm:text-5xl md:text-7xl lg:text-[5.5rem] mt-4 leading-[0.94] break-words">{title}</h1>
        <p className="text-caption mt-6 max-w-lg">{subtitle}</p>
        {sale === "true" && (
          <div
            id="sale-info"
            className="mt-8 max-w-2xl border border-accent/30 bg-accent/5 px-5 py-4 text-sm text-foreground/90 leading-relaxed"
          >
            <p className="text-eyebrow !text-accent mb-2">How Sales works</p>
            <p>
              Pieces here have a <strong>promo price</strong> (shown on the card) and the usual list price
              crossed out. To add or change a promo, open the product in Admin and set{" "}
              <strong>Sale price</strong> below the list price.
            </p>
          </div>
        )}
      </section>

      <div className="page-wrap section-pad py-6 flex items-center gap-6 md:gap-8 text-eyebrow border-b border-border overflow-x-auto">
        {sale === "true" ? (
          <>
            <Route.Link
              to="/collection"
              search={{ sale: "true" }}
              className={`whitespace-nowrap link-underline ${!c ? "!text-foreground" : ""}`}
            >
              All sale
            </Route.Link>
            {saleCollections.map((col) => (
              <Route.Link
                key={col.slug}
                to="/collection"
                search={{ sale: "true", c: col.slug }}
                className={`whitespace-nowrap link-underline ${c === col.slug ? "!text-foreground" : ""}`}
              >
                {col.name}
              </Route.Link>
            ))}
          </>
        ) : (
          <>
        <Route.Link
          to="/collection"
          search={{}}
          className={`whitespace-nowrap link-underline ${!c && !cat && !sale && !q ? "!text-foreground" : ""}`}
        >
          All
        </Route.Link>
        {collections
          .filter((col) => !["archives", "best-sellers", "all-products"].includes(col.slug))
          .map((col) => (
          <Route.Link
            key={col.slug}
            to="/collection"
            search={{ c: col.slug }}
            className={`whitespace-nowrap link-underline ${c === col.slug ? "!text-foreground" : ""}`}
          >
            {col.name}
          </Route.Link>
        ))}
          </>
        )}
      </div>

      <section className="page-wrap section-pad section-gap">
        {filtered.length === 0 ? (
          <p className="font-display text-2xl md:text-3xl text-foreground/65">
            {sale === "true"
              ? "No pieces on sale right now — check back soon or browse the full collection."
              : "No pieces found for this selection yet."}
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16">
            {filtered.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
