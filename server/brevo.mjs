/**
 * Brevo API helpers (newsletter list stats).
 */
export async function fetchBrevoListStats(listId) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const id = String(listId || process.env.BREVO_LIST_ID || "").trim();
  if (!apiKey || !id) return null;

  const res = await fetch(`https://api.brevo.com/v3/contacts/lists/${encodeURIComponent(id)}`, {
    headers: {
      "api-key": apiKey,
      accept: "application/json",
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const total =
    typeof data.totalSubscribers === "number"
      ? data.totalSubscribers
      : typeof data.uniqueSubscribers === "number"
        ? data.uniqueSubscribers
        : null;

  return {
    listId: id,
    name: typeof data.name === "string" ? data.name : null,
    totalSubscribers: total,
  };
}
