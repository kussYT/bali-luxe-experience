#!/usr/bin/env node
/**
 * Prints wrangler secret put commands for production setup.
 * Run each command and paste the value when prompted.
 */
const secrets = [
  "DATABASE_URL",
  "ADMIN_PASSWORD",
  "ADMIN_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SITE_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_OPS",
  "BREVO_API_KEY",
  "BREVO_LIST_ID",
  "INSTAGRAM_ACCESS_TOKEN",
  "INSTAGRAM_USER_ID",
  "MONDIAL_RELAY_BRAND_ID",
];
console.log("# Cloudflare Workers secrets — run from project root:\n");
for (const name of secrets) {
  console.log(`npx wrangler secret put ${name}`);
}
console.log("\n# Optional: create R2 bucket for admin image uploads");
console.log("npx wrangler r2 bucket create bingin-diaries-uploads");
console.log("# Then uncomment r2_buckets in wrangler.jsonc and redeploy.\n");
