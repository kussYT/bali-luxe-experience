import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { fetchProductAnalytics, type ProductAnalyticsRow } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/analytics/products")({
  head: () => ({ meta: [{ title: "Analytics produits — Bingin Diaries Admin" }] }),
  component: AdminProductAnalyticsPage,
});

const PERIODS = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" },
] as const;

function AdminProductAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [products, setProducts] = useState<ProductAnalyticsRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchProductAnalytics(days, 50)
      .then((res) => setProducts(res.analytics.products))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = products.reduce(
    (acc, row) => ({
      views: acc.views + row.views,
      cartAdds: acc.cartAdds + row.cartAdds,
      wishlistAdds: acc.wishlistAdds + row.wishlistAdds,
    }),
    { views: 0, cartAdds: 0, wishlistAdds: 0 },
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-eyebrow text-muted-foreground">Analytics</p>
        <h2 className="font-display text-4xl mt-2">Produits</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Vues page produit (1× par session), ajouts au panier et wishlist sur la période choisie.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.days}
            variant={days === p.days ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(p.days)}
          >
            {p.label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          Actualiser
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid sm:grid-cols-3 gap-4 max-w-3xl">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Vues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{totals.views}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Ajouts panier</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{totals.cartAdds}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Wishlist</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{totals.wishlistAdds}</p>
          </CardContent>
        </Card>
      </div>

      <div className="border border-border rounded-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Produit</th>
              <th className="p-3 font-medium text-right">Vues</th>
              <th className="p-3 font-medium text-right">Panier</th>
              <th className="p-3 font-medium text-right">Wishlist</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading && products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Chargement…
                </td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Aucun événement sur cette période.
                </td>
              </tr>
            )}
            {products.map((row) => (
              <tr key={row.slug} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{row.slug}</td>
                <td className="p-3 text-right tabular-nums">{row.views}</td>
                <td className="p-3 text-right tabular-nums">{row.cartAdds}</td>
                <td className="p-3 text-right tabular-nums">{row.wishlistAdds}</td>
                <td className="p-3 text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/products/$slug" params={{ slug: row.slug }}>
                      Éditer
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
