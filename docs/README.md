# Bingin Diaries — Technical documentation

Living documentation so a developer can pick up the project without verbal handover.

**Last updated:** June 2026 · **Current sprint:** S1 validated → S2 (inventory & orders)

---

## Index

| Document | Contents |
|----------|----------|
| [01-vision.md](./01-vision.md) | Product goals, Shopify exit, scope |
| [02-architecture.md](./02-architecture.md) | Stack, flows, folders, API |
| [03-database.md](./03-database.md) | Postgres schema, tables, examples, queries |
| [04-stock-france-bali.md](./04-stock-france-bali.md) | Multi-warehouse model, S1/S2 rules |
| [05-stripe.md](./05-stripe.md) | Payments, webhooks, env vars |
| [06-deployment.md](./06-deployment.md) | Cloudflare, Postgres, secrets |
| [07-roadmap.md](./07-roadmap.md) | Sprints, priorities, definition of done |
| [sprint-s1-validation.md](./sprint-s1-validation.md) | **S1 validation checklist** before S2 |

---

## Quick start (developer)

```bash
git clone <repo>
cd bali-luxe-experience
npm install
cp .env.example .env.local
# Set DATABASE_URL, STRIPE_*, ADMIN_*, etc.
npm run db:setup
npm run dev
```

- Site: http://localhost:5173  
- Catalog API: http://localhost:5173/api/catalog  
- Admin: http://localhost:5173/admin  

---

## Update conventions

When a sprint ships or architecture changes:

1. Update the relevant file under `/docs`
2. Add the date and sprint in the modified file header
3. Update [07-roadmap.md](./07-roadmap.md) and [sprint-s1-validation.md](./sprint-s1-validation.md) if applicable
