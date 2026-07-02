-- Abandoned checkout recovery tracking (admin relance manuelle, lot A)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS recovery_email_sent_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recovery_email_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_abandoned
  ON orders (created_at DESC)
  WHERE status = 'pending' AND channel = 'website';
