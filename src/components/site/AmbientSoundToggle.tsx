import { useAmbientSound } from "@/lib/ambient-sound-context";
import { useCookieConsent } from "@/lib/cookie-consent-context";

export function AmbientSoundToggle() {
  const { enabled, ready, toggle } = useAmbientSound();
  const { bannerOpen } = useCookieConsent();

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!ready}
      aria-pressed={enabled}
      aria-label={enabled ? "Turn ambient sound off" : "Turn ambient sound on"}
      className={`fixed right-5 md:right-8 z-50 px-4 py-2.5 bg-surface/90 backdrop-blur-md border border-border text-[0.625rem] font-medium tracking-[0.28em] uppercase text-foreground/80 hover:text-foreground hover:border-foreground/30 transition-all duration-500 shadow-[0_8px_32px_-8px_rgba(28,26,23,0.12)] disabled:opacity-40 ${bannerOpen ? "bottom-36 md:bottom-40" : "bottom-5 md:bottom-8"}`}
    >
      {enabled ? "Sound off" : "Sound on"}
    </button>
  );
}
