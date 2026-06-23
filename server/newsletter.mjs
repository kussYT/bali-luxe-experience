import { appendSubscriber, hasSubscriber, isValidEmail } from "./newsletter-store.mjs";
import { getNewsletterSettings } from "./db/settings-store.mjs";
import { getProjectRoot } from "./runtime-root.mjs";

function resolveEffectiveProvider(settings) {
  const configured = (settings.provider || "local").toLowerCase();
  if (configured !== "local") return configured;

  if (settings.hasBrevoKey && (settings.brevoListId || process.env.BREVO_LIST_ID)) return "brevo";
  if (
    settings.hasMailchimpKey &&
    process.env.MAILCHIMP_LIST_ID &&
    process.env.MAILCHIMP_SERVER_PREFIX
  ) {
    return "mailchimp";
  }
  if (settings.hasKlaviyoKey && process.env.KLAVIYO_LIST_ID) return "klaviyo";

  return "local";
}

function localStorageAvailable() {
  return Boolean(getProjectRoot());
}

/**
 * Subscribe via configured ESP or local JSONL fallback.
 * Provider/list ID: admin settings with env fallback.
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

  if (provider === "mailchimp") {
    await subscribeMailchimp(normalized, source);
    await tryAppendSubscriber({ email: normalized, source });
    return { ok: true, provider: "mailchimp" };
  }

  if (provider === "klaviyo") {
    await subscribeKlaviyo(normalized, source);
    await tryAppendSubscriber({ email: normalized, source });
    return { ok: true, provider: "klaviyo" };
  }

  if (await hasSubscriber(normalized)) {
    return { ok: true, duplicate: true, provider: "local" };
  }

  if (!localStorageAvailable()) {
    const err = new Error(
      "Newsletter is not configured for this environment. Set Brevo in Admin or add BREVO_API_KEY + BREVO_LIST_ID secrets.",
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

async function subscribeMailchimp(email, source) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  const server = process.env.MAILCHIMP_SERVER_PREFIX;
  if (!apiKey || !listId || !server) {
    throw missingEnv("MAILCHIMP_API_KEY", "MAILCHIMP_LIST_ID", "MAILCHIMP_SERVER_PREFIX");
  }

  const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");
  const res = await fetch(`https://${server}.api.mailchimp.com/3.0/lists/${listId}/members`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: email,
      status: "subscribed",
      merge_fields: { SOURCE: source || "website" },
    }),
  });

  if (!res.ok && res.status !== 400) {
    const text = await res.text();
    throw apiError("Mailchimp", res.status, text);
  }
}

async function subscribeKlaviyo(email, source) {
  const apiKey = process.env.KLAVIYO_API_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;
  if (!apiKey || !listId) throw missingEnv("KLAVIYO_API_KEY", "KLAVIYO_LIST_ID");

  const res = await fetch("https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/", {
    method: "POST",
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      "Content-Type": "application/json",
      revision: "2024-10-15",
    },
    body: JSON.stringify({
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          profiles: {
            data: [
              {
                type: "profile",
                attributes: {
                  email,
                  subscriptions: {
                    email: { marketing: { consent: "SUBSCRIBED" } },
                  },
                },
              },
            ],
          },
        },
        relationships: {
          list: { data: { type: "list", id: listId } },
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw apiError("Klaviyo", res.status, text);
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
