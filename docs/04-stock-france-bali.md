# France / Bali inventory

## Model (S1)

Stock is **not** a single `products.stock` field. It lives at the finest grain:

```
variant × warehouse → product_inventory.quantity
```

| Warehouse `id` | Display name | Country |
|----------------|--------------|---------|
| `france` | Paris — France | FR |
| `bali` | Bali — Indonesia | ID |

Aggregated fields exposed in the API (computed on read):

- `variants[].inventory.france` / `.bali`
- `products.stockFrance`, `products.stockBali`, `products.stock`

---

## S1 rules (import)

When running `npm run db:seed-catalog`:

1. Each Shopify product → 1+ rows in `product_variants`
2. If no Shopify variant → a `Default` variant is created
3. Initial stock = Shopify `inventory_quantity` or `catalog.json` `stock`
4. Stock is placed in `default_warehouse` derived from `origin`:
   - `France` → `france` warehouse
   - `Bali` → `bali` warehouse
5. The other warehouse gets `quantity = 0`

---

## S2 rules (to implement)

| Feature | Description |
|---------|-------------|
| Admin `/admin/inventory` | Product × variant × France/Bali grid |
| Manual adjustment | INSERT `inventory_movements` + UPDATE `product_inventory` |
| Checkout allocation | Customer country → preferred warehouse |
| Warehouse fallback | If France is out of stock, offer Bali (configurable) |
| Reservation | Increment `reserved` during Stripe session |
| Sale decrement | Stripe webhook → `sale` movement + lower `quantity` |

---

## Displayed availability (front)

The storefront still uses `product.stock` (total) for the cart.  
S2 will validate against the **fulfillment warehouse** and **selected variant**.

---

## Manual adjustment example (SQL write test)

```sql
-- Find a variant
SELECT v.id, v.slug, p.slug AS product
FROM product_variants v
JOIN products p ON p.id = v.product_id
WHERE p.slug = '90s-fisherman-black'
LIMIT 1;

-- Add 5 units in Paris (replace :variant_id)
UPDATE product_inventory
SET quantity = quantity + 5, updated_at = now()
WHERE variant_id = 'VARIANT_UUID' AND warehouse_id = 'france';

-- Audit trail (S2 will automate)
INSERT INTO inventory_movements (variant_id, warehouse_id, delta, reason, note)
VALUES ('VARIANT_UUID', 'france', 5, 'adjustment', 'Manual restock Paris');
```

---

## Links

- Schema: [03-database.md](./03-database.md)
- S1 validation: [sprint-s1-validation.md](./sprint-s1-validation.md)
