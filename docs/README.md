# Bingin Diaries — Technical documentation

Living documentation so a developer can pick up the project without verbal handover.

**Last updated:** June 2026 · **Current focus:** Premium design + CMS on Cloudflare staging → go-live

---

## Index

| Document | Contents |
|----------|----------|
| [01-vision.md](./01-vision.md) | Product goals, Shopify exit, scope |
| [02-architecture.md](./02-architecture.md) | Stack, flows, folders, API |
| [03-database.md](./03-database.md) | Postgres schema, tables, examples, queries |
| [04-stock-france-bali.md](./04-stock-france-bali.md) | Multi-warehouse model |
| [05-stripe.md](./05-stripe.md) | Payments, webhooks, env vars |
| [06-deployment.md](./06-deployment.md) | Cloudflare, Postgres, secrets |
| [07-roadmap.md](./07-roadmap.md) | Sprints, priorities, definition of done |
| [08-content-cms-and-design.md](./08-content-cms-and-design.md) | **Homepage design, CMS admin, Beatrice workflow, uploads** |
| [instagram-automation.md](./instagram-automation.md) | Instagram sync (GitHub Actions) |
| [sprint-s5-deployment.md](./sprint-s5-deployment.md) | **Deploy guide (staging + prod)** |
| [sprint-s4-emails.md](./sprint-s4-emails.md) | Resend, Brevo, transactional email |
| [sprint-s3-validation.md](./sprint-s3-validation.md) | Checkout validation |
| [sprint-s1-validation.md](./sprint-s1-validation.md) | S1 catalog validation |

---

## Quick start (developer)

```bash
git clone <repo>
cd bali-luxe-experience
npm install
cp .env.example .env.local
# Set DATABASE_URL, STRIPE_*, ADMIN_*, SITE_URL=http://localhost:8080
npm run db:migrate
npm run db:seed-catalog   # once if empty
npm run dev
```

- Site: http://localhost:8080  
- Catalog API: http://localhost:8080/api/catalog  
- Admin: http://localhost:8080/admin  

---

## Update conventions

When a sprint ships or architecture changes:

1. Update the relevant file under `/docs`
2. Update [07-roadmap.md](./07-roadmap.md)
3. Update the root [README.md](../README.md) status table if needed
