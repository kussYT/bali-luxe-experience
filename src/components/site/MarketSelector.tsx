import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { CountryFlag } from "@/components/site/CountryFlag";
import { SHIPPING_COUNTRIES } from "@/data/shipping-countries";
import { useCurrency } from "@/lib/currency";
import { writeShippingManual } from "@/lib/market";

const headerTriggerClass =
  "inline-flex items-center gap-2 text-sm font-normal py-2 link-underline text-foreground/80 hover:text-foreground transition-colors duration-[450ms] max-w-[11rem] lg:max-w-[15rem] truncate normal-case tracking-normal";

type MarketSelectorProps = {
  variant?: "header" | "footer" | "nav" | "dock";
};

const dockShell =
  "bg-surface/90 backdrop-blur-md border border-border shadow-[0_8px_32px_-8px_rgba(28,26,23,0.12)]";

function marketLabel(name: string, currencyLabel: string) {
  return `${name} (${currencyLabel})`;
}

export function MarketSelector({ variant = "header" }: MarketSelectorProps) {
  const { shipping, setShippingCountryCode } = useCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SHIPPING_COUNTRIES;
    return SHIPPING_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [query]);

  const select = (code: string) => {
    writeShippingManual(true);
    setShippingCountryCode(code);
    setOpen(false);
    setQuery("");
  };

  const label = marketLabel(shipping.name, shipping.currencyLabel);

  const triggerClass =
    variant === "nav"
      ? "w-full text-left text-sm py-3 px-4 border border-border bg-background hover:border-accent/60 transition-colors normal-case tracking-normal"
      : variant === "dock"
        ? `px-2.5 py-1.5 ${dockShell} text-[0.6875rem] font-normal text-foreground/80 hover:text-foreground hover:border-foreground/30 transition-all duration-300 normal-case tracking-normal max-w-[min(100vw-2.5rem,13rem)]`
        : variant === "footer"
          ? "text-eyebrow !text-surface/70 link-underline hover:!text-surface text-left normal-case tracking-normal inline-flex items-center gap-2"
          : headerTriggerClass;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClass}
        aria-haspopup="dialog"
        title={label}
      >
        <span className="truncate">{label}</span>
      </button>

      <CountryPicker
        open={open}
        onClose={() => setOpen(false)}
        query={query}
        setQuery={setQuery}
        filtered={filtered}
        selectedCode={shipping.code}
        onSelect={select}
      />
    </>
  );
}

function CountryPicker({
  open,
  onClose,
  query,
  setQuery,
  filtered,
  selectedCode,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  query: string;
  setQuery: (q: string) => void;
  filtered: typeof SHIPPING_COUNTRIES;
  selectedCode: string;
  onSelect: (code: string) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 animate-fade-in"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ship-to-title"
        className="relative z-10 flex w-full max-w-md max-h-[min(90vh,28rem)] flex-col overflow-hidden border border-border bg-surface shadow-lg animate-fade-in"
      >
        <div className="shrink-0 border-b border-border p-6 pb-4 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="ship-to-title" className="font-display text-3xl font-normal">
                Ship to
              </h2>
              <p className="text-caption mt-1">
                Currency and delivery options for your region.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-foreground/70 hover:text-foreground p-1"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country…"
            className="mt-4 w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent/60 transition-colors"
          />
        </div>

        <ul
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-2"
          role="listbox"
          aria-label="Countries"
        >
          {filtered.length === 0 ? (
            <li className="text-caption text-center py-8">No country found.</li>
          ) : (
            filtered.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedCode === c.code}
                  onClick={() => onSelect(c.code)}
                  className={`w-full flex items-center justify-between gap-4 text-sm py-2.5 px-3 rounded-sm transition-colors duration-300 text-left ${selectedCode === c.code ? "bg-secondary" : "hover:bg-secondary/70"}`}
                >
                  <span className="flex items-center gap-2 text-foreground/90 min-w-0">
                    <CountryFlag code={c.code} className="shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="text-caption shrink-0">{c.currencyLabel}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
