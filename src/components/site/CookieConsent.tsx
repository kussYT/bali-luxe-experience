import { useEffect, useState } from "react";
import { useCookieConsent } from "@/lib/cookie-consent-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function CategoryRow({
  title,
  description,
  locked,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  locked?: boolean;
  checked: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-caption mt-1 max-w-sm">{description}</p>
      </div>
      {locked ? (
        <span className="text-eyebrow shrink-0 !text-muted-foreground">Always on</span>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange?.(!checked)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${checked ? "bg-accent" : "bg-border"}`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform duration-300 ${checked ? "translate-x-5" : "translate-x-0.5"}`}
          />
        </button>
      )}
    </div>
  );
}

export function CookieConsent() {
  const {
    consent,
    bannerOpen,
    preferencesOpen,
    setPreferencesOpen,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    openPreferences,
  } = useCookieConsent();

  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.marketing ?? false);

  useEffect(() => {
    if (preferencesOpen) {
      setAnalytics(consent?.analytics ?? false);
      setMarketing(consent?.marketing ?? false);
    }
  }, [preferencesOpen, consent]);

  const openPrefs = () => {
    setAnalytics(consent?.analytics ?? false);
    setMarketing(consent?.marketing ?? false);
    openPreferences();
  };

  return (
    <>
      {bannerOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-[60] p-4 md:p-6 animate-fade-in"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="page-wrap max-w-none">
            <div className="mx-auto max-w-4xl bg-surface border border-border shadow-[0_28px_56px_-20px_rgba(28,26,23,0.18)] p-6 md:p-8">
              <p className="text-eyebrow">Cookies</p>
              <p className="font-display text-2xl md:text-3xl mt-2 leading-tight">
                Your privacy, our house rules
              </p>
              <p className="text-caption mt-3 max-w-2xl">
                We use essential cookies to run the site. Analytics and marketing cookies help us
                understand visits and share relevant stories — only if you agree.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
                <button type="button" onClick={acceptAll} className="btn-primary">
                  Accept all
                </button>
                <button type="button" onClick={rejectNonEssential} className="btn-outline">
                  Reject non-essential
                </button>
                <button type="button" onClick={openPrefs} className="btn-ghost">
                  Manage preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent className="max-w-lg bg-surface border-border p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 md:p-8 pb-0 text-left">
            <DialogTitle className="font-display text-3xl font-normal tracking-tight">
              Cookie preferences
            </DialogTitle>
            <DialogDescription className="text-caption mt-2">
              Choose which categories we may use. You can change this anytime from the footer.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 md:px-8 mt-4">
            <CategoryRow
              title="Necessary"
              description="Required for cart, region selection and site security."
              locked
              checked
            />
            <CategoryRow
              title="Analytics"
              description="Anonymous usage data to improve the experience."
              checked={analytics}
              onChange={setAnalytics}
            />
            <CategoryRow
              title="Marketing"
              description="Personalised content and campaign measurement."
              checked={marketing}
              onChange={setMarketing}
            />
          </div>

          <div className="p-6 md:p-8 pt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => savePreferences({ analytics, marketing })}
              className="btn-primary flex-1"
            >
              Save preferences
            </button>
            <button type="button" onClick={acceptAll} className="btn-outline flex-1">
              Accept all
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Footer link to reopen preferences */
export function CookiePreferencesLink() {
  const { setPreferencesOpen } = useCookieConsent();
  return (
    <button
      type="button"
      onClick={() => setPreferencesOpen(true)}
      className="text-eyebrow !text-surface/70 link-underline hover:!text-surface"
    >
      Cookie preferences
    </button>
  );
}
