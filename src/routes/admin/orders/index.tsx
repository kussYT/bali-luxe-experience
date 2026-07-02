import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminOrders,
  fetchAbandonedCheckouts,
  sendAbandonedCheckoutRecovery,
  adminOrdersExportUrl,
  fetchAdminAnalytics,
  type AdminOrder,
  type AdminAnalytics,
  type AbandonedCheckout,
} from "@/lib/admin-api";
import { orderStatusLabel } from "@/lib/order-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChannelBadge } from "@/components/admin/ChannelBadge";
import { MarketplaceOrderForm } from "@/components/admin/MarketplaceOrderForm";
import { OrdersAnalyticsPanel } from "@/components/admin/OrdersAnalyticsPanel";

export const Route = createFileRoute("/admin/orders/")({
  head: () => ({ meta: [{ title: "Orders — Bingin Diaries Admin" }] }),
  component: AdminOrdersPage,
});

type OrdersTab = "orders" | "abandoned";

const CHANNEL_FILTERS = [
  { value: "", label: "Tous" },
  { value: "website", label: "Site web" },
  { value: "wolf_badger", label: "Wolf & Badger" },
  { value: "influencer", label: "Influenceur" },
  { value: "other", label: "Autre" },
] as const;

function formatMoney(amount: number | null, currency: string) {
  if (amount == null) return "—";
  if (currency === "IDR") return `${amount.toLocaleString()} Rp`;
  const value = amount / 100;
  if (currency === "USD") return `$${value.toFixed(2)}`;
  return `€${value.toFixed(2)}`;
}

function warehouseLabel(id: string | null) {
  if (id === "france") return "Paris";
  if (id === "bali") return "Bali";
  return "—";
}

function recoveryStatusLabel(status: AbandonedCheckout["recoveryStatus"]) {
  return status === "email_sent" ? "Relance envoyée" : "Non récupéré";
}

