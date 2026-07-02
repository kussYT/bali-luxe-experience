-- Collection hero image focal point (product gallery images already have focal_x/y on product_images)

ALTER TABLE collections ADD COLUMN IF NOT EXISTS hero_focal_x REAL NOT NULL DEFAULT 50;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS hero_focal_y REAL NOT NULL DEFAULT 50;
