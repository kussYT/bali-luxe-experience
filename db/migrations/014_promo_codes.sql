CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'free')),
  discount_value INT NOT NULL DEFAULT 0,
  free_shipping BOOLEAN NOT NULL DEFAULT false,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  influencer_name TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_codes_code_lower ON promo_codes (LOWER(code));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
