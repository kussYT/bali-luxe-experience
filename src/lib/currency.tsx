import { createContext, useContext, useState, ReactNode } from "react";
import type { Product } from "@/lib/catalog-types";

export type Currency = "EUR" | "USD" | "IDR";
export type Country = { code: string; name: string; currency: Currency; flag: string };

export const COUNTRIES: Country[] = [
  { code: "FR", name: "France", currency: "EUR", flag: "🇫🇷" },
  { code: "ID", name: "Indonesia", currency: "IDR", flag: "🇮🇩" },
  { code: "US", name: "United States", currency: "USD", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", currency: "EUR", flag: "🇬🇧" },
  { code: "AU", name: "Australia", currency: "USD", flag: "🇦🇺" },
];

type Ctx = {
  country: Country;
  setCountry: (c: Country) => void;
  format: (p: Product) => string;
};

const CurrencyContext = createContext<Ctx | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const format = (p: Product) => {
    const eur = p.onSale && p.compareAtEUR != null ? p.compareAtEUR : p.priceEUR;
    const value =
      country.currency === "EUR"
        ? eur
        : country.currency === "USD"
          ? Math.round(eur * 1.1)
          : Math.round(eur * 17_000);
    const symbol = country.currency === "EUR" ? "€" : country.currency === "USD" ? "$" : "Rp ";
    return `${symbol}${value.toLocaleString("en-US")}`;
  };
  return (
    <CurrencyContext.Provider value={{ country, setCountry, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
