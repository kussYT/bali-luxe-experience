import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { fetchAdminOrders, adminOrdersExportUrl, type AdminOrder } from "@/lib/admin-api";
import { orderStatusLabel } from "@/lib/order-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChannelBadge } from "@/components/admin/ChannelBadge";
import { MarketplaceOrderForm } from "@/components/admin/MarketplaceOrderForm";

export const Route = createFileRoute("/admin/orders/")({
  head: () => ({ meta: [{ title: "Orders — Bingin Diaries Admin" }] }),
  component: AdminOrdersPage,
});

const CHANNEL_FILTERS = [
  { value: "", label: "Tous" },
  { value: "website", label: "Site web" },
  { value: "wolf_badger", label: "Wolf & Badger" },
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

function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [channelFilter, setChannelFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    fetchAdminOrders(channelFilter || undefined)
      .then((res) => setOrders(res.orders))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load orders"));
  }, [channelFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const toProcessCount = orders.filter((o) =>
    ["paid", "processing", "on_hold"].includes(o.status),
  ).length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const wbCount = orders.filter((o) => o.channel === "wolf_badger").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-muted-foreground">Orders</p>
          <h2 className="font-display text-4xl mt-2">Commandes multi-canal</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Site web (Stripe) · Wolf &amp; Badger · autres marketplaces
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

      {error && <p className="text-sm text-destructive">{error}</p>}

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
    </div>
  );
}
