import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  fetchAdminOrder,
  updateAdminOrder,
  resendOrderConfirmation,
  type AdminOrder,
} from "@/lib/admin-api";
import { ORDER_STATUS_LABELS, ORDER_STATUS_OPTIONS } from "@/lib/order-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelBadge } from "@/components/admin/ChannelBadge";

export const Route = createFileRoute("/admin/orders/$orderId")({
  head: () => ({ meta: [{ title: "Order detail — Bingin Diaries Admin" }] }),
  component: AdminOrderDetailPage,
});

function warehouseLabel(id: string | null) {
  if (id === "france") return "Paris (France)";
  if (id === "bali") return "Bali (Indonesia)";
  return "—";
}

const FULFILL_FROM = new Set(["paid", "processing", "on_hold"]);

function AdminOrderDetailPage() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [status, setStatus] = useState("paid");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [refundAmountCents, setRefundAmountCents] = useState("");
  const [notes, setNotes] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    fetchAdminOrder(orderId)
      .then((res) => {
        setOrder(res.order);
        syncForm(res.order);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load order"));
  }, [orderId]);

  function syncForm(o: AdminOrder) {
    setStatus(o.status);
    setTrackingNumber(o.trackingNumber || "");
    setTrackingCarrier(o.trackingCarrier || "");
    setTrackingUrl(o.trackingUrl || "");
    setRefundAmountCents(o.refundAmountCents != null ? String(o.refundAmountCents) : "");
    setNotes(o.notes || "");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await updateAdminOrder(orderId, {
        status,
        trackingNumber,
        trackingCarrier,
        trackingUrl,
        notifyCustomer: status === "shipped" ? notifyCustomer : false,
        refundAmountCents:
          status === "partially_refunded" && refundAmountCents
            ? Number(refundAmountCents)
            : undefined,
        notes,
      });
      setOrder(res.order);
      syncForm(res.order);
      setMessage("Commande mise à jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  }

  async function handleFulfill(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await updateAdminOrder(orderId, {
        status: "shipped",
        trackingNumber,
        trackingCarrier,
        trackingUrl,
        notifyCustomer,
        notes,
      });
      setOrder(res.order);
      syncForm(res.order);
      setMessage(
        notifyCustomer
          ? "Commande traitée — email d'expédition envoyé au client."
          : "Commande traitée — aucun email envoyé.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du traitement");
    } finally {
      setSaving(false);
    }
  }

  async function handleResendConfirmation() {
    if (!order) return;
    setResending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await resendOrderConfirmation(orderId);
      setMessage(`Email de confirmation renvoyé à ${res.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec d'envoi");
    } finally {
      setResending(false);
    }
  }

  if (error && !order) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error}</p>
        <Link to="/admin/orders" className="link-underline">
          Retour aux commandes
        </Link>
      </div>
    );
  }

  if (!order) {
    return <p className="text-muted-foreground">Chargement…</p>;
  }

  const canFulfill = FULFILL_FROM.has(order.status);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link to="/admin/orders" className="text-sm link-underline text-muted-foreground">
          ← Commandes
        </Link>
        <h2 className="font-display text-4xl mt-4">Détail commande</h2>
        <p className="text-xs text-muted-foreground mt-2 font-mono">{order.id}</p>
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {error && order && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <ChannelBadge channel={order.channel || "website"} />
            </div>
            <p className="font-display text-2xl">
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </p>
            {order.paidAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Payée le {new Date(order.paidAt).toLocaleString()}
              </p>
            )}
            {order.shippedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Traitée le {new Date(order.shippedAt).toLocaleString()}
              </p>
            )}
            {order.trackingNumber && (
              <p className="text-xs text-muted-foreground mt-2">
                Suivi : {order.trackingCarrier ? `${order.trackingCarrier} — ` : ""}
                {order.trackingUrl ? (
                  <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="link-underline">
                    {order.trackingNumber}
                  </a>
                ) : (
                  order.trackingNumber
                )}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Livraison</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Pays checkout :</span> {order.countryCode || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Expédition :</span>{" "}
              {order.shippingCountryCode || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Entrepôt :</span>{" "}
              {warehouseLabel(order.fulfillmentWarehouse)}
            </p>
            <p>
              <span className="text-muted-foreground">Client :</span> {order.customerEmail || "—"}
            </p>
            {order.externalRef && (
              <p>
                <span className="text-muted-foreground">Réf. externe :</span> {order.externalRef}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {order.customerEmail && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Emails client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Destinataire : <span className="text-foreground">{order.customerEmail}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              « Marquer comme traitée » envoie l&apos;email d&apos;<strong>expédition</strong>, pas la
              confirmation de commande.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={resending}
              onClick={handleResendConfirmation}
            >
              {resending ? "Envoi…" : "Renvoyer l'email de confirmation"}
            </Button>
          </CardContent>
        </Card>
      )}

      {canFulfill && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Traiter la commande</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFulfill} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ajoutez le numéro de suivi et choisissez si le client reçoit l&apos;email
                d&apos;expédition.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fulfill-tracking">Numéro de suivi</Label>
                  <Input
                    id="fulfill-tracking"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Ex. 3S1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fulfill-carrier">Transporteur</Label>
                  <Input
                    id="fulfill-carrier"
                    value={trackingCarrier}
                    onChange={(e) => setTrackingCarrier(e.target.value)}
                    placeholder="Colissimo, DHL…"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fulfill-url">Lien de suivi (optionnel)</Label>
                <Input
                  id="fulfill-url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="rounded border-border"
                />
                Envoyer l&apos;email au client (« commande en cours d&apos;acheminement »)
              </label>
              <Button type="submit" disabled={saving}>
                {saving ? "Traitement…" : "Marquer comme traitée"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Changer le statut</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ORDER_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                  {order.status === "pending" && (
                    <SelectItem value="pending">{ORDER_STATUS_LABELS.pending}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {status === "partially_refunded" && (
              <div className="space-y-2">
                <Label htmlFor="refund-amount">Montant remboursé (centimes)</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  min={0}
                  value={refundAmountCents}
                  onChange={(e) => setRefundAmountCents(e.target.value)}
                  placeholder="Ex. 2500 pour 25,00 €"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="order-notes">Notes internes</Label>
              <Textarea
                id="order-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {status === "shipped" && !canFulfill && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="rounded border-border"
                />
                Renvoyer l&apos;email d&apos;expédition au client
              </label>
            )}

            <Button type="submit" variant="outline" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer le statut"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4 text-sm">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between gap-4 border-b border-border pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground">
                    {item.variantTitle} · {item.slug} · qté {item.qty}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expédié depuis {warehouseLabel(item.warehouseId)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
