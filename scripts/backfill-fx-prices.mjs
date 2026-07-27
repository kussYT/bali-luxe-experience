import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query(`
  UPDATE products SET
    price_idr = ROUND(
      (CASE WHEN compare_at_eur IS NOT NULL AND compare_at_eur < price_eur THEN compare_at_eur ELSE price_eur END) * 20000
    ),
    price_usd = ROUND(
      (CASE WHEN compare_at_eur IS NOT NULL AND compare_at_eur < price_eur THEN compare_at_eur ELSE price_eur END) * 1.1
    )
`);
console.log("updated", r.rowCount, "products to EUR_TO_IDR=20000");
await pool.end();
