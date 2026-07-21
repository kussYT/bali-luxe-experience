import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useCookieConsent } from "@/lib/cookie-consent-context";
import { trackSitePageview } from "@/lib/site-analytics";

/** Sends pageviews to our API after analytics cookie consent. */
export function SiteAnalyticsTracker() {
  const { consent } = useCookieConsent();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const href = useRouterState({ select: (s) => s.location.href });
  const enabled = Boolean(consent?.analytics);
  const prev = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (prev.current === href) return;
    prev.current = href;
    const search = typeof window !== "undefined" ? window.location.search : "";
    trackSitePageview(pathname, search);
  }, [enabled, pathname, href]);

  return null;
}
