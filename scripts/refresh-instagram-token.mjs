/**
 * Refresh a long-lived Instagram access token (~60 days).
 * https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token
 *
 * Usage:
 *   npm run instagram:token-refresh
 *   npm run instagram:token-refresh -- --update-cloudflare
 *
 * In GitHub Actions, writes `access_token` to GITHUB_OUTPUT when --github-output is set.
 */
import { config as loadEnv } from "dotenv";
import { execSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: join(root, ".env.local") });
loadEnv({ path: join(root, ".env") });

const updateCloudflare = process.argv.includes("--update-cloudflare");
const githubOutput = process.argv.includes("--github-output");

const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
if (!token) {
  console.error("Missing INSTAGRAM_ACCESS_TOKEN");
  process.exit(1);
}

const url = new URL("https://graph.instagram.com/refresh_access_token");
url.searchParams.set("grant_type", "ig_refresh_token");
url.searchParams.set("access_token", token);

const res = await fetch(url);
const data = await res.json();

if (!res.ok || !data.access_token) {
  console.error("Token refresh failed:", JSON.stringify(data));
  process.exit(1);
}

const expiresIn = Number(data.expires_in) || 0;
const expiresAt = new Date(Date.now() + expiresIn * 1000);
console.log(
  `Refreshed. Valid ~${Math.round(expiresIn / 86400)} days (until ${expiresAt.toISOString().slice(0, 10)}).`,
);

if (githubOutput && process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `access_token=${data.access_token}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `expires_at=${expiresAt.toISOString()}\n`);
}

if (updateCloudflare) {
  execSync("npx wrangler secret put INSTAGRAM_ACCESS_TOKEN", {
    input: data.access_token,
    stdio: ["pipe", "inherit", "inherit"],
    cwd: root,
  });
  console.log("Updated Cloudflare secret INSTAGRAM_ACCESS_TOKEN");
}

if (!updateCloudflare && !githubOutput && !process.env.CI) {
  console.log("\nNew token — update .env.local and Cloudflare:\n");
  console.log(data.access_token);
}
