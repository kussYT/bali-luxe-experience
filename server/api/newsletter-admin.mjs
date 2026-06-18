import {
  getNewsletterSettings,
  updateNewsletterSettings,
  getNewsletterCopy,
} from "../db/settings-store.mjs";
import { listSubscribers, exportSubscribersCsv } from "../newsletter-store.mjs";
import { isDatabaseConfigured } from "../db/pool.mjs";

export async function getNewsletterCopyResponse() {
  const copy = await getNewsletterCopy();
  return { copy };
}

export async function getAdminNewsletterResponse() {
  const settings = await getNewsletterSettings();
  const subscribers = await listSubscribers({ limit: 100 });
  const bySource = subscribers.reduce((acc, row) => {
    const key = row.source || "website";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    settings: {
      provider: settings.provider,
      brevoListId: settings.brevoListId,
      copy: settings.copy,
      envProvider: settings.envProvider,
      hasBrevoKey: settings.hasBrevoKey,
      hasMailchimpKey: settings.hasMailchimpKey,
      hasKlaviyoKey: settings.hasKlaviyoKey,
    },
    stats: {
      total: subscribers.length,
      bySource,
    },
    subscribers,
    source: isDatabaseConfigured() ? "postgres" : "local",
  };
}

export async function patchAdminNewsletter(body) {
  const allowedProviders = ["local", "brevo", "mailchimp", "klaviyo"];
  const patch = {};

  if (body.provider != null) {
    if (!allowedProviders.includes(body.provider)) {
      const err = new Error("Invalid newsletter provider");
      err.status = 400;
      throw err;
    }
    patch.provider = body.provider;
  }

  if (body.brevoListId != null) {
    patch.brevoListId = String(body.brevoListId).trim();
  }

  if (body.copy && typeof body.copy === "object") {
    patch.copy = body.copy;
  }

  const settings = await updateNewsletterSettings(patch);
  return {
    settings: {
      provider: settings.provider,
      brevoListId: settings.brevoListId,
      copy: settings.copy,
      envProvider: settings.envProvider,
      hasBrevoKey: settings.hasBrevoKey,
      hasMailchimpKey: settings.hasMailchimpKey,
      hasKlaviyoKey: settings.hasKlaviyoKey,
    },
  };
}

export async function getAdminNewsletterExportCsv() {
  return exportSubscribersCsv();
}
