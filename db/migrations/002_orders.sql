-- Sprint S3 — orders in Postgres

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status order_status NOT NULL DEFAULT 'pending',
  currency CHAR(3) NOT NULL,
  country_code CHAR(2),
  shipping_country_code CHAR(2),
  fulfillment_warehouse warehouse_id,
  customer_email TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_event_id TEXT,
  amount_subtotal INT,
  amount_shipping INT,
  amount_total INT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_session
  ON orders (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_event
  ON orders (stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_title TEXT,
  qty INT NOT NULL CHECK (qty > 0),
  unit_price INT NOT NULL,
  warehouse_id warehouse_id NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
