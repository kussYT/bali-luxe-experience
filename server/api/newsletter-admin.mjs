import {
  getNewsletterSettings,
  updateNewsletterSettings,
  getNewsletterCopy,
} from "../db/settings-store.mjs";
import { listSubscribers, exportSubscribersCsv } from "../newsletter-store.mjs";
import { isDatabaseConfigured } from "../db/pool.mjs";
import { fetchBrevoListStats } from "../brevo.mjs";

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

  const brevoList = settings.hasBrevoKey
    ? await fetchBrevoListStats(settings.brevoListId)
    : null;

  const siteSignups = subscribers.length;
  const brevoTotal = brevoList?.totalSubscribers ?? null;
  const total = brevoTotal ?? siteSignups;

  return {
    settings: {
      brevoListId: settings.brevoListId,
      copy: settings.copy,
      hasBrevoKey: settings.hasBrevoKey,
    },
    stats: {
      total,
      siteSignups,
      brevoTotal,
      brevoListName: brevoList?.name ?? null,
      bySource,
    },
    subscribers,
    source: isDatabaseConfigured() ? "postgres" : "local",
  };
}

export async function patchAdminNewsletter(body) {
  const patch = {};

  if (body.brevoListId != null) {
    patch.brevoListId = String(body.brevoListId).trim();
  }

  if (body.copy && typeof body.copy === "object") {
    patch.copy = body.copy;
  }

  const settings = await updateNewsletterSettings(patch);
  return {
    settings: {
      brevoListId: settings.brevoListId,
      copy: settings.copy,
      hasBrevoKey: settings.hasBrevoKey,
    },
  };
}

export async function getAdminNewsletterExportCsv() {
  return exportSubscribersCsv();
}
