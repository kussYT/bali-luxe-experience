import type { AdminAnalytics } from "@/lib/admin-api";
import { ADMIN_CHART } from "@/lib/admin-chart-theme";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

function formatEur(cents: number) {
  return `€${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatMonthLabel(month: string) {
  const [y, m] = month.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

const chartConfig = {
  orders: { label: "Commandes", color: ADMIN_CHART.accent },
  revenue: { label: "CA (€)", color: ADMIN_CHART.muted },
};

type OrdersAnalyticsPanelProps = {
  analytics: AdminAnalytics;
  compact?: boolean;
};

export function OrdersAnalyticsPanel({ analytics, compact = false }: OrdersAnalyticsPanelProps) {
  const monthly = analytics.salesByMonth || [];
  const current = monthly[monthly.length - 1];
  const previous = monthly[monthly.length - 2];
  const sameMonthLastYear = current
    ? monthly.find((r) => {
        const [y, m] = current.month.split("-");
        return r.month === `${Number(y) - 1}-${m}`;
      })
    : undefined;

  const monthlyData = monthly.map((row) => ({
    month: formatMonthLabel(row.month),
    orders: row.orders,
    revenue: row.revenueCents / 100,
  }));

  const ordersDelta =
    current && previous && previous.orders > 0
      ? Math.round(((current.orders - previous.orders) / previous.orders) * 100)
      : null;
  const revenueDelta =
    current && previous && previous.revenueCents > 0
      ? Math.round(((current.revenueCents - previous.revenueCents) / previous.revenueCents) * 100)
      : null;

  return (
    <div className="space-y-4">
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">CA ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl">{current ? formatEur(current.revenueCents) : "—"}</p>
            {revenueDelta != null && (
              <p className="text-xs text-muted-foreground mt-1">
                {revenueDelta >= 0 ? "+" : ""}
                {revenueDelta}% vs mois précédent
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Commandes ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl">{current?.orders ?? "—"}</p>
            {ordersDelta != null && (
              <p className="text-xs text-muted-foreground mt-1">
                {ordersDelta >= 0 ? "+" : ""}
                {ordersDelta}% vs mois précédent
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Même mois N-1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl">
              {sameMonthLastYear ? formatEur(sameMonthLastYear.revenueCents) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sameMonthLastYear ? `${sameMonthLastYear.orders} commandes` : "Pas encore de données"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">CA total (EUR)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl">{formatEur(analytics.summary.revenueEurCents)}</p>
            <p className="text-xs text-muted-foreground mt-1">{analytics.summary.paidOrders} commandes payées</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Commandes & CA par mois</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Pas encore de commandes payées.</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <BarChart data={monthlyData} margin={{ left: 4, right: 12, top: 12, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke={ADMIN_CHART.border} strokeDasharray="4 4" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: ADMIN_CHART.muted }} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={32} tick={{ fill: ADMIN_CHART.muted }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" radius={[6, 6, 0, 0]} maxBarSize={40} fill={ADMIN_CHART.accent} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
