import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AdminLocale = "fr" | "en";

const STORAGE_KEY = "bingin-admin-locale";

const LABELS: Record<AdminLocale, Record<string, string>> = {
  fr: {
    dashboard: "Dashboard",
    products: "Produits",
    inventory: "Inventaire",
    readiness: "Go-live",
    orders: "Commandes",
    promotions: "Promotions",
    customers: "Clients",
    finance: "Finance",
    shipping: "Livraison",
    content: "Contenu",
    blog: "Blog",
    pages: "Pages",
    collections: "Collections",
    newsletter: "Newsletter",
    productAnalytics: "Analytics produits",
    viewSite: "Voir le site",
    logOut: "Déconnexion",
    admin: "Admin",
    language: "Langue",
  },
  en: {
    dashboard: "Dashboard",
    products: "Products",
    inventory: "Inventory",
    readiness: "Go-live",
    orders: "Orders",
    promotions: "Promotions",
    customers: "Customers",
    finance: "Finance",
    shipping: "Shipping",
    content: "Content",
    blog: "Blog",
    pages: "Pages",
    collections: "Collections",
    newsletter: "Newsletter",
    productAnalytics: "Product analytics",
    viewSite: "View site",
    logOut: "Log out",
    admin: "Admin",
    language: "Language",
  },
};

type AdminLocaleCtx = {
  locale: AdminLocale;
  setLocale: (l: AdminLocale) => void;
  t: (key: string) => string;
};

const AdminLocaleContext = createContext<AdminLocaleCtx | null>(null);

export function AdminLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AdminLocale>("fr");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "fr") setLocaleState(stored);
  }, []);

  const setLocale = (l: AdminLocale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: string) => LABELS[locale][key] ?? key;

  return (
    <AdminLocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </AdminLocaleContext.Provider>
  );
}

export function useAdminLocale() {
  const ctx = useContext(AdminLocaleContext);
  if (!ctx) throw new Error("useAdminLocale must be used within AdminLocaleProvider");
  return ctx;
}
