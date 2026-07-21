import { useEffect, useState, type FormEvent } from "react";
import { useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useCookieConsent } from "@/lib/cookie-consent-context";
import {
  fetchNewsletterCopy,
  isValidEmailInput,
  subscribeNewsletter,
  type NewsletterCopy,
} from "@/lib/newsletter";

const STORAGE_KEY = "bingin-newsletter-popup";
const DELAY_MS = 12_000;

const FALLBACK_COPY: NewsletterCopy = {
  eyebrow: "Newsletter",
  title: "Join the diary",
  description: "Receive notes from Bali, new drops and summer stories.",
  placeholder: "Your email",
  button: "Subscribe",
  successMessage: "Welcome to the diary. Check your inbox soon.",
  duplicateMessage: "You're already on the list — thank you for staying close.",
};

function wasDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function NewsletterPopup() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { bannerOpen, hydrated } = useCookieConsent();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [copy, setCopy] = useState<NewsletterCopy>(FALLBACK_COPY);

  useEffect(() => {
    fetchNewsletterCopy().then(setCopy).catch(() => {});
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return;
    if (wasDismissed()) return;
    // Wait until cookie banner is closed so the two don’t fight.
    if (bannerOpen) return;

    const timer = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [hydrated, bannerOpen, pathname]);

  function dismiss() {
    markDismissed();
    setOpen(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidEmailInput(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    setMessage("");
    const result = await subscribeNewsletter(email, "popup");
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    setStatus("success");
    setMessage(result.duplicate ? copy.duplicateMessage : copy.successMessage);
    setEmail("");
    window.setTimeout(dismiss, 1800);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
        aria-label="Close newsletter"
        onClick={dismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-popup-title"
        className="relative w-full max-w-md bg-background border border-border shadow-xl animate-fade-up p-8 sm:p-10"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 size-9 flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <p className="text-eyebrow text-muted-foreground">{copy.eyebrow}</p>
        <h2
          id="newsletter-popup-title"
          className="font-display text-3xl sm:text-4xl mt-3 leading-[1.05] pr-8"
        >
          {copy.title}
        </h2>
        <p className="text-caption mt-4 max-w-sm">{copy.description}</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading" || status === "success"}
            placeholder={copy.placeholder}
            className="w-full border-b border-border bg-transparent pb-3 outline-none text-sm placeholder:text-muted-foreground disabled:opacity-50"
          />
          {message && (
            <p
              role="status"
              className={`text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
            >
              {message}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="btn-primary disabled:opacity-50"
            >
              {status === "loading" ? "Sending…" : copy.button}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="text-sm text-muted-foreground link-underline"
            >
              Maybe later
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
