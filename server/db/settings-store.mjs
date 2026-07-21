import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { query, isDatabaseConfigured } from "./pool.mjs";
import { getProjectRoot } from "../runtime-root.mjs";

function getSettingsFile() {
  const root = getProjectRoot();
  return root ? join(root, "data", "site-settings.json") : null;
}

export const DEFAULT_NEWSLETTER_SETTINGS = {
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
  const settingsFile = getSettingsFile();
  if (!settingsFile) return {};
  try {
    const raw = await readFile(settingsFile, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeFileSettings(all) {
  const root = getProjectRoot();
  const settingsFile = getSettingsFile();
  if (!root || !settingsFile) {
    const err = new Error("Settings file storage is not available in this runtime");
    err.status = 503;
    throw err;
  }
  await mkdir(join(root, "data"), { recursive: true });
  await writeFile(settingsFile, JSON.stringify(all, null, 2), "utf8");
}

export async function getSetting(key, defaultValue = null) {
  const batch = await getSettings([key]);
  if (batch[key] != null) return batch[key];
  return defaultValue;
}

/** Load multiple CMS keys in one SQL round-trip. */
export async function getSettings(keys) {
  const unique = [...new Set(keys.filter(Boolean))];
  if (!unique.length) return {};

  if (isDatabaseConfigured()) {
    const { rows } = await query(`SELECT key, value FROM site_settings WHERE key = ANY($1::text[])`, [
      unique,
    ]);
    const out = {};
    for (const row of rows) out[row.key] = row.value;
    return out;
  }

  const file = await readFileSettings();
  const out = {};
  for (const key of unique) {
    if (file[key] != null) out[key] = file[key];
  }
  return out;
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

  const envListId = process.env.BREVO_LIST_ID?.trim();

  return {
    ...merged,
    brevoListId: merged.brevoListId || envListId || "",
    hasBrevoKey: Boolean(process.env.BREVO_API_KEY),
  };
}

export async function updateNewsletterSettings(patch) {
  const current = await getNewsletterSettings();
  const next = {
    brevoListId: patch.brevoListId ?? current.brevoListId,
    copy: { ...current.copy, ...(patch.copy || {}) },
  };
  await setSetting("newsletter", {
    brevoListId: next.brevoListId,
    copy: next.copy,
  });
  return getNewsletterSettings();
}

export async function getNewsletterCopy() {
  const settings = await getNewsletterSettings();
  return settings.copy;
}
