import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminFinance, type AdminFinance } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { orderStatusLabel } from "@/lib/order-status";

export const Route = createFileRoute("/admin/finance")({
  head: () => ({ meta: [{ title: "Finance — Bingin Diaries Admin" }] }),
  component: AdminFinancePage,
});

function formatEur(cents: number) {
  return `€${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`;
}

function AdminFinancePage() {
  const [data, setData] = useState<AdminFinance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminFinance()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, []);

  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (!data) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-muted-foreground">Finance</p>
          <h2 className="font-display text-4xl mt-2">Paiements &amp; remboursements</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={data.stripeDashboardUrl} target="_blank" rel="noreferrer">
              Stripe — Paiements
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={data.stripePayoutsUrl} target="_blank" rel="noreferrer">
              Stripe — Virements
            </a>
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">CA (EUR)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{formatEur(data.summary.revenueEurCents)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Commandes payées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{data.summary.paidOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Remboursements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{data.summary.refundCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Remboursements récents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.refunds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun remboursement enregistré.</p>
          ) : (
            data.refunds.map((r) => (
              <div key={r.id} className="flex flex-wrap justify-between gap-2 border-b border-border pb-3 text-sm">
                <div>
                  <Link to="/admin/orders/$orderId" params={{ orderId: r.id }} className="link-underline font-mono text-xs">
                    {r.id.slice(0, 8)}…
                  </Link>
                  <p className="text-muted-foreground">{r.customerEmail || "—"}</p>
                </div>
                <div className="text-right">
                  <p>{orderStatusLabel(r.status)}</p>
                  {r.refundAmountCents != null && (
                    <p className="text-muted-foreground">{formatEur(r.refundAmountCents)}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
