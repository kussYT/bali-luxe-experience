# Sprint S3 — Test checkout (localhost:8080)

## Prerequisites

`.env.local`:

```env
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from stripe listen
SITE_URL=http://localhost:8080
```

Apply migration:

```bash
npm run db:migrate
```

## 1. Start app + Stripe webhook

Terminal A:

```bash
npm run dev
```

Site: http://localhost:8080

Terminal B:

```bash
npm run stripe:webhook
```

Copy the `whsec_...` secret into `.env.local`, restart `npm run dev` if you just added it.

## 2. Test purchase

1. Add a product with stock ≥ 1 to the cart
2. Checkout with Stripe test card `4242 4242 4242 4242`
3. Use a shipping address (country is stored on the order)

## 3. Verify Postgres

```sql
SELECT id, status, country_code, shipping_country_code, fulfillment_warehouse, paid_at
FROM orders ORDER BY created_at DESC LIMIT 1;

SELECT product_slug, qty, warehouse_id FROM order_items
WHERE order_id = (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1);

SELECT * FROM inventory_movements WHERE reason = 'sale' ORDER BY created_at DESC LIMIT 5;
```

## 4. Verify admin

- http://localhost:8080/admin/orders — order appears as **paid**
- Open detail — shipping country, warehouse, line items

## 5. Verify API (optional)

```bash
curl -s "http://localhost:8080/api/checkout/session?session_id=cs_test_..." | jq '.order.status'
```

Expected: `"paid"`.
