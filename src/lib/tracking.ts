/**
 * Analytics & marketing loaders — only called after explicit cookie consent.
 * Set VITE_GA_MEASUREMENT_ID (and optional VITE_META_PIXEL_ID) in .env.local for dev builds.
 */

let analyticsLoaded = false;
let marketingLoaded = false;

function injectScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

export function loadAnalytics() {
  if (analyticsLoaded || typeof window === "undefined") return;
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!measurementId) return;

  injectScript("bingin-gtag", `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { anonymize_ip: true });
  analyticsLoaded = true;
}

export function loadMarketing() {
  if (marketingLoaded || typeof window === "undefined") return;
  const pixelId = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
  if (!pixelId) return;

  if (!window.fbq) {
    const n = function fbq(...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args);
      else n.queue.push(args);
    } as typeof window.fbq & { queue: unknown[]; callMethod?: (...args: unknown[]) => void };
    n.queue = [];
    window.fbq = n;
    if (!window._fbq) window._fbq = n;
    injectScript("bingin-fb-pixel", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
  }
  marketingLoaded = true;
}

export function unloadTracking() {
  analyticsLoaded = false;
  marketingLoaded = false;
  document.getElementById("bingin-gtag")?.remove();
  document.getElementById("bingin-fb-pixel")?.remove();
}

export function applyTrackingConsent(consent: { analytics: boolean; marketing: boolean }) {
  if (consent.analytics) loadAnalytics();
  if (consent.marketing) loadMarketing();
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: {
      (...args: unknown[]): void;
      queue: unknown[];
      callMethod?: (...args: unknown[]) => void;
    };
    _fbq?: Window["fbq"];
  }
}
