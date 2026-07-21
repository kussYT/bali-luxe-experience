-- Promo code category for admin overview (newsletter, loyalty, friends, etc.)
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';
