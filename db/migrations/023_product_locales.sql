-- Product translations per locale (fr, en, id, es)

ALTER TABLE products ADD COLUMN IF NOT EXISTS locales JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE products
SET locales = jsonb_build_object(
  'en',
  jsonb_build_object(
    'name', name,
    'story', story,
    'seoTitle', COALESCE(seo_title, ''),
    'metaDescription', COALESCE(meta_description, '')
  )
)
WHERE locales = '{}'::jsonb OR locales IS NULL;
