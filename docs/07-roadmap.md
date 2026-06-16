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

## S4 — Emails & ops experience 🚧

| Deliverable | Status |
|-------------|--------|
| Order confirmation email (on payment) | ✅ |
| Shipped email (admin action) | ✅ |
| Contact form → email (`POST /api/contact`) | ✅ |
| Order CSV export (`/api/admin/orders/export.csv`) | ✅ |
| `shipped` order status + `shipped_at` (`003_order_shipped.sql`) | ✅ |
| Newsletter Brevo in prod (`NEWSLETTER_PROVIDER=brevo`) | ✅ (existing) |
| Resend transactional emails (`RESEND_API_KEY`) | ✅ |

**Setup:** [sprint-s4-emails.md](./sprint-s4-emails.md)

---

## S5 — Deployment & cutover

- API on Cloudflare Worker
- DNS `bingindiaries.com`
- SEO 301 Shopify → new site
- Webhook / error monitoring

---

## S6 — Customer accounts (optional)

- Email auth
- Order history
- Persisted wishlist

---

## Known technical debt

| Item | Target sprint |
|------|----------------|
| Admin product CRUD → Postgres | ✅ |
| Per-variant cart + checkout | ✅ |
| Orders in `orders.json` (fallback without DATABASE_URL) | JSON legacy |
| `/api/*` only in Vite middleware | S5 |
| No Stripe Tax / auto VAT | S4+ |
| Production Stripe webhook (Dashboard, not CLI) | S5 |

---

## Keeping this document current

At the end of each sprint: check off deliverables, add the date, link to PR or commit if useful.
