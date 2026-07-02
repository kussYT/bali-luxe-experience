-- Promo codes: scope (collections, products), min cart, start date

ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS rules JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE promo_codes
SET rules = '{"scope":"all","collectionSlugs":[],"productSlugs":[],"minSubtotalEur":null,"startsAt":null}'::jsonb
WHERE rules = '{}'::jsonb OR rules IS NULL;
