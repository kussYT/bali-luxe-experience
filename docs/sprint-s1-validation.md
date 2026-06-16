# Sprint S1 validation — Before S2 (inventory)

Use this document as a **checklist** to confirm Postgres is ready before the France/Bali inventory admin.

---

## 1. Final Postgres schema

Source file: `db/migrations/001_initial_schema.sql`

### ENUM types

```sql
warehouse_id   → 'france' | 'bali'
product_status → 'draft' | 'published'
product_origin → 'Bali' | 'France'
```

### Table diagram

```
warehouses (2 seed rows)
    ↑
product_inventory ←── product_variants ←── products ──→ collections
    ↑                        ↑
inventory_movements    product_images
```

---

## 2. Tables created

| # | Table | Expected rows after setup |
|---|-------|-------------------------|
| 1 | `schema_migrations` | ≥ 1 |
| 2 | `warehouses` | 2 (`france`, `bali`) |
| 3 | `collections` | ~9 |
| 4 | `products` | ~53 |
| 5 | `product_images` | ≥ number of images |
| 6 | `product_variants` | ≥ 53 (1+ per product) |
| 7 | `product_inventory` | variants × 2 warehouses |
| 8 | `inventory_movements` | 0 (normal in S1) |

### SQL verification

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

---

## 3. Example product with variants

### A. Via API (recommended)

```bash
npm run dev
curl -s http://localhost:5173/api/catalog | jq '.source, .productCount'
curl -s http://localhost:5173/api/catalog | jq '.products[] | select(.slug=="90s-fisherman-black") | {slug, stock, stockFrance, stockBali, variants}'
```

**Success when:**

- `"source": "postgres"`
- `productCount` ≥ 50
- `variants` is a non-empty array
- each variant has `inventory.france` and `inventory.bali`

### B. Via SQL

```sql
SELECT p.slug, p.name, v.slug AS variant_slug, v.title, v.is_default
FROM products p
JOIN product_variants v ON v.product_id = p.id
WHERE p.slug = '90s-fisherman-black';
```

---

## 4. France / Bali stock example

### SQL — detail per warehouse

```sql
SELECT
  p.slug,
  v.title AS variant,
  i.warehouse_id,
  i.quantity,
  i.reserved,
  (i.quantity - i.reserved) AS available
FROM products p
JOIN product_variants v ON v.product_id = p.id
JOIN product_inventory i ON i.variant_id = v.id
WHERE p.slug = '90s-fisherman-black'
ORDER BY i.warehouse_id;
```

**Typical S1 result** (product with `origin = Bali`):

| warehouse_id | quantity | reserved | available |
|--------------|----------|----------|-----------|
| bali | 1 | 0 | 1 |
| france | 0 | 0 | 0 |

### SQL — global totals

```sql
SELECT
  warehouse_id,
  SUM(quantity) AS total,
  SUM(reserved) AS reserved,
  SUM(quantity - reserved) AS available
FROM product_inventory
GROUP BY warehouse_id;
```

### API JSON (aggregated fields)

```json
{
  "stock": 1,
  "stockFrance": 0,
  "stockBali": 1,
  "variants": [
    {
      "inventory": { "france": 0, "bali": 1 },
      "available": true
    }
  ]
}
```

---

## 5. API routes (catalog & S1-related)

### Catalog (S1 — Postgres)

| Method | Route | Data source | Notes |
|--------|-------|-------------|-------|
| `GET` | `/api/catalog` | **Postgres** if `DATABASE_URL` | `?all=1` includes drafts |
| `GET` | `/api/admin/catalog` | **Postgres** | Admin, auth required |

Handler: `server/api/catalog.mjs` → `server/db/catalog.mjs`

### Other routes (existing; S1 catalog write not via admin)

| Method | Route | Role |
|--------|-------|------|
| `POST` | `/api/checkout/session` | Stripe |
| `GET` | `/api/checkout/session` | Payment status |
| `POST` | `/api/stripe/webhook` | Stripe webhook |
| `GET` | `/api/instagram` | Instagram feed |
| `POST` | `/api/newsletter` | Newsletter signup |
| `GET/POST` | `/api/admin/*` | Admin (product JSON write **disabled** when Postgres active) |

