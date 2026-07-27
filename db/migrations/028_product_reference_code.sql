-- Short product packing code (e.g. RSP for Rimba Slightly). Variant SKUs use CODE-SIZE.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS reference_code TEXT NOT NULL DEFAULT '';
