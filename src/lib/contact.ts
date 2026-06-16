export type ContactResult = { ok: true } | { ok: false; error: string };

export async function sendContactMessage(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactResult> {
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error || "Unable to send message. Please try again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Please check your connection." };
  }
}
