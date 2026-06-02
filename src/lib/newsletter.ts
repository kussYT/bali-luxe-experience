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
