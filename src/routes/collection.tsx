import { createFileRoute } from "@tanstack/react-router";
import { products, collections } from "@/lib/products";
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
      { name: "description", content: "Browse all hats — Sunburn, Mi Paradisio, Juicy Record and more." },
    ],
  }),
  component: Collection,
});

function Collection() {
  const { c, cat, sale, q } = Route.useSearch();

  let filtered = products;

  if (c) {
    filtered = filtered.filter((p) => productInCollection(p, c));
  }
  if (cat) {
    filtered = filtered.filter((p) => p.category === cat);
  }
  if (sale === "true") {
    filtered = filtered.filter((p) => p.onSale);
  }
  if (q) {
    filtered = filtered.filter((p) => productMatchesQuery(p, q));
  }

  const title =
    q ? `Search: ${q}` :
    sale === "true" ? "Sale" :
    c ? collections.find((col) => col.slug === c)?.name ?? "Collection" :
    cat === "accessories" ? "Accessories" :
    cat === "bags" ? "Bags" :
    "The Collection";

  return (
    <>
      <section className="px-6 md:px-14 pt-20 pb-12 border-b border-border">
        <p className="text-eyebrow text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
        </p>
        <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[1]">{title}</h1>
        <p className="mt-6 max-w-xl text-muted-foreground">
          Hand-woven, slow-finished, and shipped from our two ateliers in Canggu and Paris.
        </p>
      </section>

      <div className="px-6 md:px-14 py-6 flex items-center gap-6 text-eyebrow border-b border-border overflow-x-auto">
        <Route.Link
          to="/collection"
          search={{}}
          className={`whitespace-nowrap ${!c && !cat && !sale && !q ? "text-ink" : "text-muted-foreground"} link-underline`}
        >
          All
        </Route.Link>
        {collections.map((col) => (
          <Route.Link
            key={col.slug}
            to="/collection"
            search={{ c: col.slug }}
            className={`whitespace-nowrap ${c === col.slug ? "text-ink" : "text-muted-foreground"} link-underline`}
          >
            {col.name}
          </Route.Link>
        ))}
      </div>

      <section className="px-6 md:px-14 py-14">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground font-display text-2xl">No pieces found for this selection yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-10">
            {filtered.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
