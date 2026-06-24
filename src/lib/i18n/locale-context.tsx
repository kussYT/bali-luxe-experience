import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CMS_LOCALES } from "@/lib/i18n/cms-locales";
import { translate, type Locale } from "@/lib/i18n/messages";
import { LOCALE_CHANGED_EVENT } from "@/lib/locale-market";

const STORAGE_KEY = "bingin-locale";

export const LOCALES = CMS_LOCALES.map(({ code, label }) => ({ code, label }));

type LocaleCtx = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleCtx | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "fr" || raw === "en" || raw === "id" || raw === "es") return raw;
  const browser = navigator.language.slice(0, 2);
  if (browser === "fr" || browser === "en" || browser === "id" || browser === "es") return browser;
  return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGED_EVENT, { detail: next }));
  };

  const t = (key: string) => translate(locale, key);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
