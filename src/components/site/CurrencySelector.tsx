import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Currency } from "@/lib/currency";
import { useCurrency } from "@/lib/currency";
import { countryCodeForCurrency, writeShippingManual } from "@/lib/market";

const CURRENCIES: { code: Currency; label: string }[] = [
  { code: "EUR", label: "EUR €" },
  { code: "USD", label: "USD $" },
  { code: "IDR", label: "IDR Rp" },
];

type CurrencySelectorProps = {
  variant?: "nav";
};

export function CurrencySelector({ variant = "nav" }: CurrencySelectorProps) {
  const { country, shipping, setShippingCountryCode } = useCurrency();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const select = (currency: Currency) => {
    writeShippingManual(true);
    setShippingCountryCode(countryCodeForCurrency(currency, shipping.code));
    setOpen(false);
  };

  if (variant === "nav") {
    return (
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 text-sm py-3.5 px-4 border border-border bg-background hover:border-accent/60 transition-colors normal-case tracking-normal"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`Currency: ${shipping.currencyLabel}`}
        >
          <span className="font-medium text-foreground">{shipping.currencyLabel}</span>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {open && (
          <ul
            className="absolute left-0 right-0 top-full z-10 mt-1 border border-border bg-background shadow-lg"
            role="listbox"
            aria-label="Currency"
          >
            {CURRENCIES.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={country.currency === item.code}
                  onClick={() => select(item.code)}
                  className={`w-full text-left text-sm py-3 px-4 transition-colors ${
                    country.currency === item.code
                      ? "bg-secondary font-medium"
                      : "hover:bg-secondary/70"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return null;
}
