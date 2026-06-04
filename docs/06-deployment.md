# Deployment

## Target

- **Front + SSR:** Cloudflare Workers (`wrangler.jsonc`)
- **Database:** Managed PostgreSQL (recommended: [Neon](https://neon.tech), Supabase, or RDS)
- **Assets:** static files via Vite build → `dist/`

---

## Production prerequisites

| Service | Variable |
|---------|----------|
| Postgres | `DATABASE_URL` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Site | `SITE_URL` (checkout redirect URLs) |
| Admin | `ADMIN_PASSWORD`, `ADMIN_SECRET` |
| Instagram | `INSTAGRAM_ACCESS_TOKEN` (optional) |
| Newsletter | `NEWSLETTER_PROVIDER`, Brevo/Klaviyo keys (optional) |

Configure secrets in the Cloudflare dashboard (or local `.dev.vars`).

---

## Build

```bash
npm run build
```

Outputs:

- `dist/client/` — static assets
- `dist/server/` — Worker bundle

---

## API in production (important)

Today, `/api/*` routes are served by **`vite.admin-api.mjs`** in dev/preview only.

For production, **port the handlers** to the Cloudflare runtime (TanStack Start server routes or a dedicated Worker), reusing:

- `server/api/catalog.mjs`
- `server/db/*`
- `server/checkout.mjs`
- etc.

**Roadmap priority:** before production DNS cutover.

---

## Postgres

- Enable SSL (`?sslmode=require` depending on host)
- Pool: `server/db/pool.mjs` disables SSL verification outside localhost
- Migrations: run `npm run db:migrate` in CI or manually on prod DB before deploy
- Catalog seed: `npm run db:seed-catalog` (once, then via admin from S2+)

---

## Go-live checklist

- [ ] Production `DATABASE_URL` configured
- [ ] Migrations applied
- [ ] Catalog imported / verified
- [ ] Stripe live mode + public webhook endpoint
- [ ] `SITE_URL` = final domain
- [ ] Admin secrets rotated (not dev values)
- [ ] 301 redirects from Shopify URLs
- [ ] `public/lifestyle/`, images committed or on CDN

---

## Instagram sync (optional)

```bash
npm run instagram:sync
```

Commit or deploy `public/instagram-feed.json` if the live API is not available in prod.
