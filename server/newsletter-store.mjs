import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(__root, "data");
const SUBSCRIBERS_FILE = join(DATA_DIR, "newsletter-subscribers.jsonl");

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === "string" && email.length <= 254 && emailRe.test(email.trim().toLowerCase());
}

export async function appendSubscriber({ email, source }) {
  await mkdir(DATA_DIR, { recursive: true });
  const normalized = email.trim().toLowerCase();
  const line = JSON.stringify({
    email: normalized,
    source: source || "website",
    subscribedAt: new Date().toISOString(),
  });
  await appendFile(SUBSCRIBERS_FILE, `${line}\n`, "utf8");
  return { email: normalized };
}

export async function hasSubscriber(email) {
  try {
    const raw = await readFile(SUBSCRIBERS_FILE, "utf8");
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
  try {
    const raw = await readFile(SUBSCRIBERS_FILE, "utf8");
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
