import { LOCALES, useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/messages";
import { useCookieConsent } from "@/lib/cookie-consent-context";
import { MarketSelector } from "@/components/site/MarketSelector";

const dockShell =
  "bg-surface/90 backdrop-blur-md border border-border shadow-[0_8px_32px_-8px_rgba(28,26,23,0.12)]";

/** Fixed bottom-right: language codes + ship-to / currency (visible while scrolling). */
export function SitePreferencesDock() {
  const { locale, setLocale } = useLocale();
  const { bannerOpen } = useCookieConsent();
  const bottom = bannerOpen ? "bottom-36 md:bottom-40" : "bottom-5 md:bottom-8";

  return (
    <div
      className={`fixed right-5 md:right-8 z-40 flex flex-col items-end gap-1.5 ${bottom}`}
      aria-label="Language and region"
    >
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 ${dockShell}`}
        role="group"
        aria-label="Language"
      >
        {LOCALES.map((item, index) => (
          <span key={item.code} className="inline-flex items-center gap-1.5">
            {index > 0 && (
              <span className="text-border select-none" aria-hidden>
                ·
              </span>
            )}
            <button
              type="button"
              onClick={() => setLocale(item.code as Locale)}
              className={`text-[0.5625rem] font-medium tracking-[0.2em] uppercase transition-colors duration-300 ${
                locale === item.code
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-current={locale === item.code ? "true" : undefined}
              aria-label={item.label}
            >
              {item.code.toUpperCase()}
            </button>
          </span>
        ))}
      </div>
      <MarketSelector variant="dock" />
    </div>
  );
}
