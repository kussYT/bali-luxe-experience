import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getProjectRoot } from "./runtime-root.mjs";
import {
  appendNewsletterSubscriber,
  hasNewsletterSubscriber,
  listNewsletterSubscribers,
} from "./db/newsletter-subscribers.mjs";
import { isDatabaseConfigured } from "./db/pool.mjs";

function getDataDir() {
  const root = getProjectRoot();
  return root ? join(root, "data") : null;
}

function getSubscribersFile() {
  const dataDir = getDataDir();
  return dataDir ? join(dataDir, "newsletter-subscribers.jsonl") : null;
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === "string" && email.length <= 254 && emailRe.test(email.trim().toLowerCase());
}

export async function appendSubscriber({ email, source }) {
  const normalized = email.trim().toLowerCase();

  if (isDatabaseConfigured()) {
    await appendNewsletterSubscriber({ email: normalized, source });
    return { email: normalized };
  }

  const dataDir = getDataDir();
  const subscribersFile = getSubscribersFile();
  if (!dataDir || !subscribersFile) {
    const err = new Error("Newsletter file storage is not available in this runtime");
    err.status = 503;
    throw err;
  }
  await mkdir(dataDir, { recursive: true });
  const line = JSON.stringify({
    email: normalized,
    source: source || "website",
    subscribedAt: new Date().toISOString(),
  });
  await appendFile(subscribersFile, `${line}\n`, "utf8");
  return { email: normalized };
}

export async function hasSubscriber(email) {
  if (isDatabaseConfigured()) {
    return hasNewsletterSubscriber(email);
  }

  const subscribersFile = getSubscribersFile();
  if (!subscribersFile) return false;
  try {
    const raw = await readFile(subscribersFile, "utf8");
    const normalized = email.trim().toLowerCase();
    return raw.split("\n").some((line) => {
      if (!line.trim()) return false;
      try {
        return JSON.parse(line).email === normalized;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export async function listSubscribers({ limit = 500 } = {}) {
  if (isDatabaseConfigured()) {
    return listNewsletterSubscribers({ limit });
  }

  const subscribersFile = getSubscribersFile();
  if (!subscribersFile) return [];
  try {
    const raw = await readFile(subscribersFile, "utf8");
    const rows = raw
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .reverse();

    return rows.slice(0, limit).map((row) => ({
      email: row.email,
      source: row.source || "website",
      subscribedAt: row.subscribedAt || null,
    }));
  } catch {
    return [];
  }
}

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportSubscribersCsv() {
  const subscribers = await listSubscribers({ limit: 10000 });
  const lines = ["email,source,subscribed_at"];
  for (const row of subscribers) {
    lines.push([row.email, row.source, row.subscribedAt || ""].map(csvEscape).join(","));
  }
  return lines.join("\n");
}
