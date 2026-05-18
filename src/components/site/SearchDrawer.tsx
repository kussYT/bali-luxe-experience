import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { POPULAR_SEARCHES } from "@/lib/navigation";

type SearchDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchDrawer({ open, onClose }: SearchDrawerProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  if (!open) return null;

  const submit = (term: string) => {
    const q = term.trim();
    if (!q) return;
    onClose();
    setQuery("");
    navigate({ to: "/collection", search: { q } as never });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <aside className="w-full max-w-md bg-background flex flex-col h-full shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-display text-2xl">Search</h3>
          <button onClick={onClose} aria-label="Close search">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 border-b border-border">
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
              placeholder="Search hats, materials, styles…"
              className="flex-1 bg-transparent outline-none text-sm"
              autoFocus
            />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-eyebrow text-muted-foreground mb-4">Popular searches</p>
          <ul className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <li key={term}>
                <button
                  type="button"
                  onClick={() => submit(term)}
                  className="px-4 py-2 text-sm border border-border hover:bg-muted transition-colors"
                >
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 border-t border-border">
          <button
            type="button"
            onClick={() => submit(query)}
            className="w-full bg-ink text-bone py-3.5 text-eyebrow hover:bg-clay transition-colors"
          >
            Search
          </button>
        </div>
      </aside>
    </div>
  );
}
