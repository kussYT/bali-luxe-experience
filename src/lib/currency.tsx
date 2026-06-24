import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/catalog-types";
import {
  DEFAULT_SHIPPING_COUNTRY,
  formatShippingLabel,
  getShippingCountry,
  type ShippingCountry,
} from "@/data/shipping-countries";
import {
  readShippingCountryCode,
  readShippingManual,
  shippingToCountry,
  writeShippingCountryCode,
  SHIPPING_STORAGE_KEY,
} from "@/lib/market";
import { LOCALE_CHANGED_EVENT, LOCALE_DEFAULT_COUNTRY } from "@/lib/locale-market";
import type { Locale } from "@/lib/i18n/messages";

export type Currency = "EUR" | "USD" | "IDR";
export type Country = { code: string; name: string; currency: Currency; flag: string };

type Ctx = {
  country: Country;
  shipping: ShippingCountry;
  setShippingCountryCode: (code: string) => void;
  /** @deprecated use setShippingCountryCode */
  setMarketId: (code: string) => void;
  setCountry: (c: Country) => void;
  format: (p: Product) => string;
  shippingLabel: string;
};

const CurrencyContext = createContext<Ctx | null>(null);

function initialShipping(): ShippingCountry {
  if (typeof window === "undefined") return getShippingCountry(DEFAULT_SHIPPING_COUNTRY);
  const code = readShippingCountryCode();
  return getShippingCountry(code ?? DEFAULT_SHIPPING_COUNTRY);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [shipping, setShipping] = useState<ShippingCountry>(initialShipping);
  const [country, setCountry] = useState<Country>(() => shippingToCountry(initialShipping()));

  const setShippingCountryCode = useCallback((code: string) => {
    const next = getShippingCountry(code);
    writeShippingCountryCode(code);
    setShipping(next);
    setCountry(shippingToCountry(next));
  }, []);

  useEffect(() => {
    const code = readShippingCountryCode();
    if (code) {
      const next = getShippingCountry(code);
      setShipping(next);
      setCountry(shippingToCountry(next));
      return;
    }
    if (readShippingManual()) return;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((data: { countryCode?: string | null }) => {
        const geo = data.countryCode?.toUpperCase();
        if (geo && getShippingCountry(geo)) setShippingCountryCode(geo);
      })
      .catch(() => {});
  }, [setShippingCountryCode]);

  useEffect(() => {
    const onLocale = (e: Event) => {
      if (readShippingManual()) return;
      const locale = (e as CustomEvent<Locale>).detail;
      const code = LOCALE_DEFAULT_COUNTRY[locale];
      if (code) setShippingCountryCode(code);
    };
    window.addEventListener(LOCALE_CHANGED_EVENT, onLocale);
    return () => window.removeEventListener(LOCALE_CHANGED_EVENT, onLocale);
  }, [setShippingCountryCode]);

  const setCountryLegacy = useCallback(
    (c: Country) => {
      const match = getShippingCountry(c.code);
      setShippingCountryCode(match.code);
    },
    [setShippingCountryCode],
  );

  const format = useCallback(
    (p: Product) => {
      const eur = p.onSale && p.compareAtEUR != null ? p.compareAtEUR : p.priceEUR;
      const value =
        country.currency === "EUR"
          ? eur
          : country.currency === "USD"
            ? Math.round(eur * 1.1)
            : Math.round(eur * 17_000);
      const symbol = country.currency === "EUR" ? "€" : country.currency === "USD" ? "$" : "Rp ";
      return `${symbol}${value.toLocaleString("en-US")}`;
    },
    [country.currency],
  );

  const shippingLabel = formatShippingLabel(shipping);

  const value = useMemo(
    () => ({
      country,
      shipping,
      shippingLabel,
      setShippingCountryCode,
      setMarketId: setShippingCountryCode,
      setCountry: setCountryLegacy,
      format,
    }),
    [country, shipping, shippingLabel, setShippingCountryCode, setCountryLegacy, format],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}

export { SHIPPING_STORAGE_KEY };
