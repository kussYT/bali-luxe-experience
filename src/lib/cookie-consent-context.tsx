import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  acceptAllConsent,
  hasConsentChoice,
  readCookieConsent,
  rejectNonEssentialConsent,
  writeCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";
import { applyTrackingConsent } from "@/lib/tracking";

type CookieConsentContextValue = {
  consent: CookieConsent | null;
  hydrated: boolean;
  bannerOpen: boolean;
  preferencesOpen: boolean;
  setPreferencesOpen: (open: boolean) => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (prefs: Pick<CookieConsent, "analytics" | "marketing">) => void;
  openPreferences: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function applyConsent(consent: CookieConsent) {
  writeCookieConsent(consent);
  applyTrackingConsent(consent);
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readCookieConsent();
    setConsent(stored);
    setBannerOpen(!hasConsentChoice());
    if (stored) applyTrackingConsent(stored);
    setHydrated(true);
  }, []);

  const finalize = useCallback((next: CookieConsent) => {
    applyConsent(next);
    setConsent(next);
    setBannerOpen(false);
    setPreferencesOpen(false);
  }, []);

  const acceptAll = useCallback(() => finalize(acceptAllConsent()), [finalize]);
  const rejectNonEssential = useCallback(() => finalize(rejectNonEssentialConsent()), [finalize]);

  const savePreferences = useCallback(
    (prefs: Pick<CookieConsent, "analytics" | "marketing">) => {
      finalize({
        version: 1,
        necessary: true,
        analytics: prefs.analytics,
        marketing: prefs.marketing,
        updatedAt: new Date().toISOString(),
      });
    },
    [finalize],
  );

  const openPreferences = useCallback(() => {
    setPreferencesOpen(true);
    setBannerOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      consent: hydrated ? consent : null,
      hydrated,
      bannerOpen: hydrated && bannerOpen,
      preferencesOpen,
      setPreferencesOpen,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openPreferences,
    }),
    [
      hydrated,
      consent,
      bannerOpen,
      preferencesOpen,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openPreferences,
    ],
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
}
