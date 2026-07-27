import { getSetting, setSetting } from "./settings-store.mjs";
import { listAbandonedCheckouts, markRecoveryEmailSent } from "./orders.mjs";
import { sendAbandonedCheckoutEmail } from "../emails/abandoned-checkout-email.mjs";
import { paymentResumeUrl } from "../email.mjs";

const DEFAULT_SETTINGS = {
  enabled: false,
  minAgeHours: 24,
  maxEmailsPerCart: 2,
  minHoursBetweenEmails: 72,
  promoCode: "",
  emailSubject: "Votre panier vous attend — Bingin Diaries",
  emailTitle: "Votre panier vous attend",
  emailIntro:
    "Vous aviez commencé une commande sur Bingin Diaries — votre sélection vous attend encore.",
  emailButtonLabel: "Complete your purchase",
  emailClosing:
    "Ce lien est valable 30 jours. Si vous avez des questions, répondez simplement à cet e-mail.",
};

function normalizeEmailCopy(stored) {
  return {
    emailSubject:
      typeof stored.emailSubject === "string" && stored.emailSubject.trim()
        ? stored.emailSubject.trim()
        : DEFAULT_SETTINGS.emailSubject,
    emailTitle:
      typeof stored.emailTitle === "string" && stored.emailTitle.trim()
        ? stored.emailTitle.trim()
        : DEFAULT_SETTINGS.emailTitle,
    emailIntro:
      typeof stored.emailIntro === "string" && stored.emailIntro.trim()
        ? stored.emailIntro.trim()
        : DEFAULT_SETTINGS.emailIntro,
    emailButtonLabel:
      typeof stored.emailButtonLabel === "string" && stored.emailButtonLabel.trim()
        ? stored.emailButtonLabel.trim()
        : DEFAULT_SETTINGS.emailButtonLabel,
    emailClosing:
      typeof stored.emailClosing === "string" && stored.emailClosing.trim()
        ? stored.emailClosing.trim()
        : DEFAULT_SETTINGS.emailClosing,
  };
}

export function abandonedRecoveryEmailCopy(settings) {
  return normalizeEmailCopy(settings || {});
}

export async function getAbandonedRecoverySettings() {
  const stored = (await getSetting("abandonedRecovery", null)) || {};
  return {
    ...DEFAULT_SETTINGS,
    ...normalizeEmailCopy(stored),
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
    emailSubject:
      patch.emailSubject != null ? String(patch.emailSubject).trim() : current.emailSubject,
    emailTitle: patch.emailTitle != null ? String(patch.emailTitle).trim() : current.emailTitle,
    emailIntro: patch.emailIntro != null ? String(patch.emailIntro).trim() : current.emailIntro,
    emailButtonLabel:
      patch.emailButtonLabel != null
        ? String(patch.emailButtonLabel).trim()
        : current.emailButtonLabel,
    emailClosing:
      patch.emailClosing != null ? String(patch.emailClosing).trim() : current.emailClosing,
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
    if (order.externalRef === "manual_invoice" || (order.notes || "").includes("[manual_invoice]")) {
      skipped++;
      continue;
    }
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

    const resumeUrl = paymentResumeUrl(order.id);
    try {
      const result = await sendAbandonedCheckoutEmail(order, {
        resumeUrl,
        promoCode: settings.promoCode || undefined,
        copy: abandonedRecoveryEmailCopy(settings),
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