function AdminOrdersPage() {
  const [tab, setTab] = useState<OrdersTab>("orders");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [abandoned, setAbandoned] = useState<AbandonedCheckout[]>([]);
  const [abandonedStats, setAbandonedStats] = useState<{
    count: number;
    withEmail: number;
    recoverySent: number;
  } | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [channelFilter, setChannelFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sendingRecovery, setSendingRecovery] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    fetchAdminOrders(channelFilter || undefined)
      .then((res) => setOrders(res.orders))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load orders"));
  }, [channelFilter]);

  const loadAbandoned = useCallback(() => {
    fetchAbandonedCheckouts(1)
      .then((res) => {
        setAbandoned(res.checkouts);
        setAbandonedStats({
          count: res.count,
          withEmail: res.withEmail,
          recoverySent: res.recoverySent,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Impossible de charger les paniers abandonnés"));
  }, []);

  useEffect(() => {
    fetchAbandonedCheckouts(1)
      .then((res) =>
        setAbandonedStats({
          count: res.count,
          withEmail: res.withEmail,
          recoverySent: res.recoverySent,
        }),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "orders") loadOrders();
    else loadAbandoned();
    fetchAdminAnalytics()
      .then((res) => setAnalytics(res.analytics))
      .catch(() => {});
  }, [tab, loadOrders, loadAbandoned]);

  const toProcessCount = orders.filter((o) =>
    ["paid", "processing", "on_hold"].includes(o.status),
  ).length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const wbCount = orders.filter((o) => o.channel === "wolf_badger").length;

  async function handleSendRecovery(checkout: AbandonedCheckout) {
    setSendingRecovery(checkout.id);
    setError(null);
    setMessage(null);
    try {
      const res = await sendAbandonedCheckoutRecovery(checkout.id);
      setMessage(`Relance envoyée à ${res.email}`);
      loadAbandoned();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec d'envoi");
    } finally {
      setSendingRecovery(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-muted-foreground">Orders</p>
          <h2 className="font-display text-4xl mt-2">Commandes multi-canal</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Commandes payées · paniers abandonnés (checkout Stripe non finalisé, &gt; 1 h)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MarketplaceOrderForm onCreated={loadOrders} />
          <Button variant="outline" asChild>
            <a href={adminOrdersExportUrl()} download>
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        <Button
          variant={tab === "orders" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("orders")}
        >
          Commandes
        </Button>
        <Button
          variant={tab === "abandoned" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("abandoned")}
        >
          Paniers abandonnés
          {abandonedStats != null && abandonedStats.count > 0 && (
            <span className="ml-2 text-xs opacity-80">({abandonedStats.count})</span>
          )}
        </Button>
      </div>

      {analytics && tab === "orders" && <OrdersAnalyticsPanel analytics={analytics} compact />}

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {tab === "orders" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {CHANNEL_FILTERS.map((filter) => (
              <Button
                key={filter.value || "all"}
                variant={channelFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setChannelFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <div className="grid sm:grid-cols-4 gap-4 max-w-3xl">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl">{orders.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">À traiter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl">{toProcessCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Traitées</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl">{shippedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Wolf &amp; Badger</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl">{wbCount}</p>
              </CardContent>
            </Card>
          </div>

          <div className="border border-border rounded-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Canal</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Réf.</th>
                  <th className="p-3 font-medium">Ship to</th>
                  <th className="p-3 font-medium">Warehouse</th>
                  <th className="p-3 font-medium">Total</th>
                  <th className="p-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && !error && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-muted-foreground">
                      No orders yet. Complete a test checkout or add a marketplace order.
                    </td>
                  </tr>
                )}
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <ChannelBadge channel={order.channel || "website"} />
                    </td>
                    <td className="p-3">{orderStatusLabel(order.status)}</td>
                    <td className="p-3">{order.customerEmail || "—"}</td>
                    <td className="p-3 font-mono text-xs">{order.externalRef || "—"}</td>
                    <td className="p-3">{order.shippingCountryCode || order.countryCode || "—"}</td>
                    <td className="p-3">{warehouseLabel(order.fulfillmentWarehouse)}</td>
                    <td className="p-3">{formatMoney(order.amountTotal, order.currency)}</td>
                    <td className="p-3 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/admin/orders/$orderId" params={{ orderId: order.id }}>
                          Voir
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {abandonedStats && (
            <div className="grid sm:grid-cols-3 gap-4 max-w-2xl">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-normal text-muted-foreground">Abandons (&gt; 1 h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-3xl">{abandonedStats.count}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-normal text-muted-foreground">Avec e-mail</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-3xl">{abandonedStats.withEmail}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-normal text-muted-foreground">Relances envoyées</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-3xl">{abandonedStats.recoverySent}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <p className="text-sm text-muted-foreground max-w-2xl">
            Checkouts Stripe commencés mais non payés. L&apos;e-mail n&apos;apparaît que si le client l&apos;a saisi
            avant de quitter. Utilisez <strong>Envoyer relance</strong> pour un e-mail avec lien de reprise du paiement.
          </p>

          <div className="border border-border rounded-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[960px]">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3 font-medium">Checkout</th>
                  <th className="p-3 font-medium">Créé</th>
                  <th className="p-3 font-medium">Client</th>
                  <th className="p-3 font-medium">Région</th>
                  <th className="p-3 font-medium">Produits</th>
                  <th className="p-3 font-medium">Total</th>
                  <th className="p-3 font-medium">Relance</th>
                  <th className="p-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {abandoned.length === 0 && !error && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      Aucun panier abandonné pour le moment.
                    </td>
                  </tr>
                )}
                {abandoned.map((checkout) => (
                  <tr key={checkout.id} className="border-t border-border align-top">
                    <td className="p-3 font-mono text-xs whitespace-nowrap">
                      #{checkout.id.slice(0, 8)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {new Date(checkout.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="p-3">{checkout.customerEmail || "—"}</td>
                    <td className="p-3">{checkout.countryCode || "—"}</td>
                    <td className="p-3 max-w-xs text-xs text-muted-foreground">{checkout.productSummary}</td>
                    <td className="p-3 whitespace-nowrap">
                      {formatMoney(checkout.estimatedTotalCents, checkout.currency)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-sm ${
                          checkout.recoveryStatus === "email_sent"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {recoveryStatusLabel(checkout.recoveryStatus)}
                      </span>
                      {checkout.recoveryEmailCount != null && checkout.recoveryEmailCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {checkout.recoveryEmailCount} envoi{checkout.recoveryEmailCount > 1 ? "s" : ""}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/admin/orders/$orderId" params={{ orderId: checkout.id }}>
                          Voir
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        disabled={!checkout.customerEmail || sendingRecovery === checkout.id}
                        onClick={() => handleSendRecovery(checkout)}
                      >
                        {sendingRecovery === checkout.id ? "Envoi…" : "Envoyer relance"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
