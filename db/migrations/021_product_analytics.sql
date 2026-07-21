-- Product analytics events (views, cart adds, wishlist)
CREATE TABLE IF NOT EXISTS product_analytics_events (
  id BIGSERIAL PRIMARY KEY,
  product_slug TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'cart', 'wishlist')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_analytics_slug_type_created
  ON product_analytics_events (product_slug, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_analytics_created
  ON product_analytics_events (created_at DESC);
