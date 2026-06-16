import { appendSubscriber, hasSubscriber, isValidEmail } from "./newsletter-store.mjs";

/**
 * Subscribe via configured ESP or local JSONL fallback.
 * Env: NEWSLETTER_PROVIDER=brevo|mailchimp|klaviyo|local (default local)
 */
export async function subscribeNewsletter({ email, source }) {
  const normalized = email.trim().toLowerCase();
  if (!isValidEmail(normalized)) {
    const err = new Error("Invalid email address");
    err.status = 400;
    throw err;
  }

  if (await hasSubscriber(normalized)) {
    return { ok: true, duplicate: true, provider: "local" };
  }

  const provider = (process.env.NEWSLETTER_PROVIDER || "local").toLowerCase();

  if (provider === "brevo") {
    await subscribeBrevo(normalized, source);
    await appendSubscriber({ email: normalized, source });
    return { ok: true, provider: "brevo" };
  }

  if (provider === "mailchimp") {
    await subscribeMailchimp(normalized, source);
    await appendSubscriber({ email: normalized, source });
    return { ok: true, provider: "mailchimp" };
  }

  if (provider === "klaviyo") {
    await subscribeKlaviyo(normalized, source);
    await appendSubscriber({ email: normalized, source });
    return { ok: true, provider: "klaviyo" };
  }

  await appendSubscriber({ email: normalized, source });
  return { ok: true, provider: "local" };
}

async function subscribeBrevo(email, source) {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;
  if (!apiKey || !listId) throw missingEnv("BREVO_API_KEY", "BREVO_LIST_ID");

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
