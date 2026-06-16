/**
 * Télécharge une piste ambient placeholder (Pixabay — licence libre).
 * Usage: node scripts/download-ambient-audio.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "public", "audio", "ambient.mp3");

const URL =
  "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-relaxing-music-22174.mp3";

const res = await fetch(URL, { redirect: "follow" });
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const buf = Buffer.from(await res.arrayBuffer());
await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, buf);
console.log(`Saved ${outPath} (${(buf.length / 1024).toFixed(0)} KB)`);
