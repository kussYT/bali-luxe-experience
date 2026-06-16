# Sprint S3 — Validation checklist

**Status: GO** (validated June 2026)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | `DATABASE_URL` loaded | ✅ |
| 2 | Migrations applied | ✅ |
| 3 | Catalog from Postgres (`source: postgres`) | ✅ |
| 4 | Orders persisted on checkout | ✅ |
| 5 | Stripe webhook marks order `paid` | ✅ |
| 6 | Stock decremented per variant/warehouse | ✅ |
| 7 | Admin `/admin/orders` shows orders | ✅ |
| 8 | Per-variant cart lines (size selection) | ✅ |
| 9 | Admin multi-size product create/edit | ✅ |

**Test procedure:** [sprint-s3-test-checkout.md](./sprint-s3-test-checkout.md)

**Local requirements:**
- Stripe test keys in `.env.local`
- `npm run stripe:webhook` (CLI forwards to `localhost:8080`)
- Dev server on port **8080**
