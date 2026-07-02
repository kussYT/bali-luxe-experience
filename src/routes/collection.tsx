import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCatalog } from "@/lib/catalog-context";
import { productInCollection, productMatchesQuery } from "@/lib/search";
import { sortProductsForDisplay } from "@/lib/sort-products";
import { ProductCard } from "@/components/site/ProductCard";
import { SALE_PAGE_SUBTITLE, SALE_PAGE_TITLE } from "@/data/sale-copy";
import { focalObjectPosition } from "@/lib/image-focal";

const CATEGORY_LABELS: Record<string, string> = {
  accessories: "Accessories",
  bags: "Bags",
  hats: "Hats",
};

const HIDDEN_COLLECTION_SLUGS = new Set(["archives", "best-sellers", "all-products"]);

type CollectionSearch = {
  c?: string;
  cat?: string;
  sub?: string;
  sale?: string;
  q?: string;
};

export const Route = createFileRoute("/collection")({
  validateSearch: (search: Record<string, unknown>): CollectionSearch => ({
    c: typeof search.c === "string" ? search.c : undefined,
    cat: typeof search.cat === "string" ? search.cat : undefined,
    sub: typeof search.sub === "string" ? search.sub : undefined,
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
  const { c, cat, sub, sale, q } = Route.useSearch();
  const { publishedProducts, collections } = useCatalog();

  const collectionProducts = useMemo(() => {
    if (!c) return [];
    return sortProductsForDisplay(publishedProducts.filter((p) => productInCollection(p, c)));
  }, [c, publishedProducts]);

  const scopedCategoryFilters = useMemo(() => {
    const cats = new Set<string>();
    for (const product of collectionProducts) {
      if (product.category) cats.add(product.category);
    }
    return [...cats].sort((a, b) =>
      (CATEGORY_LABELS[a] ?? a).localeCompare(CATEGORY_LABELS[b] ?? b),
    );
  }, [collectionProducts]);

  const scopedSubCollections = useMemo(() => {
    if (!c) return [];
    const counts = new Map<string, number>();
    for (const product of collectionProducts) {
      for (const slug of product.collectionSlugs ?? []) {
        if (slug === c || HIDDEN_COLLECTION_SLUGS.has(slug)) continue;
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }
    }
    return collections
      .filter((col) => counts.has(col.slug))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [c, collectionProducts, collections]);

  const filtered = useMemo(() => {
    let list = publishedProducts;
    if (c) list = list.filter((p) => productInCollection(p, c));
    if (sub) list = list.filter((p) => productInCollection(p, sub));
    if (cat) list = list.filter((p) => p.category === cat);
    if (sale === "true") list = list.filter((p) => p.onSale);
    if (q) list = list.filter((p) => productMatchesQuery(p, q));
    return sortProductsForDisplay(list);
  }, [publishedProducts, c, sub, cat, sale, q]);

  const activeCollection = c ? collections.find((col) => col.slug === c) : undefined;
  const inCollectionView = Boolean(c) && sale !== "true" && !q;

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

  const showCollectionHero = Boolean(inCollectionView && activeCollection?.heroImage);

  return (
    <>
      {showCollectionHero && (
        <section className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[min(52vh,28rem)] overflow-hidden bg-secondary">
          <img
            src={activeCollection!.heroImage}
            alt=""
            className="absolute inset-0 size-full object-cover image-editorial"
            style={{ objectPosition: focalObjectPosition(activeCollection!.heroFocal) }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/25 to-foreground/10" />
          <div className="relative h-full flex flex-col justify-end page-wrap section-pad pb-10 md:pb-14 text-surface">
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.94] break-words">
              {title}
            </h1>
            <p className="text-caption mt-4 md:mt-6 max-w-lg !text-surface/85">{subtitle}</p>
          </div>
        </section>
      )}

      <section
        className={`page-wrap section-pad pb-12 md:pb-16 border-b border-border ${showCollectionHero ? "pt-10 md:pt-12" : "pt-20 md:pt-28"}`}
      >
        {!showCollectionHero && (
          <>
            <h1 className="font-display text-3xl sm:text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.94] break-words">{title}</h1>
            <p className="text-caption mt-6 max-w-lg">{subtitle}</p>
          </>
        )}
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
          <Route.Link
            to="/collection"
            search={{ sale: "true" }}
            className="whitespace-nowrap link-underline !text-foreground"
          >
            All sale
          </Route.Link>
        ) : inCollectionView ? (
          <>
            <Route.Link
              to="/collection"
              search={{ c }}
              className={`whitespace-nowrap link-underline ${!cat && !sub ? "!text-foreground" : ""}`}
            >
              All
            </Route.Link>
            {scopedSubCollections.map((col) => (
              <Route.Link
                key={col.slug}
                to="/collection"
                search={{ c, sub: col.slug }}
                className={`whitespace-nowrap link-underline ${sub === col.slug ? "!text-foreground" : ""}`}
              >
                {col.name}
              </Route.Link>
            ))}
            {scopedCategoryFilters.map((category) => (
              <Route.Link
                key={category}
                to="/collection"
                search={{ c, cat: category }}
                className={`whitespace-nowrap link-underline ${cat === category ? "!text-foreground" : ""}`}
              >
                {CATEGORY_LABELS[category] ?? category}
              </Route.Link>
            ))}
            <Route.Link
              to="/collection"
              search={{}}
              className="whitespace-nowrap link-underline ml-auto shrink-0 !text-foreground/45"
            >
              All collections
            </Route.Link>
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
              .filter((col) => !HIDDEN_COLLECTION_SLUGS.has(col.slug))
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
            <Route.Link
              to="/collection"
              search={{ cat: "accessories" }}
              className={`whitespace-nowrap link-underline ${cat === "accessories" ? "!text-foreground" : ""}`}
            >
              Accessories
            </Route.Link>
            <Route.Link
              to="/collection"
              search={{ cat: "bags" }}
              className={`whitespace-nowrap link-underline ${cat === "bags" ? "!text-foreground" : ""}`}
            >
              Bags
            </Route.Link>
          </>
        )}
      </div>

      <section className="page-wrap section-pad section-gap">
        {filtered.length === 0 ? (
          <div className="max-w-xl space-y-5">
            <p className="font-display text-2xl md:text-3xl text-muted-foreground">
              {sale === "true"
                ? "No pieces on sale right now — check back soon or browse the full collection."
                : "No pieces found for this selection yet."}
            </p>
            {c && activeCollection && (cat || sub) && (
              <Route.Link
                to="/collection"
                search={{ c }}
                className="inline-block text-eyebrow link-underline !text-foreground"
              >
                View all {activeCollection.name} pieces
              </Route.Link>
            )}
            {c && activeCollection && !cat && !sub && (
              <Route.Link
                to="/collection"
                search={{}}
                className="inline-block text-eyebrow link-underline !text-foreground"
              >
                Browse all collections
              </Route.Link>
            )}
            {!c && cat && (
              <Route.Link
                to="/collection"
                search={{}}
                className="inline-block text-eyebrow link-underline !text-foreground"
              >
                View the full collection
              </Route.Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-8 md:gap-x-4 md:gap-y-10">
            {filtered.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} compact />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
