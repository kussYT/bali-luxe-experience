import { Pool, neonConfig } from "@neondatabase/serverless";
import { getProjectRoot } from "../runtime-root.mjs";

let pool;
let driverReady = false;

async function ensureDriver() {
  if (driverReady) return;
  const edge = getProjectRoot() === null;
  if (edge) {
    // HTTP fetch mode — reliable on Cloudflare Workers (no TCP/WebSocket pool issues)
    neonConfig.poolQueryViaFetch = true;
    neonConfig.fetchConnectionCache = true;
  } else {
    const { default: WebSocket } = await import("ws");
    neonConfig.webSocketConstructor = WebSocket;
  }
  driverReady = true;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPool() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    const err = new Error("DATABASE_URL is not configured");
    err.status = 503;
    throw err;
  }
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

export async function query(text, params) {
  await ensureDriver();
  return getPool().query(text, params);
}

export async function withTransaction(fn) {
  await ensureDriver();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
