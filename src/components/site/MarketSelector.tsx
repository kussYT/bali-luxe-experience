import { useMemo, useState } from "react";
import { CountryFlag } from "@/components/site/CountryFlag";
import { SHIPPING_COUNTRIES } from "@/data/shipping-countries";
import { useCurrency } from "@/lib/currency";
import { writeShippingManual } from "@/lib/market";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
        ? `px-3 py-2 ${dockShell} text-xs font-normal text-foreground/80 hover:text-foreground hover:border-foreground/30 transition-all duration-300 normal-case tracking-normal max-w-[min(100vw-2.5rem,14rem)]`
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

      <CountryDialog
        open={open}
        onOpenChange={setOpen}
        query={query}
        setQuery={setQuery}
        filtered={filtered}
        selectedCode={shipping.code}
        onSelect={select}
      />
    </>
  );
}

function CountryDialog({
  open,
  onOpenChange,
  query,
  setQuery,
  filtered,
  selectedCode,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  setQuery: (q: string) => void;
  filtered: typeof SHIPPING_COUNTRIES;
  selectedCode: string;
  onSelect: (code: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-surface border-border p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 text-left border-b border-border">
          <DialogTitle className="font-display text-3xl font-normal">Ship to</DialogTitle>
          <DialogDescription className="text-caption">
            Currency and delivery options for your region.
          </DialogDescription>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country…"
            className="mt-4 w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent/60 transition-colors"
          />
        </DialogHeader>

        <ul
          className="max-h-[min(55vh,22rem)] overflow-y-auto px-2 py-2"
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
      </DialogContent>
    </Dialog>
  );
}
