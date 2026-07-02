import { getSetting, setSetting } from "./settings-store.mjs";
import { listAbandonedCheckouts, markRecoveryEmailSent } from "./orders.mjs";
import { sendAbandonedCheckoutEmail } from "../emails/abandoned-checkout-email.mjs";
import { siteUrl } from "../email.mjs";

const DEFAULT_SETTINGS = {
  enabled: false,
  minAgeHours: 24,
  maxEmailsPerCart: 2,
  minHoursBetweenEmails: 72,
  promoCode: "",
};

export async function getAbandonedRecoverySettings() {
  const stored = (await getSetting("abandonedRecovery", null)) || {};
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    enabled: Boolean(stored.enabled),
    minAgeHours: Math.max(1, Number(stored.minAgeHours) || DEFAULT_SETTINGS.minAgeHours),
    maxEmailsPerCart: Math.max(1, Number(stored.maxEmailsPerCart) || DEFAULT_SETTINGS.maxEmailsPerCart),
    minHoursBetweenEmails: Math.max(
      1,
      Number(stored.minHoursBetweenEmails) || DEFAULT_SETTINGS.minHoursBetweenEmails,
    ),
    promoCode: typeof stored.promoCode === "string" ? stored.promoCode.trim() : "",
  };
}

export async function saveAbandonedRecoverySettings(patch) {
  const current = await getAbandonedRecoverySettings();
  const next = {
    ...current,
    ...patch,
    enabled: patch.enabled != null ? Boolean(patch.enabled) : current.enabled,
    promoCode: patch.promoCode != null ? String(patch.promoCode).trim() : current.promoCode,
  };
  await setSetting("abandonedRecovery", next);
  return next;
}

function hoursSince(iso) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export async function processAbandonedRecoveries() {
  const settings = await getAbandonedRecoverySettings();
  if (!settings.enabled) {
    return { processed: 0, sent: 0, skipped: 0, reason: "disabled" };
  }

  const candidates = await listAbandonedCheckouts({ minAgeHours: settings.minAgeHours, limit: 100 });
  let sent = 0;
  let skipped = 0;

  for (const order of candidates) {
    if (!order.customerEmail?.trim()) {
      skipped++;
      continue;
    }
    if ((order.recoveryEmailCount ?? 0) >= settings.maxEmailsPerCart) {
      skipped++;
      continue;
    }
    if (
      order.recoveryEmailSentAt &&
      hoursSince(order.recoveryEmailSentAt) < settings.minHoursBetweenEmails
    ) {
      skipped++;
      continue;
    }

    const resumeUrl = `${siteUrl()}/checkout/resume?order=${encodeURIComponent(order.id)}`;
    try {
      const result = await sendAbandonedCheckoutEmail(order, {
        resumeUrl,
        promoCode: settings.promoCode || undefined,
      });
      if (result?.skipped) {
        skipped++;
        continue;
      }
      await markRecoveryEmailSent(order.id);
      sent++;
    } catch (e) {
      console.error("[cron] abandoned recovery failed for", order.id, e.message);
      skipped++;
    }
  }

  return { processed: candidates.length, sent, skipped, settings };
}
