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
import { useLocale } from "@/lib/i18n/locale-context";
import { formatMoneyAmount } from "@/lib/format-money";
import { EUR_TO_IDR, EUR_TO_USD, getUnitPrice } from "@/lib/pricing";

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
  /** Format a EUR list amount in the shopper's currency (commas, locale). */
  formatEur: (eur: number) => string;
  shippingLabel: string;
};

const CurrencyContext = createContext<Ctx | null>(null);

function initialShipping(): ShippingCountry {
  if (typeof window === "undefined") return getShippingCountry(DEFAULT_SHIPPING_COUNTRY);
  const code = readShippingCountryCode();
  return getShippingCountry(code ?? DEFAULT_SHIPPING_COUNTRY);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
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
      const value = getUnitPrice(p, country.currency);
      return formatMoneyAmount(value, country.currency, locale);
    },
    [country.currency, locale],
  );

  const formatEur = useCallback(
    (eur: number) => {
      const value =
        country.currency === "EUR"
          ? eur
          : country.currency === "USD"
            ? Math.round(eur * EUR_TO_USD)
            : Math.round(eur * EUR_TO_IDR);
      return formatMoneyAmount(value, country.currency, locale);
    },
    [country.currency, locale],
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
      formatEur,
    }),
    [country, shipping, shippingLabel, setShippingCountryCode, setCountryLegacy, format, formatEur],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}

export { SHIPPING_STORAGE_KEY };
