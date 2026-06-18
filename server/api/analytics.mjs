import { getDashboardAnalytics } from "../db/analytics.mjs";
import { isDatabaseConfigured } from "../db/pool.mjs";

export async function getAdminAnalyticsResponse() {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required for analytics");
    err.status = 503;
    throw err;
  }
  const analytics = await getDashboardAnalytics();
  return { analytics, source: "postgres" };
}
