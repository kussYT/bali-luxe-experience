import { readCatalog, writeCatalog } from "../server/catalog-store.mjs";

const catalog = await readCatalog();
console.log(`Migrating ${catalog.products.length} products…`);
const saved = await writeCatalog(catalog);
console.log(`Done. Collections: ${saved.collections.length}`);
