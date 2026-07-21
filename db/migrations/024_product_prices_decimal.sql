-- Allow cent prices (e.g. 21,60 €) on products and variants.
ALTER TABLE products
  ALTER COLUMN price_eur TYPE NUMERIC(10, 2) USING price_eur::numeric,
  ALTER COLUMN compare_at_eur TYPE NUMERIC(10, 2) USING compare_at_eur::numeric;

ALTER TABLE product_variants
  ALTER COLUMN price_eur TYPE NUMERIC(10, 2) USING price_eur::numeric,
  ALTER COLUMN compare_at_eur TYPE NUMERIC(10, 2) USING compare_at_eur::numeric;
