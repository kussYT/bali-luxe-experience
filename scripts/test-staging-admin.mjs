/**
 * Staging smoke test — admin auth, CMS, uploads, public content sync.
 * Usage: node scripts/test-staging-admin.mjs [baseUrl]
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] || "https://bingin-diaries.bingindiaries.workers.dev";
const MARKER = `__smoke_${Date.now()}__`;

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal();

const password = process.env.ADMIN_PASSWORD;
if (!password) {
  console.error("FAIL: ADMIN_PASSWORD missing in .env.local");
  process.exit(1);
}

let cookie = "";
const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`OK  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
}

async function api(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Cookie: cookie,
      ...(init.headers || {}),
    },
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  for (const c of setCookie) {
    const m = c.match(/^([^=]+)=([^;]+)/);
    if (m) cookie = `${m[1]}=${m[2]}`;
  }
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { res, json, text };
}

async function main() {
  console.log(`\nStaging smoke test → ${BASE}\n`);

  const publicPages = ["/", "/collection", "/about", "/find-us", "/contact", "/admin/login"];
  for (const path of publicPages) {
    const res = await fetch(`${BASE}${path}`);
    if (res.ok) pass(`Public ${path}`, String(res.status));
    else fail(`Public ${path}`, String(res.status));
  }

  for (const path of ["/api/catalog", "/api/content/site", "/api/instagram"]) {
    const { res, json } = await api(path);
    if (res.ok) pass(`API GET ${path}`, typeof json === "object" ? "json ok" : "ok");
    else fail(`API GET ${path}`, String(res.status));
  }

  const adminPages = [
    "/admin",
    "/admin/products",
    "/admin/inventory",
    "/admin/orders",
    "/admin/content",
    "/admin/content/about",
    "/admin/content/find-us",
    "/admin/blog",
    "/admin/pages",
    "/admin/collections",
    "/admin/newsletter",
  ];
  for (const path of adminPages) {
    const res = await fetch(`${BASE}${path}`);
    if (res.ok) pass(`Admin page ${path}`, String(res.status));
    else fail(`Admin page ${path}`, String(res.status));
  }

  const login = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  if (login.res.ok && login.json?.ok) pass("Admin login");
  else {
    fail("Admin login", login.json?.error || String(login.res.status));
    summarize();
    process.exit(1);
  }

  const me = await api("/api/admin/me");
  if (me.json?.authenticated) pass("Admin session");
  else fail("Admin session");

  const status = await api("/api/admin/cms/status");
  if (status.res.ok) {
    const uploads = status.json?.uploads || "unknown";
    pass("CMS status", `uploads=${uploads}`);
    if (uploads !== "r2") fail("R2 uploads binding", `expected r2, got ${uploads}`);
  } else fail("CMS status");

  const adminApis = [
    "/api/admin/catalog",
    "/api/admin/inventory",
    "/api/admin/orders",
    "/api/admin/content/site",
    "/api/admin/content/posts",
    "/api/admin/content/pages",
    "/api/admin/collections",
  ];
  for (const path of adminApis) {
    const { res } = await api(path);
    if (res.ok) pass(`Admin API ${path}`);
    else fail(`Admin API ${path}`, String(res.status));
  }

  const siteBefore = await api("/api/admin/content/site");
  if (!siteBefore.res.ok) {
    fail("Read CMS for patch test");
    summarize();
    process.exit(1);
  }

  const announcement = { ...siteBefore.json.announcement, text: MARKER };
  const patched = await api("/api/admin/content/site", {
    method: "PATCH",
    body: JSON.stringify({ announcement }),
  });
  if (patched.res.ok) pass("CMS PATCH announcement");
  else fail("CMS PATCH announcement", patched.json?.error);

  const publicSite = await api("/api/content/site");
  if (publicSite.json?.announcement?.text === MARKER) pass("Public CMS reflects patch");
  else fail("Public CMS reflects patch", `got "${publicSite.json?.announcement?.text?.slice(0, 40)}"`);

  const reverted = await api("/api/admin/content/site", {
    method: "PATCH",
    body: JSON.stringify({ announcement: siteBefore.json.announcement }),
  });
  if (reverted.res.ok) pass("CMS PATCH revert announcement");
  else fail("CMS PATCH revert announcement");

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), "smoke-test.png");

  const upload = await api("/api/admin/upload?slug=cms/smoke-test", {
    method: "POST",
    body: form,
  });
  if (upload.res.ok && upload.json?.urls?.[0]) {
    pass("CMS upload", upload.json.urls[0]);
    const uploadedUrl = upload.json.urls[0];
    const imgRes = await fetch(`${BASE}${uploadedUrl}`);
    if (imgRes.ok) pass("Uploaded file served publicly", String(imgRes.status));
    else fail("Uploaded file served publicly", String(imgRes.status));
  } else {
    fail("CMS upload", upload.json?.error || String(upload.res.status));
  }

  summarize();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

function summarize() {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n--- ${results.length - failed.length}/${results.length} passed ---`);
  if (failed.length) {
    console.log("Failed:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
