# PostgreSQL — Bingin Diaries

Full documentation: [`/docs`](../docs/README.md) · S1 validation: [`docs/sprint-s1-validation.md`](../docs/sprint-s1-validation.md)

## Setup

1. Create a database (local Docker, Neon, Supabase, etc.)
2. Add to `.env.local`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/bingin_diaries
```

3. Run:

```bash
npm run db:setup
```

This applies migrations and imports the catalog from `data/catalog.json` + Shopify variants.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Apply SQL migrations |
| `npm run db:seed-catalog` | Import / upsert catalog |
| `npm run db:seed-catalog -- --reset` | Truncate catalog tables then re-import |
| `npm run db:setup` | migrate + seed |

## Schema (Sprint S1)

- `warehouses` — `france`, `bali`
- `collections`
- `products`
- `product_images`
- `product_variants`
- `product_inventory` — quantity per variant × warehouse
- `inventory_movements` — audit (S2)

## API

`GET /api/catalog` reads from Postgres when `DATABASE_URL` is set.

Response includes `source: "postgres"` and per-product:

- `variants[]` with `inventory: { france, bali }`
- `stockFrance`, `stockBali`, `stock` (totals)
