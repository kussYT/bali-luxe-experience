-- CMS pages: translations per locale (fr, en, id, es)

ALTER TABLE pages ADD COLUMN IF NOT EXISTS locales JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE pages
SET locales = jsonb_build_object(
  'en',
  jsonb_build_object(
    'title', title,
    'eyebrow', eyebrow,
    'metaDescription', meta_description,
    'body', body
  )
)
WHERE locales = '{}'::jsonb OR locales IS NULL;
