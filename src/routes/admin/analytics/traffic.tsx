import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { fetchSiteTraffic, type SiteTrafficAnalytics } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/analytics/traffic")({
  head: () => ({ meta: [{ title: "Trafic site — Bingin Diaries Admin" }] }),
  component: AdminSiteTrafficPage,
});

const PERIODS = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" },
] as const;

function sourceLabel(source: string) {
  const map: Record<string, string> = {
    direct: "Direct",
    instagram: "Instagram",
    facebook: "Facebook",
    google: "Google",
    pinterest: "Pinterest",
    tiktok: "TikTok",
    twitter: "X / Twitter",
    bing: "Bing",
  };
  return map[source] || source;
}

function deviceLabel(device: string) {
  const map: Record<string, string> = {
    mobile: "Mobile",
    tablet: "Tablette",
    desktop: "Desktop",
    unknown: "Inconnu",
  };
  return map[device] || device;
}

function AdminSiteTrafficPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<SiteTrafficAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchSiteTraffic(days)
      .then((res) => setData(res.analytics))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-eyebrow text-muted-foreground">Analytics</p>
        <h2 className="font-display text-4xl mt-2">Trafic site</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Visites mesurées sur notre serveur (y compris Instagram). Activé uniquement après
          acceptation des cookies Analytics. Complète Google Analytics, qui est souvent bloqué dans
          l’app Instagram.
        </p>
        <p className="text-sm mt-2">
          <Link to="/admin/analytics/products" className="link-underline">
            Voir aussi les analytics produits →
          </Link>
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              En ligne (30 min)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{data?.realtime.visitors ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.realtime.pageviews ?? 0} pages vues
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Visiteurs ({days}j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{data?.summary.visitors ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Pages vues ({days}j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{data?.summary.pageviews ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Moy. pages / visiteur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">
              {data && data.summary.visitors > 0
                ? (data.summary.pageviews / data.summary.visitors).toFixed(1)
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Sources</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-4">Source</th>
                  <th className="pb-2 pr-4 text-right">Visiteurs</th>
                  <th className="pb-2 text-right">Pages</th>
                </tr>
              </thead>
              <tbody>
                {!loading && (!data || data.bySource.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-4 text-muted-foreground">
                      Aucune donnée encore — les visites apparaîtront après consentement cookies.
                    </td>
                  </tr>
                )}
                {data?.bySource.map((row) => (
                  <tr key={row.source} className="border-t border-border">
                    <td className="py-2 pr-4">{sourceLabel(row.source)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{row.visitors}</td>
                    <td className="py-2 text-right tabular-nums">{row.pageviews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Appareils</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-4">Appareil</th>
                  <th className="pb-2 pr-4 text-right">Visiteurs</th>
                  <th className="pb-2 text-right">Pages</th>
                </tr>
              </thead>
              <tbody>
                {!loading && (!data || data.byDevice.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-4 text-muted-foreground">
                      Aucune donnée encore.
                    </td>
                  </tr>
                )}
                {data?.byDevice.map((row) => (
                  <tr key={row.device} className="border-t border-border">
                    <td className="py-2 pr-4">{deviceLabel(row.device)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{row.visitors}</td>
                    <td className="py-2 text-right tabular-nums">{row.pageviews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Pages les plus vues</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2 pr-4">Page</th>
                <th className="pb-2 pr-4 text-right">Visiteurs</th>
                <th className="pb-2 text-right">Pages vues</th>
              </tr>
            </thead>
            <tbody>
              {!loading && (!data || data.topPages.length === 0) && (
                <tr>
                  <td colSpan={3} className="py-4 text-muted-foreground">
                    Aucune donnée encore.
                  </td>
                </tr>
              )}
              {data?.topPages.map((row) => (
                <tr key={row.path} className="border-t border-border">
                  <td className="py-2 pr-4 font-mono text-xs">{row.path}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{row.visitors}</td>
                  <td className="py-2 text-right tabular-nums">{row.pageviews}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Par jour</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm min-w-[360px]">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2 pr-4">Jour</th>
                <th className="pb-2 pr-4 text-right">Visiteurs</th>
                <th className="pb-2 text-right">Pages vues</th>
              </tr>
            </thead>
            <tbody>
              {!loading && (!data || data.byDay.length === 0) && (
                <tr>
                  <td colSpan={3} className="py-4 text-muted-foreground">
                    Aucune donnée encore.
                  </td>
                </tr>
              )}
              {[...(data?.byDay || [])].reverse().map((row) => (
                <tr key={row.day} className="border-t border-border">
                  <td className="py-2 pr-4">{row.day}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{row.visitors}</td>
                  <td className="py-2 text-right tabular-nums">{row.pageviews}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
