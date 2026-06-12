import { createFileRoute } from "@tanstack/react-router";
import { useCatalog } from "@/lib/catalog-context";
import { productInCollection, productMatchesQuery } from "@/lib/search";
import { ProductCard } from "@/components/site/ProductCard";

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

  const title =
    q ? `Search: ${q}` :
    sale === "true" ? "Sale" :
    c ? (collections.find((col) => col.slug === c)?.name ?? "Collection") :
    cat === "accessories" ? "Accessories" :
    cat === "bags" ? "Bags" :
    "The Collection";

  return (
    <>
      <section className="page-wrap section-pad pt-20 md:pt-28 pb-12 md:pb-16 border-b border-border">
        <p className="text-eyebrow">
          {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "piece" : "pieces"}`}
        </p>
        <h1 className="font-display text-3xl sm:text-5xl md:text-7xl lg:text-[5.5rem] mt-4 leading-[0.94] break-words">{title}</h1>
        <p className="text-caption mt-6 max-w-lg">
          Hand-woven, slow-finished, and shipped from our two ateliers in Canggu and Paris.
        </p>
      </section>

      <div className="page-wrap section-pad py-6 flex items-center gap-6 md:gap-8 text-eyebrow border-b border-border overflow-x-auto">
        <Route.Link
          to="/collection"
          search={{}}
          className={`whitespace-nowrap link-underline ${!c && !cat && !sale && !q ? "!text-foreground" : ""}`}
        >
          All
        </Route.Link>
        {collections.map((col) => (
          <Route.Link
            key={col.slug}
            to="/collection"
            search={{ c: col.slug }}
            className={`whitespace-nowrap link-underline ${c === col.slug ? "!text-foreground" : ""}`}
          >
            {col.name}
          </Route.Link>
        ))}
      </div>

      <section className="page-wrap section-pad section-gap">
        {filtered.length === 0 ? (
          <p className="font-display text-2xl md:text-3xl text-muted">No pieces found for this selection yet.</p>
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
