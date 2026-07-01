import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminReadiness, type ReadinessRow } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/readiness")({
  head: () => ({ meta: [{ title: "Catalogue — prêt go-live — Admin" }] }),
  component: AdminReadinessPage,
});

function RowList({ rows, variant }: { rows: ReadinessRow[]; variant: "ok" | "issue" }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun produit.</p>;
  }
  return (
    <ul className="space-y-2 text-sm">
      {rows.map((r) => (
        <li key={r.slug} className="flex flex-wrap justify-between gap-2 border-b border-border pb-2">
          <div>
            <Link to="/admin/products" className="link-underline">
              {r.name}
            </Link>
            <p className="text-xs text-muted-foreground">{r.collection || "—"} · {r.slug}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {variant === "issue" ? (
              <span className="text-amber-800">{r.problems.join(", ")}</span>
            ) : (
              <span>
                Paris {r.stockFrance} · Bali {r.stockBali}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function AdminReadinessPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAdminReadiness>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminReadiness()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, []);

  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (!data) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-eyebrow text-muted-foreground">Go-live</p>
        <h2 className="font-display text-4xl mt-2">Checklist catalogue</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Produits publiés, avec image, variantes et stock avant mise en ligne.
        </p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: data.summary.total },
          { label: "Publiés", value: data.summary.published },
          { label: "Prêts", value: data.summary.ready },
          { label: "À corriger", value: data.summary.needsAttention },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-amber-900">À corriger ({data.issues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <RowList rows={data.issues} variant="issue" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prêts ({data.ready.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <RowList rows={data.ready} variant="ok" />
        </CardContent>
      </Card>
    </div>
  );
}
