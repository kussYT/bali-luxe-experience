import { COUNTRY_CENTROIDS, countryLabel, projectCountry } from "@/lib/country-centroids";
import { ADMIN_CHART } from "@/lib/admin-chart-theme";

type CountryOrder = {
  country: string;
  orders: number;
};

type OrdersWorldMapProps = {
  data: CountryOrder[];
};

const WIDTH = 950;
const HEIGHT = 620;

export function OrdersWorldMap({ data }: OrdersWorldMapProps) {
  const maxOrders = Math.max(1, ...data.map((d) => d.orders));
  const points = data
    .map((row) => {
      const centroid = COUNTRY_CENTROIDS[row.country] || COUNTRY_CENTROIDS.XX;
      const { x, y } = projectCountry(centroid.lon, centroid.lat, WIDTH, HEIGHT);
      const radius = 7 + (row.orders / maxOrders) * 14;
      return { ...row, x, y, radius, name: countryLabel(row.country) };
    })
    .filter((p) => p.country !== "XX" || data.length === 1);

  return (
    <div className="space-y-4">
      <div
        className="relative w-full overflow-hidden rounded-sm border border-border"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, background: ADMIN_CHART.sand }}
      >
        <img
          src="/admin/world-map.svg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
          style={{ opacity: 0.28 }}
        />
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Carte des commandes par pays"
        >
          {points.map((point) => (
            <g key={point.country}>
              <circle
                cx={point.x}
                cy={point.y}
                r={point.radius + 6}
                fill={ADMIN_CHART.accent}
                fillOpacity={0.18}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={point.radius}
                fill={ADMIN_CHART.accent}
                fillOpacity={0.88}
                stroke={ADMIN_CHART.cream}
                strokeWidth={2}
              />
              <text
                x={point.x}
                y={point.y - point.radius - 8}
                textAnchor="middle"
                fontSize={11}
                fontFamily="var(--font-sans), system-ui, sans-serif"
                fill={ADMIN_CHART.ink}
                fontWeight={600}
              >
                {point.orders}
              </text>
              <title>
                {point.name} ({point.country}) — {point.orders} commande{point.orders > 1 ? "s" : ""}
              </title>
            </g>
          ))}
          {points.length === 0 && (
            <text
              x={WIDTH / 2}
              y={HEIGHT / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={ADMIN_CHART.muted}
              fontSize={15}
              fontFamily="var(--font-sans), system-ui, sans-serif"
            >
              Aucune commande payée pour l&apos;instant
            </text>
          )}
        </svg>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Commandes payées par pays d&apos;expédition
      </p>
      {points.length > 0 && (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {points
            .slice()
            .sort((a, b) => b.orders - a.orders)
            .map((point) => (
              <li key={point.country} className="flex justify-between gap-2 border-b border-border/60 pb-1">
                <span>
                  {point.name} <span className="text-muted-foreground">({point.country})</span>
                </span>
                <span className="font-medium tabular-nums">{point.orders}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
