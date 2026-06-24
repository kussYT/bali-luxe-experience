import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useCatalog } from "@/lib/catalog-context";
import { useLocale } from "@/lib/i18n/locale-context";
import { useSiteContent } from "@/lib/content-context";
import { filterProductsForSearch, rankSearchResults, type SearchFilters } from "@/lib/search";
import { POPULAR_SEARCHES } from "@/lib/navigation";
import { ProductCard } from "@/components/site/ProductCard";

type SearchDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const FILTER_KEYS = ["all", "hats", "accessories", "bags", "sale"] as const;

export function SearchDrawer({ open, onClose }: SearchDrawerProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({ category: "all", sale: false });
  const navigate = useNavigate();
  const { publishedProducts, collections } = useCatalog();
  const { homepage } = useSiteContent();
  const { t } = useLocale();

  const popular =
    homepage.navigation?.popularSearches?.filter(Boolean).length
      ? homepage.navigation!.popularSearches!
      : [...POPULAR_SEARCHES];

  const results = useMemo(() => {
    if (!query.trim() && !filters.sale && filters.category === "all") return [];
    const filtered = filterProductsForSearch(
      publishedProducts,
      query,
      {
        category: filters.category,
        sale: filters.sale,
      },
      collections,
    );
    return rankSearchResults(filtered, query).slice(0, 8);
  }, [publishedProducts, collections, query, filters]);

  if (!open) return null;

  const submit = (term: string) => {
    const q = term.trim();
    onClose();
    setQuery("");
    navigate({
      to: "/collection",
      search: {
        q: q || undefined,
        sale: filters.sale ? "true" : undefined,
        cat: filters.category && filters.category !== "all" ? filters.category : undefined,
      } as never,
    });
  };

  const toggleFilter = (key: (typeof FILTER_KEYS)[number]) => {
    if (key === "sale") {
      setFilters((f) => ({ ...f, sale: !f.sale }));
      return;
    }
    setFilters((f) => ({ ...f, category: key === "all" ? "all" : key, sale: f.sale }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <aside className="w-full max-w-md bg-background flex flex-col h-full shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-display text-2xl">{t("search.title")}</h3>
          <button onClick={onClose} aria-label="Close search">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 border-b border-border space-y-4">
          <form
            className="flex items-center gap-3 border-b border-border pb-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit(query);
            }}
          >
            <Search className="size-5 text-muted-foreground shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="flex-1 bg-transparent outline-none text-sm"
              autoFocus
            />
          </form>

          <div className="flex flex-wrap gap-2">
            {FILTER_KEYS.map((key) => {
              const active =
                key === "sale" ? filters.sale : key === "all" ? filters.category === "all" : filters.category === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFilter(key)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    active ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"
                  }`}
                >
                  {t(`search.${key}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {results.length > 0 ? (
            <>
              <p className="text-eyebrow text-muted-foreground mb-4">{t("search.results")}</p>
              <div className="grid grid-cols-2 gap-4">
                {results.map((p, i) => (
                  <Link key={p.slug} to="/product/$slug" params={{ slug: p.slug }} onClick={onClose}>
                    <ProductCard product={p} index={i} compact />
                  </Link>
                ))}
              </div>
            </>
          ) : query.trim() ? (
            <p className="text-sm text-muted-foreground">{t("search.noResults")}</p>
          ) : (
            <>
              <p className="text-eyebrow text-muted-foreground mb-4">{t("search.popular")}</p>
              <ul className="flex flex-wrap gap-2">
                {popular.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        submit(term);
                      }}
                      className="px-4 py-2 text-sm border border-border hover:bg-muted transition-colors"
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="p-6 border-t border-border">
          <button
            type="button"
            onClick={() => submit(query)}
            className="w-full bg-ink text-bone py-3.5 text-eyebrow hover:bg-clay transition-colors"
          >
            {t("search.submit")}
          </button>
        </div>
      </aside>
    </div>
  );
}
