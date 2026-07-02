import { query, isDatabaseConfigured } from "../db/pool.mjs";

export async function getAdminFinanceResponse() {
  if (!isDatabaseConfigured()) {
    const err = new Error("DATABASE_URL required");
    err.status = 503;
    throw err;
  }

  const [refundsRes, paidRes, pendingRes] = await Promise.all([
    query(`
      SELECT id, status, channel, currency, amount_total, refund_amount_cents,
             customer_email, promo_code, paid_at, created_at, updated_at
      FROM orders
      WHERE status IN ('refunded', 'partially_refunded')
      ORDER BY updated_at DESC
      LIMIT 100
    `),
    query(`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('paid', 'shipped'))::int AS paid_count,
        COALESCE(SUM(amount_total) FILTER (WHERE status IN ('paid', 'shipped') AND currency = 'EUR'), 0)::bigint AS revenue_eur_cents
      FROM orders
    `),
    query(`
      SELECT COUNT(*)::int AS count
      FROM orders
      WHERE status IN ('paid', 'processing', 'on_hold', 'shipped')
    `),
  ]);

  const summary = paidRes.rows[0] || {};

  return {
    summary: {
      paidOrders: summary.paid_count ?? 0,
      revenueEurCents: Number(summary.revenue_eur_cents ?? 0),
      activeOrders: pendingRes.rows[0]?.count ?? 0,
      refundCount: refundsRes.rows.length,
    },
    refunds: refundsRes.rows.map((r) => ({
      id: r.id,
      status: r.status,
      channel: r.channel,
      currency: r.currency,
      amountTotal: r.amount_total,
      refundAmountCents: r.refund_amount_cents,
      customerEmail: r.customer_email,
      promoCode: r.promo_code,
      paidAt: r.paid_at,
      updatedAt: r.updated_at,
    })),
    stripeDashboardUrl: "https://dashboard.stripe.com/payments",
    stripePayoutsUrl: "https://dashboard.stripe.com/payouts",
    source: "postgres",
  };
}
