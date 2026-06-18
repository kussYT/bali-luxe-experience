import type { AdminAnalytics } from "@/lib/admin-api";
import { ADMIN_CHART } from "@/lib/admin-chart-theme";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

function formatEur(cents: number) {
  return `€${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatWeekLabel(weekStart: string) {
  const d = new Date(weekStart);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const chartConfig = {
  orders: { label: "Commandes", color: ADMIN_CHART.accent },
  revenue: { label: "CA (€)", color: ADMIN_CHART.muted },
  units: { label: "Unités", color: ADMIN_CHART.accent },
};

const STOCK_COLORS: Record<string, string> = {
  Paris: ADMIN_CHART.accent,
  Bali: ADMIN_CHART.accentMuted,
};

type DashboardChartsProps = {
  analytics: AdminAnalytics;
};

export function DashboardCharts({ analytics }: DashboardChartsProps) {
  const weeklyData = analytics.salesByWeek.map((row) => ({
    week: formatWeekLabel(row.weekStart),
    orders: row.orders,
    revenue: row.revenueCents / 100,
  }));

  const countryData = analytics.ordersByCountry.slice(0, 8).map((row) => ({
    country: row.country,
    orders: row.orders,
  }));

  const channelData = analytics.ordersByChannel.map((row) => ({
    channel: channelLabel(row.channel),
    orders: row.orders,
  }));

  const stockData = [
    { warehouse: "Paris", units: analytics.stockByWarehouse.france },
    { warehouse: "Bali", units: analytics.stockByWarehouse.bali },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Ventes (12 semaines)</CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Pas encore de commandes payées.</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <AreaChart data={weeklyData} margin={{ left: 4, right: 12, top: 12, bottom: 4 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ADMIN_CHART.accentSoft} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={ADMIN_CHART.cream} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={ADMIN_CHART.border} strokeDasharray="4 4" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: ADMIN_CHART.muted }} />
                <YAxis
                  yAxisId="orders"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={28}
                  tick={{ fill: ADMIN_CHART.muted }}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="revenue"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={44}
                  tick={{ fill: ADMIN_CHART.muted }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke={ADMIN_CHART.accent}
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke={ADMIN_CHART.ink}
                  strokeWidth={2}
                  dot={{ r: 3, fill: ADMIN_CHART.ink, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Commandes par canal</CardTitle>
        </CardHeader>
        <CardContent>
          {channelData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Aucune vente enregistrée.</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <BarChart data={channelData} margin={{ left: 4, right: 12, top: 12, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke={ADMIN_CHART.border} strokeDasharray="4 4" />
                <XAxis dataKey="channel" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: ADMIN_CHART.muted }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={28}
                  tick={{ fill: ADMIN_CHART.muted }}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {channelData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? ADMIN_CHART.accent : ADMIN_CHART.accentMuted} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Top pays (commandes)</CardTitle>
        </CardHeader>
        <CardContent>
          {countryData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnée pays.</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <BarChart data={countryData} layout="vertical" margin={{ left: 4, right: 16, top: 8, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke={ADMIN_CHART.border} strokeDasharray="4 4" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: ADMIN_CHART.muted }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="country"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={36}
                  tick={{ fill: ADMIN_CHART.muted }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" radius={[0, 6, 6, 0]} maxBarSize={28} fill={ADMIN_CHART.accent} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Stock disponible</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart data={stockData} margin={{ left: 4, right: 12, top: 12, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke={ADMIN_CHART.border} strokeDasharray="4 4" />
              <XAxis dataKey="warehouse" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: ADMIN_CHART.muted }} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={36} tick={{ fill: ADMIN_CHART.muted }} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="units" radius={[6, 6, 0, 0]} maxBarSize={72}>
                {stockData.map((row) => (
                  <Cell key={row.warehouse} fill={STOCK_COLORS[row.warehouse] ?? ADMIN_CHART.accent} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            CA total (EUR) : {formatEur(analytics.summary.revenueEurCents)} · {analytics.summary.paidOrders} commandes payées
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function channelLabel(channel: string) {
  if (channel === "website") return "Site web";
  if (channel === "wolf_badger") return "Wolf & Badger";
  return "Autre";
}
