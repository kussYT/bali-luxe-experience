import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminOrders,
  fetchAbandonedCheckouts,
  sendAbandonedCheckoutRecovery,
  adminOrdersExportUrl,
  fetchAdminAnalytics,
  fetchAbandonedRecoverySettings,
  updateAbandonedRecoverySettings,
  runAbandonedRecoveryNow,
  type AdminOrder,
  type AdminAnalytics,
  type AbandonedCheckout,
  type AbandonedRecoverySettings,
} from "@/lib/admin-api";
import { orderStatusLabel } from "@/lib/order-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChannelBadge } from "@/components/admin/ChannelBadge";
import { MarketplaceOrderForm } from "@/components/admin/MarketplaceOrderForm";
import { ManualInvoiceOrderForm } from "@/components/admin/ManualInvoiceOrderForm";
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
  const [recoverySettings, setRecoverySettings] = useState<AbandonedRecoverySettings | null>(null);
  const [recoveryDraft, setRecoveryDraft] = useState<AbandonedRecoverySettings | null>(null);
  const [savingRecovery, setSavingRecovery] = useState(false);
  const [runningRecovery, setRunningRecovery] = useState(false);

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
    else {
      loadAbandoned();
      fetchAbandonedRecoverySettings()
        .then((res) => {
          setRecoverySettings(res.settings);
          setRecoveryDraft(res.settings);
        })
        .catch(() => {});
    }
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

  async function handleSaveRecoverySettings() {
    if (!recoveryDraft) return;
    setSavingRecovery(true);
    setError(null);
    setMessage(null);
    try {
      const res = await updateAbandonedRecoverySettings(recoveryDraft);
      setRecoverySettings(res.settings);
      setRecoveryDraft(res.settings);
      setMessage("Réglages de récupération automatique enregistrés.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec d'enregistrement");
    } finally {
      setSavingRecovery(false);
    }
  }

  async function handleRunRecoveryNow() {
    setRunningRecovery(true);
    setError(null);
    setMessage(null);
    try {
      const res = await runAbandonedRecoveryNow();
      if (res.reason === "disabled") {
        setMessage("Récupération automatique désactivée — activez-la ci-dessous ou utilisez l'envoi manuel.");
      } else {
        setMessage(`${res.sent} relance(s) envoyée(s) · ${res.skipped} ignorée(s) sur ${res.processed} panier(s).`);
      }
      loadAbandoned();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'exécution");
    } finally {
      setRunningRecovery(false);
    }
  }

  const recoveryDirty =
    recoveryDraft &&
    recoverySettings &&
    JSON.stringify(recoveryDraft) !== JSON.stringify(recoverySettings);

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
          <ManualInvoiceOrderForm onCreated={loadOrders} />
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
                      <div className="flex flex-col gap-1">
                        <ChannelBadge channel={order.channel || "website"} />
                        {order.externalRef === "manual_invoice" && (
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Facture
                          </span>
                        )}
                      </div>
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

          {recoveryDraft && (
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="text-base font-medium">Récupération automatique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Envoie des e-mails de relance via un cron quotidien (<code className="text-xs">POST /api/cron/abandoned-recovery</code>).
                  L&apos;envoi manuel reste disponible dans le tableau.
                </p>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="recovery-enabled"
                    checked={recoveryDraft.enabled}
                    onCheckedChange={(v) =>
                      setRecoveryDraft((s) => s && { ...s, enabled: v === true })
                    }
                  />
                  <Label htmlFor="recovery-enabled">Activer la récupération automatique</Label>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recovery-min-age">Délai min. (heures)</Label>
                    <Input
                      id="recovery-min-age"
                      type="number"
                      min={1}
                      value={recoveryDraft.minAgeHours}
                      onChange={(e) =>
                        setRecoveryDraft((s) =>
                          s ? { ...s, minAgeHours: Math.max(1, Number(e.target.value) || 1) } : s,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recovery-max">Max e-mails / panier</Label>
                    <Input
                      id="recovery-max"
                      type="number"
                      min={1}
                      value={recoveryDraft.maxEmailsPerCart}
                      onChange={(e) =>
                        setRecoveryDraft((s) =>
                          s
                            ? { ...s, maxEmailsPerCart: Math.max(1, Number(e.target.value) || 1) }
                            : s,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recovery-gap">Entre deux relances (h)</Label>
                    <Input
                      id="recovery-gap"
                      type="number"
                      min={1}
                      value={recoveryDraft.minHoursBetweenEmails}
                      onChange={(e) =>
                        setRecoveryDraft((s) =>
                          s
                            ? {
                                ...s,
                                minHoursBetweenEmails: Math.max(1, Number(e.target.value) || 1),
                              }
                            : s,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="recovery-promo">Code promo (optionnel)</Label>
                  <Input
                    id="recovery-promo"
                    placeholder="ex. WELCOME10"
                    value={recoveryDraft.promoCode}
                    onChange={(e) =>
                      setRecoveryDraft((s) => (s ? { ...s, promoCode: e.target.value } : s))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Affiché dans l&apos;e-mail de relance si renseigné.
                  </p>
                </div>

                <div className="space-y-4 border-t border-border pt-4">
                  <p className="text-sm font-medium">Texte de l&apos;e-mail de relance</p>
                  <p className="text-xs text-muted-foreground">
                    Les produits du panier et le lien de paiement sont ajoutés automatiquement.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email-subject">Objet de l&apos;e-mail</Label>
                    <Input
                      id="recovery-email-subject"
                      value={recoveryDraft.emailSubject}
                      onChange={(e) =>
                        setRecoveryDraft((s) => (s ? { ...s, emailSubject: e.target.value } : s))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email-title">Titre dans l&apos;e-mail</Label>
                    <Input
                      id="recovery-email-title"
                      value={recoveryDraft.emailTitle}
                      onChange={(e) =>
                        setRecoveryDraft((s) => (s ? { ...s, emailTitle: e.target.value } : s))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email-intro">Message principal</Label>
                    <Textarea
                      id="recovery-email-intro"
                      rows={4}
                      value={recoveryDraft.emailIntro}
                      onChange={(e) =>
                        setRecoveryDraft((s) => (s ? { ...s, emailIntro: e.target.value } : s))
                      }
                    />
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="recovery-email-button">Texte du bouton</Label>
                    <Input
                      id="recovery-email-button"
                      value={recoveryDraft.emailButtonLabel}
                      onChange={(e) =>
                        setRecoveryDraft((s) =>
                          s ? { ...s, emailButtonLabel: e.target.value } : s,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email-closing">Message de fin</Label>
                    <Textarea
                      id="recovery-email-closing"
                      rows={3}
                      value={recoveryDraft.emailClosing}
                      onChange={(e) =>
                        setRecoveryDraft((s) => (s ? { ...s, emailClosing: e.target.value } : s))
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleSaveRecoverySettings}
                    disabled={savingRecovery || !recoveryDirty}
                  >
                    {savingRecovery ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRunRecoveryNow}
                    disabled={runningRecovery}
                  >
                    {runningRecovery ? "Exécution…" : "Lancer maintenant"}
                  </Button>
                </div>
              </CardContent>
            </Card>
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
