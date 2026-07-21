-- Beatrice collections taxonomy (ensure slugs exist for admin + nav)
INSERT INTO collections (slug, name, season, hidden, sort_order)
VALUES
  ('feel-the-yarn', 'Feel The Yarn', '', false, 45),
  ('mi-paradisio-collection', 'Mi Paradisio', '', false, 10),
  ('special-occasions', 'Wedding Guest', '', false, 20),
  ('galore-capsule-collection', 'Galore Capsule Collection', '', false, 30),
  ('sunburn', 'Sunburn', '', false, 40),
  ('new-collection-2023', 'Heatwave', '', false, 50),
  ('juicy-record', 'Juicy Records', '', false, 60),
  ('wild-kids', 'Wild Kids', '', false, 70),
  ('retro-safari', 'Retro Safari', '', false, 80),
  ('90s-fisher', '90''s era', '', false, 90)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  hidden = false,
  updated_at = now();
