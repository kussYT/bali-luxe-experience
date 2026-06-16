import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { query, isDatabaseConfigured } from "./pool.mjs";

const __root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SETTINGS_FILE = join(__root, "data", "site-settings.json");

export const DEFAULT_NEWSLETTER_SETTINGS = {
  provider: "local",
  brevoListId: "",
  copy: {
    eyebrow: "Newsletter",
    title: "Join the diary",
    description: "Receive notes from Bali, new drops and summer stories.",
    placeholder: "Your email",
    button: "Subscribe",
    successMessage: "Welcome to the diary. Check your inbox soon.",
    duplicateMessage: "You're already on the list — thank you for staying close.",
  },
};

async function readFileSettings() {
  try {
    const raw = await readFile(SETTINGS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeFileSettings(all) {
  await mkdir(join(__root, "data"), { recursive: true });
  await writeFile(SETTINGS_FILE, JSON.stringify(all, null, 2), "utf8");
}

export async function getSetting(key, defaultValue = null) {
  if (isDatabaseConfigured()) {
    const { rows } = await query(`SELECT value FROM site_settings WHERE key = $1`, [key]);
    if (rows.length > 0) return rows[0].value;
  } else {
    const file = await readFileSettings();
    if (file[key] != null) return file[key];
  }
  return defaultValue;
}

export async function setSetting(key, value) {
  if (isDatabaseConfigured()) {
    await query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, JSON.stringify(value)],
    );
    return value;
  }

  const file = await readFileSettings();
  file[key] = value;
  await writeFileSettings(file);
  return value;
}

export async function getNewsletterSettings() {
  const stored = (await getSetting("newsletter", null)) || {};
  const merged = {
    ...DEFAULT_NEWSLETTER_SETTINGS,
    ...stored,
    copy: { ...DEFAULT_NEWSLETTER_SETTINGS.copy, ...(stored.copy || {}) },
  };

  const envProvider = process.env.NEWSLETTER_PROVIDER?.trim();
  const envListId = process.env.BREVO_LIST_ID?.trim();

  return {
    ...merged,
    provider: merged.provider || envProvider || "local",
    brevoListId: merged.brevoListId || envListId || "",
    envProvider: envProvider || null,
    hasBrevoKey: Boolean(process.env.BREVO_API_KEY),
    hasMailchimpKey: Boolean(process.env.MAILCHIMP_API_KEY),
    hasKlaviyoKey: Boolean(process.env.KLAVIYO_API_KEY),
  };
}

export async function updateNewsletterSettings(patch) {
  const current = await getNewsletterSettings();
  const next = {
    provider: patch.provider ?? current.provider,
    brevoListId: patch.brevoListId ?? current.brevoListId,
    copy: { ...current.copy, ...(patch.copy || {}) },
  };
  await setSetting("newsletter", {
    provider: next.provider,
    brevoListId: next.brevoListId,
    copy: next.copy,
  });
  return getNewsletterSettings();
}

export async function getNewsletterCopy() {
  const settings = await getNewsletterSettings();
  return settings.copy;
}
