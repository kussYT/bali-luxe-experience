# Vision

**Project:** Bingin Diaries e-commerce site (full replacement of bingindiaries.com on Shopify)  
**Stack:** TanStack Start, React 19, Vite, Tailwind v4, Cloudflare Workers  
**Business source of truth:** PostgreSQL (catalog, variants, inventory) — **full Shopify exit**

---

## Goals

1. **Premium storefront** — lifestyle experience (lookbook, journal, sounds, live Instagram)
2. **Standalone shop** — catalog, inventory, orders, payments without Shopify admin
3. **Dual-site inventory** — **France** (Paris) and **Bali** (Indonesia) warehouses
4. **Payments** — Stripe Checkout (replaces Shopify Payments)
5. **Proprietary back office** — product, inventory, and order admin (roadmap)

---

## Out of scope (current)

- Runtime connection to Shopify (Storefront API, Shopify checkout)
- Full customer accounts (UI exists; auth coming later)
- Advanced automated VAT (Stripe Tax optional later)

---

## Technical principles

| Principle | Application |
|-----------|-------------|
| Postgres = truth | Catalog read via `/api/catalog` from the DB |
| Server-only secrets | `DATABASE_URL`, `STRIPE_*`, admin keys — never in `VITE_*` |
| Unified API | `server/api/catalog.mjs` + Vite middleware in dev |
| Versioned migrations | `db/migrations/*.sql` |
| Same storefront UX | Enriched types (`variants`, `stockFrance`, `stockBali`) |

---

## Milestones

| Milestone | Status |
|-----------|--------|
| S1 — Postgres schema + catalog API | ✅ Shipped (validate) |
| S2 — France/Bali inventory admin + allocation | 🔜 |
| S3 — Orders + Stripe production | 🔜 |
| S4 — Emails + production deploy | 🔜 |

See [07-roadmap.md](./07-roadmap.md).
