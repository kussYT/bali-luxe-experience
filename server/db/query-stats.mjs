/** Lightweight DB subrequest counters (reset per Worker invocation via logAndReset). */

let queryCount = 0;
let transactionBatchCount = 0;
let queriesInLastBatch = 0;

export function recordQuery() {
  queryCount += 1;
}

export function recordTransactionBatch(statementCount) {
  transactionBatchCount += 1;
  queriesInLastBatch = statementCount;
}

export function getQueryStats() {
  return {
    queries: queryCount,
    transactionBatches: transactionBatchCount,
    queriesInLastBatch,
  };
}

export function logQueryStats(label) {
  const stats = getQueryStats();
  if (stats.queries === 0 && stats.transactionBatches === 0) return stats;
  console.info(`[db] ${label}`, stats);
  return stats;
}

export function resetQueryStats() {
  queryCount = 0;
  transactionBatchCount = 0;
  queriesInLastBatch = 0;
}
