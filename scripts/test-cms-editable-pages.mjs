/**
 * CMS editable pages — unit checks + optional live API roundtrip.
 * Usage:
 *   npm run test:cms-pages
 *   node scripts/test-cms-editable-pages.mjs [baseUrl]   # with admin session tests
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CMS_PAGE_SLUGS,
  SITE_CONTENT_PAGE_KEYS,
  DEFAULT_PAGES,
  DEFAULT_CONTACT,
  DEFAULT_CARE,
  DEFAULT_SIZING,
  DEFAULT_FOOTER,
  mergeContact,
  mergeCare,
  mergeSizing,
  mergeFooter,
} from "../server/content-defaults.mjs";
import { getPublicSiteContent } from "../server/db/cms-site.mjs";

const BASE = process.argv[2] || "";
const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`OK  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
}

function assert(condition, name, detail = "") {
  if (condition) pass(name, detail);
  else fail(name, detail);
}

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

async function runUnitTests() {
  console.log("\n--- Unit: CMS page slugs ---\n");

  assert(
    !CMS_PAGE_SLUGS.includes("about"),
    "No orphan about slug in CMS pages",
    CMS_PAGE_SLUGS.join(", "),
  );

  const expectedCmsSlugs = ["shipping", "returns", "faq", "terms"];
  for (const slug of expectedCmsSlugs) {
    assert(CMS_PAGE_SLUGS.includes(slug), `CMS page slug: ${slug}`);
  }
  assert(CMS_PAGE_SLUGS.length === expectedCmsSlugs.length, "CMS page count", String(CMS_PAGE_SLUGS.length));

  console.log("\n--- Unit: site content keys ---\n");

  const expectedSiteKeys = ["homepage", "about", "findUs", "contact", "care", "sizing", "footer"];
  for (const key of expectedSiteKeys) {
    assert(SITE_CONTENT_PAGE_KEYS.includes(key), `Site content key: ${key}`);
  }

  console.log("\n--- Unit: merge defaults ---\n");

  const contact = mergeContact(null);
  assert(contact.email === DEFAULT_CONTACT.email, "mergeContact email", contact.email);
  assert(contact.formSubmit === DEFAULT_CONTACT.formSubmit, "mergeContact formSubmit");

  const care = mergeCare({ intro: "Custom intro" });
  assert(care.intro === "Custom intro", "mergeCare patch");
  assert(care.sections.length >= 1, "mergeCare sections", String(care.sections.length));

  const sizing = mergeSizing(null);
  assert(Boolean(sizing.image), "mergeSizing image");
  assert(sizing.body.length >= 1, "mergeSizing body");

  const footer = mergeFooter(null);
  assert(footer.shopTitle === DEFAULT_FOOTER.shopTitle, "mergeFooter shopTitle");

  console.log("\n--- Unit: public site content (no DB) ---\n");

  const publicSite = await getPublicSiteContent();
  for (const key of ["contact", "care", "sizing", "footer", "about", "findUs"]) {
    assert(publicSite[key] != null, `getPublicSiteContent.${key} defined`);
  }
  assert(publicSite.contact.title === DEFAULT_CONTACT.title, "public contact title");
  assert(publicSite.care.sections.length > 0, "public care sections");
  assert(publicSite.sizing.image.length > 0, "public sizing image");

  console.log("\n--- Unit: DEFAULT_PAGES shape ---\n");

  for (const page of DEFAULT_PAGES) {
    assert(typeof page.slug === "string" && page.slug.length > 0, `page slug: ${page.slug}`);
    assert(Array.isArray(page.body), `page body array: ${page.slug}`);
  }
}

async function runLiveTests(baseUrl) {
  loadEnvLocal();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    fail("Live API tests", "ADMIN_PASSWORD missing — skip");
    return;
  }

  console.log(`\n--- Live API: ${baseUrl} ---\n`);

  let cookie = "";

  async function api(path, init = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
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
    return { res, json };
  }

  const login = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  if (!login.res.ok) {
    fail("Admin login for CMS tests", login.json?.error || String(login.res.status));
    return;
  }
  pass("Admin login for CMS tests");

  const adminSite = await api("/api/admin/content/site");
  if (!adminSite.res.ok) {
    fail("GET /api/admin/content/site", String(adminSite.res.status));
    return;
  }

  for (const key of ["contact", "care", "sizing", "footer"]) {
    assert(adminSite.json[key] != null, `Admin site content: ${key}`);
  }

  const marker = `__cms_test_${Date.now()}__`;
  const contactPatch = { ...adminSite.json.contact, title: marker };
  const patched = await api("/api/admin/content/site", {
    method: "PATCH",
    body: JSON.stringify({ contact: contactPatch }),
  });
  if (!patched.res.ok) {
    fail("PATCH contact", patched.json?.error || String(patched.res.status));
    return;
  }
  pass("PATCH contact title");

  const publicSite = await api("/api/content/site");
  if (publicSite.json?.contact?.title === marker) {
    pass("Public site reflects contact patch");
  } else {
    fail("Public site reflects contact patch", `got "${publicSite.json?.contact?.title}"`);
  }

  const reverted = await api("/api/admin/content/site", {
    method: "PATCH",
    body: JSON.stringify({ contact: adminSite.json.contact }),
  });
  if (reverted.res.ok) pass("PATCH contact revert");
  else fail("PATCH contact revert");

  const adminPages = await api("/api/admin/content/pages");
  if (adminPages.res.ok && Array.isArray(adminPages.json?.pages)) {
    const slugs = adminPages.json.pages.map((p) => p.slug);
    assert(!slugs.includes("about"), "Admin pages list has no about", slugs.join(", "));
    pass("Admin pages API", `${slugs.length} pages`);
  } else {
    fail("Admin pages API", String(adminPages.res.status));
  }

  const adminRoutes = [
    "/admin/content/contact",
    "/admin/content/care",
    "/admin/content/sizing",
    "/admin/content/footer",
  ];
  for (const path of adminRoutes) {
    const res = await fetch(`${baseUrl}${path}`);
    if (res.ok) pass(`Admin route ${path}`);
    else fail(`Admin route ${path}`, String(res.status));
  }
}

async function main() {
  console.log("CMS editable pages test\n");
  await runUnitTests();

  const base = BASE || process.env.CMS_TEST_BASE_URL || "";
  if (base) {
    await runLiveTests(base.replace(/\/$/, ""));
  } else {
    console.log("\n(Skip live API — pass base URL or set CMS_TEST_BASE_URL)\n");
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n--- ${results.length - failed.length}/${results.length} passed ---`);
  if (failed.length) {
    console.log("Failed:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
