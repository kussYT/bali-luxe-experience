-- Sprint S4 — shipped status + timestamps

DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE 'shipped';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
