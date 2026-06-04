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

**Follow-up (S3):** per-variant cart lines, Stripe webhook stock decrement in Postgres.

---

## S3 — Orders + Stripe production

- `orders`, `order_items` tables
- Stripe webhook → Postgres (idempotent)
- Order admin (list, detail, statuses)
- Stock decrement on correct variant / warehouse
- Admin catalog CRUD → Postgres (end JSON writes)

---

## S4 — Emails & ops experience

- Order confirmation, shipped
- Contact form → email
- Newsletter Brevo/Resend in prod
- Order CSV export

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
| Admin product writes → 503 when Postgres active | S2/S3 |
| Orders in `orders.json` | S3 |
| `/api/*` only in Vite middleware | S5 |
| Checkout stock = product total, not variant/warehouse | S2 |
| No Stripe Tax / auto VAT | S4+ |

---

## Keeping this document current

At the end of each sprint: check off deliverables, add the date, link to PR or commit if useful.
