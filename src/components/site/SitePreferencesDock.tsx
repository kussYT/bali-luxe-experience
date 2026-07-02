import { LOCALES, useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/messages";
import { useCookieConsent } from "@/lib/cookie-consent-context";
import { MarketSelector } from "@/components/site/MarketSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const dockShell =
  "bg-surface/90 backdrop-blur-md border border-border shadow-[0_8px_32px_-8px_rgba(28,26,23,0.12)]";

/** Fixed bottom-right: language (+ ship-to on desktop) while scrolling. */
export function SitePreferencesDock() {
  const { locale, setLocale } = useLocale();
  const { bannerOpen } = useCookieConsent();
  const bottom = bannerOpen ? "bottom-36 md:bottom-40" : "bottom-5 md:bottom-8";
  const current = LOCALES.find((l) => l.code === locale);

  return (
    <div
      className={`fixed right-5 md:right-8 z-40 flex flex-col items-end gap-1.5 ${bottom}`}
      aria-label="Language and region"
    >
      {/* Mobile: current language only — tap to change */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center px-2.5 py-1.5 md:hidden ${dockShell} text-[0.6875rem] font-medium tracking-[0.2em] uppercase text-foreground transition-colors duration-300`}
            aria-label={current ? `Language: ${current.label}` : "Language"}
          >
            {locale.toUpperCase()}
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-auto p-1.5 border-border bg-surface shadow-lg">
          <ul role="listbox" aria-label="Language" className="flex flex-col gap-0.5 min-w-[8.5rem]">
            {LOCALES.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={locale === item.code}
                  onClick={() => setLocale(item.code as Locale)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors rounded-sm ${
                    locale === item.code
                      ? "bg-secondary font-medium text-foreground"
                      : "text-foreground/80 hover:bg-secondary/70 hover:text-foreground"
                  }`}
                >
                  <span className="tracking-[0.12em] uppercase text-[0.6875rem] mr-2">{item.code}</span>
                  <span className="text-foreground/70">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>

      {/* Desktop: all languages inline */}
      <div
        className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 ${dockShell}`}
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

      <div className="hidden md:block">
        <MarketSelector variant="dock" />
      </div>
    </div>
  );
}
