-- Collection name + description per locale (fr, en, id, es)

ALTER TABLE collections ADD COLUMN IF NOT EXISTS locales JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE collections
SET locales = jsonb_build_object(
  'en', jsonb_build_object('name', name, 'description', COALESCE(description, '')),
  'fr', jsonb_build_object('name', name, 'description', COALESCE(description, ''))
)
WHERE locales = '{}'::jsonb OR locales IS NULL;
