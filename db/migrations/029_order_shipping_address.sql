-- Customer shipping snapshot from Stripe Checkout (name, phone, full address).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address JSONB;