---

## Automated validation

After `DATABASE_URL` is set and `npm run db:setup` has run:

```bash
npm run db:validate-s1
```

Exits `0` only when all 8 criteria pass (prints GO/NO-GO per criterion).

---

## 6. Commands to test

### Prerequisites

```bash
# .env.local
DATABASE_URL=postgresql://USER:PASS@HOST:5432/bingin_diaries
```

### Schema + data setup

```bash
npm run db:migrate
npm run db:seed-catalog
# or
npm run db:setup
```

### **Read** tests

```bash
# 1. Catalog API
npm run dev
curl -s http://localhost:5173/api/catalog | jq '{source, productCount, firstProduct: .products[0].slug}'

# 2. Product with variants + stock
curl -s http://localhost:5173/api/catalog | jq '.products[] | select(.slug=="90s-fisherman-black")'

# 3. Front loads catalog
# Open http://localhost:5173/collection — products should render

# 4. Direct SQL (psql, TablePlus, etc.)
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM products;"
psql "$DATABASE_URL" -c "SELECT warehouse_id, SUM(quantity) FROM product_inventory GROUP BY 1;"
```

### **Write** tests

| Action | S1 | How to test |
|--------|-----|-------------|
| Import / upsert catalog | ✅ | `npm run db:seed-catalog` |
| Full re-import | ✅ | `npm run db:seed-catalog -- --reset` |
| Admin UI create product | ❌ 503 | Deferred S2/S3 — explicit message |
| Manual stock adjustment | ✅ SQL | See below |

#### Manual stock write (validation before S2)

```sql
-- 1. Get variant ID
SELECT v.id FROM product_variants v
JOIN products p ON p.id = v.product_id
WHERE p.slug = '90s-fisherman-black' AND v.is_default = true;

-- 2. Set 3 units in Paris (replace UUID)
UPDATE product_inventory
SET quantity = 3, updated_at = now()
WHERE variant_id = 'VARIANT_UUID_HERE' AND warehouse_id = 'france';

-- 3. Verify via API
-- curl ... | jq '.products[] | select(.slug=="90s-fisherman-black") | .stockFrance'
-- should show 3 (if bali unchanged, stock = 3 + bali stock)
```

#### Audit movement test (table ready for S2)

```sql
INSERT INTO inventory_movements (variant_id, warehouse_id, delta, reason, note)
VALUES ('VARIANT_UUID_HERE', 'france', 3, 'adjustment', 'S1 validation test');
```

---

## 7. GO / NO-GO criteria for S2

| # | Criterion | GO |
|---|-----------|-----|
| 1 | `DATABASE_URL` set and migrations OK | ☐ |
| 2 | `npm run db:seed-catalog` completes without error | ☐ |
| 3 | `GET /api/catalog` → `"source": "postgres"` | ☐ |
| 4 | All published products have ≥ 1 variant | ☐ |
| 5 | Each variant has 2 inventory rows (`france` + `bali`) | ☐ |
| 6 | `stockFrance` / `stockBali` match SQL | ☐ |
| 7 | `/collection` shows products from the DB | ☐ |
| 8 | SQL stock write tested and visible in the API | ☐ |

**When all 8 boxes are checked → database is ready for Sprint S2.**

---

## 8. Known issues (not S1 blockers)

- **Admin product CRUD** returns 503 while Postgres is active — expected; S2/S3 will migrate writes.
- **Checkout** still uses aggregated product stock, not warehouse — fixed in S2.
- **Orders** in `data/orders.json`, not Postgres — S3.
- **`inventory_movements`** empty until S2 adjustments.

---

## 9. Reference files

| File | Role |
|------|------|
| `db/migrations/001_initial_schema.sql` | Schema |
| `server/db/catalog.mjs` | API reads |
| `scripts/migrate-catalog-to-postgres.mjs` | Import |
| `src/lib/catalog-types.ts` | TS types |

See also [03-database.md](./03-database.md) and [04-stock-france-bali.md](./04-stock-france-bali.md).
