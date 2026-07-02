import { query, isDatabaseConfigured } from "./pool.mjs";

export async function getDashboardAnalytics() {
  if (!isDatabaseConfigured()) {
    const err = new Error("Database not configured");
    err.status = 503;
    throw err;
  }

  const [summaryRes, weeklyRes, monthlyRes, countryRes, channelRes, stockRes] = await Promise.all([
    query(`
      SELECT
        COUNT(*)::int AS total_orders,
        COUNT(*) FILTER (WHERE status IN ('paid', 'shipped'))::int AS paid_orders,
        COUNT(*) FILTER (WHERE status = 'shipped')::int AS shipped_orders,
        COALESCE(SUM(amount_total) FILTER (WHERE status IN ('paid', 'shipped')), 0)::bigint AS revenue_cents_eur
      FROM orders
      WHERE currency = 'EUR'
    `),
    query(`
      SELECT
        to_char(date_trunc('week', COALESCE(paid_at, created_at)), 'YYYY-MM-DD') AS week_start,
        COUNT(*)::int AS orders,
        COALESCE(SUM(amount_total), 0)::bigint AS revenue_cents
      FROM orders
      WHERE status IN ('paid', 'shipped')
        AND COALESCE(paid_at, created_at) >= now() - interval '12 weeks'
      GROUP BY 1
      ORDER BY 1 ASC
    `),
    query(`
      SELECT
        to_char(date_trunc('month', COALESCE(paid_at, created_at)), 'YYYY-MM') AS month,
        COUNT(*)::int AS orders,
        COALESCE(SUM(amount_total), 0)::bigint AS revenue_cents
      FROM orders
      WHERE status IN ('paid', 'shipped')
        AND COALESCE(paid_at, created_at) >= now() - interval '24 months'
      GROUP BY 1
      ORDER BY 1 ASC
    `),
    query(`
      SELECT
        UPPER(COALESCE(NULLIF(shipping_country_code, ''), NULLIF(country_code, ''), 'XX')) AS country,
        COUNT(*)::int AS orders,
        COALESCE(SUM(amount_total), 0)::bigint AS revenue_cents
      FROM orders
      WHERE status IN ('paid', 'shipped')
      GROUP BY 1
      ORDER BY orders DESC
      LIMIT 30
    `),
    query(`
      SELECT channel::text, COUNT(*)::int AS orders
      FROM orders
      WHERE status IN ('paid', 'shipped')
      GROUP BY channel
      ORDER BY orders DESC
    `),
    query(`
      SELECT
        COALESCE(SUM(GREATEST(pi.quantity - pi.reserved, 0)) FILTER (WHERE pi.warehouse_id = 'france'), 0)::int AS france,
        COALESCE(SUM(GREATEST(pi.quantity - pi.reserved, 0)) FILTER (WHERE pi.warehouse_id = 'bali'), 0)::int AS bali
      FROM product_inventory pi
    `),
  ]);

  const summary = summaryRes.rows[0] || {};

  return {
    summary: {
      totalOrders: summary.total_orders ?? 0,
      paidOrders: summary.paid_orders ?? 0,
      shippedOrders: summary.shipped_orders ?? 0,
      revenueEurCents: Number(summary.revenue_cents_eur ?? 0),
    },
    salesByWeek: weeklyRes.rows.map((r) => ({
      weekStart: r.week_start,
      orders: r.orders,
      revenueCents: Number(r.revenue_cents),
    })),
    salesByMonth: monthlyRes.rows.map((r) => ({
      month: r.month,
      orders: r.orders,
      revenueCents: Number(r.revenue_cents),
    })),
    ordersByCountry: countryRes.rows.map((r) => ({
      country: r.country,
      orders: r.orders,
      revenueCents: Number(r.revenue_cents),
    })),
    ordersByChannel: channelRes.rows.map((r) => ({
      channel: r.channel,
      orders: r.orders,
    })),
    stockByWarehouse: {
      france: stockRes.rows[0]?.france ?? 0,
      bali: stockRes.rows[0]?.bali ?? 0,
    },
  };
}
