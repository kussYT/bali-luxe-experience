-- S7 — admin analytics, newsletter settings, multi-channel orders

DO $$ BEGIN
  CREATE TYPE order_channel AS ENUM ('website', 'wolf_badger', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel order_channel NOT NULL DEFAULT 'website';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_ref TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders (channel);
CREATE INDEX IF NOT EXISTS idx_orders_external_ref ON orders (external_ref) WHERE external_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
