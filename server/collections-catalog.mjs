/** Canonical collection slugs — synced to DB for admin (catalog.json + Beatrice additions). */
export const KNOWN_COLLECTIONS = [
  { slug: "mi-paradisio-collection", name: "Mi Paradisio", sortOrder: 10 },
  { slug: "special-occasions", name: "Wedding Guest", sortOrder: 20 },
  { slug: "galore-capsule-collection", name: "Galore Capsule Collection", sortOrder: 30 },
  { slug: "sunburn", name: "Sunburn", sortOrder: 40 },
  { slug: "feel-the-yarn", name: "Feel The Yarn", sortOrder: 45 },
  { slug: "new-collection-2023", name: "Heatwave", sortOrder: 50 },
  { slug: "juicy-record", name: "Juicy Records", sortOrder: 60 },
  { slug: "wild-kids", name: "Wild Kids", sortOrder: 70 },
  { slug: "retro-safari", name: "Retro Safari", sortOrder: 80 },
  { slug: "90s-fisher", name: "90's Era", sortOrder: 90 },
  { slug: "best-sellers", name: "Bestsellers", sortOrder: 100, hidden: true },
  { slug: "boater", name: "BOATER", sortOrder: 110, hidden: true },
  { slug: "archives", name: "Outlet", sortOrder: 120, hidden: true },
  { slug: "paille", name: "Paille", sortOrder: 130, hidden: true },
  { slug: "the-rimba", name: "Rimba Hat", sortOrder: 140, hidden: true },
  { slug: "the-knits", name: "The knits", sortOrder: 150, hidden: true },
  { slug: "fallwinter-2023-2024", name: "WINTER COLLECTION", sortOrder: 160, hidden: true },
  { slug: "accessories", name: "Accessories", sortOrder: 170, hidden: true },
  { slug: "bucket-hat", name: "Bucket Hat", sortOrder: 180, hidden: true },
  { slug: "cow-boy", name: "Cow-boy", sortOrder: 190, hidden: true },
  { slug: "casquette", name: "Cap", sortOrder: 200, hidden: true },
  { slug: "shop", name: "Shop", sortOrder: 999, hidden: true },
];

/** Returns a single batched INSERT (1 subrequest instead of N). */
export function collectionsCatalogInsertStatement() {
  const params = [];
  const values = KNOWN_COLLECTIONS.map((col, i) => {
    const base = i * 4 + 1;
    params.push(col.slug, col.name, col.sortOrder ?? 100, Boolean(col.hidden));
    return `($${base}, $${base + 1}, '', '', $${base + 2}, $${base + 3})`;
  });
  return {
    text: `INSERT INTO collections (slug, name, season, description, sort_order, hidden)
           VALUES ${values.join(", ")}
           ON CONFLICT (slug) DO NOTHING`,
    params,
  };
}

export async function ensureCollectionsCatalog(queryFn) {
  const { text, params } = collectionsCatalogInsertStatement();
  await queryFn(text, params);
}
