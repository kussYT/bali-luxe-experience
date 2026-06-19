# Deployment

## Target

- **Front + SSR + API:** Cloudflare Workers (`wrangler.jsonc`)
- **Database:** Managed PostgreSQL (Neon, Supabase, or RDS)
- **Assets:** Vite build → `dist/client/`
- **Admin uploads (prod):** Cloudflare R2 (`UPLOADS` binding)

**Full guide:** [sprint-s5-deployment.md](./sprint-s5-deployment.md)

---

## Quick commands

```bash
npm run build          # dist/client + dist/server
npm run preview:cf     # local Worker preview
npm run deploy         # deploy to Cloudflare
npm run deploy:secrets # list wrangler secret put commands
```

---

## API in production

All `/api/*` routes are handled by TanStack Start server route `src/routes/api/$.ts`, which delegates to `server/api-router.mjs` (same logic as local dev).

---

## Production prerequisites

| Service | Variable |
|---------|----------|
| Postgres | `DATABASE_URL` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Site | `SITE_URL` |
| Admin | `ADMIN_PASSWORD`, `ADMIN_SECRET` |
| Email | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_OPS` (contact form inbox) |
| Atlist (Find us map) | Bundled by default — override with `VITE_ATLIST_EMBED_URL` if needed |
| Newsletter | `NEWSLETTER_PROVIDER`, Brevo keys (optional) |
| Instagram | `INSTAGRAM_ACCESS_TOKEN` (optional) — [automation](./instagram-automation.md) |

Configure via `wrangler secret put <NAME>`.

---

## Postgres

- Enable SSL (`?sslmode=require` on Neon)
- Run `npm run db:migrate` against prod before deploy
- Catalog: `npm run db:seed-catalog` once, then manage via admin

---

## Go-live checklist

See [sprint-s5-deployment.md](./sprint-s5-deployment.md) for the full checklist (domain, Stripe webhook, R2, DNS cutover).
