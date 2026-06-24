# Sprint S5 — Cloudflare deployment

Deploy the full stack (SSR + `/api/*`) on Cloudflare Workers.

## Architecture

| Layer | Technology |
|-------|------------|
| Front + SSR | TanStack Start on Cloudflare Workers |
| API routes | `src/routes/api/$.ts` → `server/api-router.mjs` |
| Static assets | `dist/client/` via Wrangler assets |
| Database | Managed Postgres (Neon, Supabase, etc.) |
| Uploads (prod) | R2 bucket `UPLOADS` (optional) |

Local dev still uses Vite middleware (`vite.admin-api.mjs`) which calls the same `api-router`.

---

## Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com) + Workers enabled
2. **Postgres** in production with SSL (`?sslmode=require` on Neon)
3. Migrations applied on prod DB: `DATABASE_URL=... npm run db:migrate`
4. Catalog seeded or migrated: `DATABASE_URL=... npm run db:seed-catalog` (once)
5. **Stripe** live webhook → `https://bingindiaries.com/api/stripe/webhook`
6. **Resend** domain verified for `EMAIL_FROM`

---

## Staging first (recommended)

Deploy to the default `*.workers.dev` URL **before** attaching `bingindiaries.com`. The Shopify site stays live until DNS cutover.

**Current staging:** https://bingin-diaries.bingindiaries-d08.workers.dev  
_(Legacy URL `bingin-diaries.bingindiaries.workers.dev` — old account, no R2 uploads.)_  
**CMS / design guide:** [08-content-cms-and-design.md](./08-content-cms-and-design.md)

1. `npx wrangler login`
2. Set secrets (see below) with `SITE_URL` = your `workers.dev` URL after first deploy
3. `npm run deploy`
4. Stripe **test** webhook → `https://bingin-diaries.<account>.workers.dev/api/stripe/webhook`
5. Validate admin, checkout, emails on staging
6. Only then attach custom domain for go-live

Optional: add `staging.bingindiaries.com` in Cloudflare without changing root DNS.

---

## First deploy

```bash
npm install
npm run build
npx wrangler login
npm run deploy:secrets   # lists secret put commands
# Paste each value when prompted:
npx wrangler secret put DATABASE_URL
npx wrangler secret put ADMIN_PASSWORD
# ... etc.
npm run deploy
```

Wrangler deploys `dist/server` as the Worker and serves `dist/client` as static assets.

---

## Environment variables (secrets)

| Secret | Required | Notes |
|--------|----------|-------|
| `DATABASE_URL` | Yes | Neon/Supabase connection string |
| `ADMIN_PASSWORD` | Yes | Rotate from dev |
| `ADMIN_SECRET` | Yes | Long random string for session HMAC |
| `STRIPE_SECRET_KEY` | Yes | Live `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes | From Stripe Dashboard webhook |
| `SITE_URL` | Yes | `https://bingindiaries.com` |
| `RESEND_API_KEY` | Yes | Transactional emails |
| `EMAIL_FROM` | Yes | Verified sender in Resend |
| `EMAIL_OPS` | Yes | Contact form inbox |
| `NEWSLETTER_PROVIDER` | Optional | `brevo` + `BREVO_*` |
| `INSTAGRAM_*` | Optional | Live feed |

---

## Custom domain

1. Cloudflare Dashboard → Workers → `bingin-diaries` → Settings → Domains
2. Add `bingindiaries.com` and `www.bingindiaries.com`
3. Set `SITE_URL=https://bingindiaries.com`
4. Update Stripe webhook URL to production

---

## R2 image uploads (admin)

**Required for CMS media upload on staging/production.** Cloudflare Workers have no filesystem — uploads go to R2.

### 1. Enable R2 (one-time, Cloudflare Dashboard)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage**
2. Click **Purchase R2** / enable R2 (free tier covers CMS usage)

### 2. Create bucket + bind Worker

```bash
npx wrangler r2 bucket create bingin-diaries-uploads
```

Ensure `wrangler.jsonc` targets the **Bingindiaries@gmail.com** account:

```jsonc
"account_id": "d089bcfdcc69ca589716cc8f4b9971a0",
"workers_dev": true,
"r2_buckets": [{ "binding": "UPLOADS", "bucket_name": "bingin-diaries-uploads" }]
```

**One-time:** register the `workers.dev` subdomain on that account (Wrangler will prompt, or open [Workers onboarding](https://dash.cloudflare.com/d089bcfdcc69ca589716cc8f4b9971a0/workers/onboarding)). Without this step, deploy uploads the Worker but does not publish the new version with R2.

```bash
npm run deploy
```

Images are served at `/uploads/cms/...` or `/uploads/products/...` via `src/routes/uploads/$.ts`.

**Without R2:** admin upload returns `503` — Beatrice can paste an external image URL manually until R2 is enabled.

**Local dev:** uploads save to `public/uploads/` (no R2 needed).

---

## Stripe webhook (production)

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://bingindiaries.com/api/stripe/webhook`
3. Events: `checkout.session.completed`
4. Copy signing secret → `wrangler secret put STRIPE_WEBHOOK_SECRET`

---

## Test locally as Worker

```bash
npm run preview:cf
```

Uses `.dev.vars` for local secrets (copy from `.env.local`, never commit).

---

## Go-live checklist

- [ ] Prod `DATABASE_URL` + migrations
- [ ] All Wrangler secrets set
- [ ] `SITE_URL` = production domain
- [ ] Stripe live webhook configured
- [ ] Resend domain verified
- [ ] Custom domain on Worker
- [ ] Test checkout end-to-end on production
- [ ] 301 redirects from Shopify (DNS cutover)
- [ ] Admin password rotated

---

## DNS cutover (Shopify → Cloudflare)

1. Point `bingindiaries.com` DNS to Cloudflare
2. Attach domain to Worker (above)
3. Configure 301 redirects for old Shopify URLs (`/products/*` → `/product/*`, etc.)
4. Keep Shopify checkout disabled once validated
