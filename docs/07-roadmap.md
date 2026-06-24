# Roadmap

**Strategy:** full Shopify exit · Postgres as single source of truth · Stripe · France/Bali inventory

---

## S1 — Postgres catalog foundations ✅

| Deliverable | Status |
|-------------|--------|
| Postgres schema (products, variants, inventory) | ✅ |
| Migrate `data/catalog.json` + Shopify variants | ✅ |
| `GET /api/catalog` from Postgres | ✅ |
| Enriched front types | ✅ |
| `/docs` documentation | ✅ |

**Validation:** [sprint-s1-validation.md](./sprint-s1-validation.md)

---

## S2 — France / Bali inventory ✅

| Deliverable | Status |
|-------------|--------|
| Admin `/admin/inventory` (read + write) | ✅ |
| `PATCH /api/admin/inventory` | ✅ |
| `inventory_movements` on every adjustment | ✅ |
| Country → warehouse allocation rules | ✅ |
| Cart / checkout validation per warehouse | ✅ |
| Low-stock alerts on admin dashboard | ✅ |

**Definition of done:** ops can manage Paris and Bali without SQL.

---

## S3 — Orders + Stripe ✅

| Deliverable | Status |
|-------------|--------|
| `orders`, `order_items` tables (`002_orders.sql`) | ✅ |
| Stripe webhook → Postgres (idempotent via `stripe_event_id`) | ✅ |
| Admin `/admin/orders` list + detail | ✅ |
| Stock decrement + `inventory_movements` (`sale`) | ✅ |
| `shipping_country_code` + `fulfillment_warehouse` on order | ✅ |
| Dev server port **8080** | ✅ |
| Checkout test validated (Stripe test keys + CLI webhook) | ✅ |
| Per-variant cart lines (size selection) | ✅ |
| Admin product multi-size variants | ✅ |

**Validation:** [sprint-s3-validation.md](./sprint-s3-validation.md) · [sprint-s3-test-checkout.md](./sprint-s3-test-checkout.md)

---

## Admin catalog (Postgres) ✅

| Deliverable | Status |
|-------------|--------|
| `POST /api/admin/products` → Postgres | ✅ |
| `PUT /api/admin/products/:slug` → Postgres | ✅ |
| `DELETE /api/admin/products/:slug` → Postgres | ✅ |
| Multi-size variants on create/edit | ✅ |
| JSON fallback when no `DATABASE_URL` | ✅ |

---

## S4 — Emails & ops experience ✅

| Deliverable | Status |
|-------------|--------|
| Order confirmation email (on payment) | ✅ |
| Shipped email (admin action) | ✅ |
| Contact form → email | ✅ |
| Order CSV export | ✅ |
| Resend transactional emails | ✅ |
| Newsletter Brevo (`NEWSLETTER_PROVIDER=brevo`) | ✅ |

**Setup:** [sprint-s4-emails.md](./sprint-s4-emails.md)

---

## S7 — Admin analytics & multi-channel ✅

| Deliverable | Status |
|-------------|--------|
| Dashboard charts (sales, channels, countries, stock) | ✅ |
| World map — orders by shipping country | ✅ |
| `GET /api/admin/analytics` | ✅ |
| Admin `/admin/newsletter` (settings + subscribers) | ✅ |
| Public newsletter copy via `/api/newsletter/copy` | ✅ |
| Multi-channel orders (`website`, `wolf_badger`, `other`) | ✅ |
| Manual marketplace order entry (W&B) | ✅ |
| Migration `004_admin_analytics_multichannel.sql` | ✅ |

---

## S5 — Deployment & cutover 🚧

| Deliverable | Status |
|-------------|--------|
| API on Cloudflare Worker (`src/routes/api/$.ts`) | ✅ |
| Shared `server/api-router.mjs` (dev + prod) | ✅ |
| `npm run deploy` / `preview:cf` | ✅ |
| R2 uploads (optional binding) | ✅ |
| Staging on `*.workers.dev` | ✅ |
| DNS `bingindiaries.com` | ⏳ manual (go-live only) |
| Stripe production webhook | ⏳ manual |
| SEO 301 Shopify → new site | ⏳ manual |

**Guide:** [sprint-s5-deployment.md](./sprint-s5-deployment.md)

---

## S8 — Premium design & editorial CMS ✅

| Deliverable | Status |
|-------------|--------|
| White theme + minimal product cards | ✅ |
| Homepage: hero → photo strip → products → Instagram | ✅ |
| Hero poster + optional video (graceful fallback) | ✅ |
| Home photo strip CMS (3 portrait tiles, full bleed) | ✅ |
| Instagram grid full-bleed (`gap-0`) | ✅ |
| Collection scoped sub-filters (`?c=`) | ✅ |
| Mi Paradisio catalog sync (13 products) | ✅ |
| About page + Find us (Atlist + stockists) | ✅ |
| CMS: `/admin/content`, `/about`, `/find-us` | ✅ |
| CMS media upload (hero, photo strip, About sidebar) | ✅ |
| Staging deploy `*.workers.dev` | ✅ |

**Guide:** [08-content-cms-and-design.md](./08-content-cms-and-design.md)

---

## S6 — Customer accounts ✅

| Deliverable | Status |
|-------------|--------|
| Magic link auth (email) | ✅ |
| Order history on `/account` | ✅ |
| Wishlist sync (local ↔ server on login + heart toggle) | ✅ |
| Wishlist share link | ✅ |
| Admin `/admin/customers` (wishlists + order count) | ✅ |
| Export CSV + Brevo (semicolon, custom attributes) | ✅ |
| Header wishlist counter | ✅ |
| Resend emails (production magic links) | ⏳ `RESEND_API_KEY` |

---

## Known technical debt

| Item | Target sprint |
|------|----------------|
| Admin product CRUD → Postgres | ✅ |
| Per-variant cart + checkout | ✅ |
| Orders in `orders.json` (fallback without DATABASE_URL) | JSON legacy |
| `/api/*` only in Vite middleware | ✅ (shared api-router on Worker) |
| No Stripe Tax / auto VAT | S4+ |
| Production Stripe webhook (Dashboard, not CLI) | S5 |

---

## Keeping this document current

At the end of each sprint: check off deliverables, add the date, link to PR or commit if useful.
