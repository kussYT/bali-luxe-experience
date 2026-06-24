-- Extra collection memberships (e.g. Special Occasions) beyond primary collection_id

CREATE TABLE IF NOT EXISTS product_collection_memberships (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_product_collection_memberships_collection
  ON product_collection_memberships(collection_id);
