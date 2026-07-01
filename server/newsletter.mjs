import { appendSubscriber, hasSubscriber, isValidEmail } from "./newsletter-store.mjs";
import { getNewsletterSettings } from "./db/settings-store.mjs";
import { getProjectRoot } from "./runtime-root.mjs";

function resolveEffectiveProvider(settings) {
  if (settings.hasBrevoKey && (settings.brevoListId || process.env.BREVO_LIST_ID)) return "brevo";
  return "local";
}

function localStorageAvailable() {
  return Boolean(getProjectRoot());
}

/**
 * Subscribe via Brevo or local JSONL fallback (dev without API keys).
 */
export async function subscribeNewsletter({ email, source }) {
  const normalized = email.trim().toLowerCase();
  if (!isValidEmail(normalized)) {
    const err = new Error("Invalid email address");
    err.status = 400;
    throw err;
  }

  const settings = await getNewsletterSettings();
  const provider = resolveEffectiveProvider(settings);

  if (provider !== "local" && (await hasSubscriber(normalized))) {
    return { ok: true, duplicate: true, provider };
  }

  if (provider === "brevo") {
    await subscribeBrevo(normalized, source, settings.brevoListId);
    await tryAppendSubscriber({ email: normalized, source });
    return { ok: true, provider: "brevo" };
  }

  if (await hasSubscriber(normalized)) {
    return { ok: true, duplicate: true, provider: "local" };
  }

  if (!localStorageAvailable()) {
    const err = new Error(
      "Newsletter is not configured for this environment. Add BREVO_API_KEY + BREVO_LIST_ID secrets.",
    );
    err.status = 503;
    throw err;
  }

  await appendSubscriber({ email: normalized, source });
  return { ok: true, provider: "local" };
}

/** Local JSONL log when available (dev); ESP signup still succeeds on Workers without FS. */
async function tryAppendSubscriber(data) {
  try {
    await appendSubscriber(data);
  } catch (err) {
    if (err.status === 503) return;
    throw err;
  }
}

async function subscribeBrevo(email, source, listIdFromSettings) {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = listIdFromSettings || process.env.BREVO_LIST_ID;
  if (!apiKey || !listId) throw missingEnv("BREVO_API_KEY", "BREVO_LIST_ID or admin brevoListId");

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      listIds: [Number(listId)],
      attributes: { SOURCE: source || "website" },
      updateEnabled: true,
    }),
  });

  if (!res.ok && res.status !== 400) {
    const text = await res.text();
    throw apiError("Brevo", res.status, text);
  }
}

function missingEnv(...keys) {
  const err = new Error(`Missing env: ${keys.join(", ")}`);
  err.status = 500;
  return err;
}

function apiError(name, status, body) {
  const err = new Error(`${name} API error (${status}): ${body.slice(0, 200)}`);
  err.status = 502;
  return err;
}
