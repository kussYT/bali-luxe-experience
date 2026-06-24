# Bingin Diaries

E-commerce storefront and proprietary back office — full replacement of the Shopify site.

**Stack:** TanStack Start · React 19 · PostgreSQL · Stripe · Cloudflare Workers

**Status (June 2026):** S1–S4 ✅ · S7 admin ✅ · **Premium design + CMS** ✅ · **Staging** https://bingin-diaries.bingindiaries-d08.workers.dev · Go-live DNS ⏳

---

## What's live in code

| Area | Status |
|------|--------|
| Catalog + variants (Postgres) | ✅ |
| France / Bali inventory admin | ✅ |
| Stripe checkout + webhooks | ✅ |
| Admin products, orders, inventory | ✅ |
| Emails (Resend) + newsletter (Brevo) | ✅ |
| Dashboard graphiques + carte commandes | ✅ |
| Commandes multi-canal (Wolf & Badger) | ✅ |
| Premium white design + homepage CMS | ✅ |
| About / Find us CMS + media upload | ✅ |
| Deploy Cloudflare Workers (staging) | ✅ |
| DNS `bingindiaries.com` (go-live) | ⏳ |

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local
# Renseigner DATABASE_URL, ADMIN_*, STRIPE_* (test), SITE_URL=http://localhost:8080
npm run db:migrate
npm run db:seed-catalog   # une fois, si catalogue vide
npm run dev
```

| URL | Description |
|-----|-------------|
| http://localhost:8080 | Site public |
| http://localhost:8080/admin | Back office |
| http://localhost:8080/api/catalog | API catalogue |

**Stripe webhook local** (terminal séparé) :

```bash
npm run stripe:webhook
```

---

## Deploy staging Cloudflare (sans toucher bingindiaries.com)

Le site Shopify reste en ligne tant que le domaine principal n'est pas basculé.

```bash
npx wrangler login
npm run build
npm run deploy:secrets   # liste les secrets à configurer
# Pour chaque secret :
npx wrangler secret put DATABASE_URL
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SECRET
npx wrangler secret put STRIPE_SECRET_KEY      # sk_test_... pour staging
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put SITE_URL               # URL workers.dev du deploy
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
npx wrangler secret put EMAIL_OPS
npm run deploy
```

Après deploy, Wrangler affiche une URL du type `https://bingin-diaries.<compte>.workers.dev` — utilise-la pour :

- `SITE_URL` (secret)
- Webhook Stripe **test** → `https://…workers.dev/api/stripe/webhook`
- Tests admin + checkout

**Guide complet :** [docs/sprint-s5-deployment.md](docs/sprint-s5-deployment.md)

---

## Documentation

| Doc | Contenu |
|-----|---------|
| [docs/README.md](docs/README.md) | Index technique |
| [docs/08-content-cms-and-design.md](docs/08-content-cms-and-design.md) | **Design, CMS, Beatrice, uploads** |
| [docs/07-roadmap.md](docs/07-roadmap.md) | Sprints et priorités |
| [docs/sprint-s5-deployment.md](docs/sprint-s5-deployment.md) | Cloudflare, secrets, go-live |
| [docs/instagram-automation.md](docs/instagram-automation.md) | Instagram hebdo (GitHub Actions) |
| [docs/05-stripe.md](docs/05-stripe.md) | Paiements |
| [docs/sprint-s4-emails.md](docs/sprint-s4-emails.md) | Resend + Brevo |

---

## Scripts utiles

```bash
npm run dev              # dev local (port 8080)
npm run build            # build client + worker
npm run preview:cf       # preview Worker local
npm run deploy           # deploy Cloudflare
npm run catalog:import   # Shopify images + catalog.json
npm run db:seed-catalog  # Postgres catalog sync
npm run instagram:sync   # refresh static Instagram cache
npm run db:migrate       # migrations Postgres
npm run deploy:secrets   # liste wrangler secret put
```
