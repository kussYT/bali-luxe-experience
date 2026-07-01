-- Blog posts: translations per locale (fr, en, id, es)

ALTER TABLE posts ADD COLUMN IF NOT EXISTS locales JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE posts
SET locales = jsonb_build_object(
  'en',
  jsonb_build_object(
    'title', title,
    'excerpt', excerpt,
    'category', category,
    'body', body
  )
)
WHERE locales = '{}'::jsonb OR locales IS NULL;
