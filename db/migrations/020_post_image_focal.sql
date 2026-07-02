-- Cover image focal point for blog posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_focal JSONB;
