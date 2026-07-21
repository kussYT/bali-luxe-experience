import { Pool, neon, neonConfig } from "@neondatabase/serverless";
import { getProjectRoot } from "../runtime-root.mjs";
import { recordQuery, recordTransactionBatch } from "./query-stats.mjs";

let pool;
let sqlFn;
let driverReady = false;

function isEdgeRuntime() {
  return getProjectRoot() === null;
}

async function ensureDriver() {
  if (driverReady) return;
  if (isEdgeRuntime()) {
    neonConfig.poolQueryViaFetch = true;
    neonConfig.fetchConnectionCache = true;
  } else {
    const { default: WebSocket } = await import("ws");
    neonConfig.webSocketConstructor = WebSocket;
  }
  driverReady = true;
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    const err = new Error("DATABASE_URL is not configured");
    err.status = 503;
    throw err;
  }
  return url;
}

function getSql() {
  if (!sqlFn) {
    sqlFn = neon(getDatabaseUrl());
  }
  return sqlFn;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPool() {
  const url = getDatabaseUrl();
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

function normalizeRows(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.rows)) return result.rows;
  return [];
}

/**
 * Run multiple SQL statements in a single Neon HTTP round-trip (1 subrequest on Workers).
 */
export async function queryTransaction(statements) {
  await ensureDriver();
  if (!statements.length) return [];

  recordTransactionBatch(statements.length);
  recordQuery();

  const sql = getSql();
  if (statements.length === 1) {
    const { text, params = [] } = statements[0];
    const rows = normalizeRows(await sql.query(text, params));
    return [{ rows }];
  }

  const results = await sql.transaction(
    statements.map(({ text, params = [] }) => sql.query(text, params)),
  );

  return results.map((result) => ({ rows: normalizeRows(result) }));
}

export async function query(text, params) {
  await ensureDriver();
  recordQuery();
  return getPool().query(text, params);
}

export async function withTransaction(fn) {
  await ensureDriver();
  recordQuery();
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
