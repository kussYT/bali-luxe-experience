-- Product display order (Shop All / collection grids) + cover image focal point

ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

ALTER TABLE product_images ADD COLUMN IF NOT EXISTS focal_x REAL NOT NULL DEFAULT 50;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS focal_y REAL NOT NULL DEFAULT 50;

-- Seed initial order from current name sort (10, 20, 30…)
WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY name ASC) AS rn FROM products
)
UPDATE products p
SET sort_order = ranked.rn * 10
FROM ranked
WHERE p.id = ranked.id AND p.sort_order = 0;
