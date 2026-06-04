-- Bingin Diaries — Sprint S1 schema
-- Postgres single source of truth (catalog, variants, multi-warehouse inventory)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE warehouse_id AS ENUM ('france', 'bali');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE product_origin AS ENUM ('Bali', 'France');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS warehouses (
  id warehouse_id PRIMARY KEY,
  name TEXT NOT NULL,
  country_code CHAR(2) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  season TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  story TEXT NOT NULL DEFAULT '',
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  subcategory TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'hats',
  product_type TEXT NOT NULL DEFAULT '',
  price_eur INT NOT NULL DEFAULT 0,
  compare_at_eur INT,
  price_usd INT NOT NULL DEFAULT 0,
  price_idr INT NOT NULL DEFAULT 0,
  status product_status NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT false,
  origin product_origin NOT NULL DEFAULT 'Bali',
  default_warehouse warehouse_id NOT NULL DEFAULT 'bali',
  shopify_product_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_id);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  sku TEXT,
  title TEXT NOT NULL,
  option1 TEXT,
  option2 TEXT,
  option3 TEXT,
  price_eur INT,
  compare_at_eur INT,
  position INT NOT NULL DEFAULT 0,
  shopify_variant_id BIGINT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

CREATE TABLE IF NOT EXISTS product_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  warehouse_id warehouse_id NOT NULL REFERENCES warehouses(id),
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved INT NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (variant_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_variant ON product_inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON product_inventory(warehouse_id);

-- Audit trail — used heavily in S2
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  warehouse_id warehouse_id NOT NULL REFERENCES warehouses(id),
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movements_variant ON inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON inventory_movements(created_at DESC);

-- Seed warehouses (idempotent)
INSERT INTO warehouses (id, name, country_code, sort_order)
VALUES
  ('france', 'Paris — France', 'FR', 1),
  ('bali', 'Bali — Indonesia', 'ID', 2)
ON CONFLICT (id) DO NOTHING;
