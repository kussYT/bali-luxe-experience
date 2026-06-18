export type NewsletterCopy = {
  eyebrow: string;
  title: string;
  description: string;
  placeholder: string;
  button: string;
  successMessage: string;
  duplicateMessage: string;
};

const DEFAULT_COPY: NewsletterCopy = {
  eyebrow: "Newsletter",
  title: "Join the diary",
  description: "Receive notes from Bali, new drops and summer stories.",
  placeholder: "Your email",
  button: "Subscribe",
  successMessage: "Welcome to the diary. Check your inbox soon.",
  duplicateMessage: "You're already on the list — thank you for staying close.",
};

export async function fetchNewsletterCopy(): Promise<NewsletterCopy> {
  try {
    const res = await fetch("/api/newsletter/copy");
    if (!res.ok) return DEFAULT_COPY;
    const data = (await res.json()) as { copy?: Partial<NewsletterCopy> };
    return { ...DEFAULT_COPY, ...(data.copy || {}) };
  } catch {
    return DEFAULT_COPY;
  }
}

export type NewsletterResult =
  | { ok: true; duplicate?: boolean }
  | { ok: false; error: string };

export async function subscribeNewsletter(
  email: string,
  source = "website",
): Promise<NewsletterResult> {
  try {
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; duplicate?: boolean };
    if (!res.ok) {
      return { ok: false, error: data.error || "Subscription failed. Please try again." };
    }
    return { ok: true, duplicate: data.duplicate };
  } catch {
    return { ok: false, error: "Network error. Please check your connection." };
  }
}

export function isValidEmailInput(email: string): boolean {
  const t = email.trim();
  return t.length > 0 && t.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}
