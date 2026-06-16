export const COOKIE_CONSENT_KEY = "bingin-cookie-consent";
export const COOKIE_CONSENT_VERSION = 1;

export type CookieCategory = "necessary" | "analytics" | "marketing";

export type CookieConsent = {
  version: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export const DEFAULT_CONSENT: CookieConsent = {
  version: COOKIE_CONSENT_VERSION,
  necessary: true,
  analytics: false,
  marketing: false,
  updatedAt: new Date(0).toISOString(),
};

export function acceptAllConsent(): CookieConsent {
  return {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    analytics: true,
    marketing: true,
    updatedAt: new Date().toISOString(),
  };
}

export function rejectNonEssentialConsent(): CookieConsent {
  return {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
  };
}

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null;
    if (parsed.necessary !== true) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCookieConsent(consent: CookieConsent) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
}

export function hasConsentChoice(): boolean {
  return readCookieConsent() !== null;
}
