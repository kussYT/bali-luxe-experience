import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminOrders, adminOrdersExportUrl, type AdminOrder } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/orders/")({
  head: () => ({ meta: [{ title: "Orders — Bingin Diaries Admin" }] }),
  component: AdminOrdersPage,
});

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminOrders()
      .then((res) => setOrders(res.orders))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load orders"));
  }, []);

  const paidCount = orders.filter((o) => o.status === "paid").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-muted-foreground">Orders</p>
          <h2 className="font-display text-4xl mt-2">Orders</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Postgres · confirmation &amp; shipped emails (S4)
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href={adminOrdersExportUrl()} download>
            Export CSV
          </a>
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 max-w-2xl">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Total orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{paidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Shipped</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{shippedCount}</p>
          </CardContent>
        </Card>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="border border-border rounded-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Ship to</th>
              <th className="p-3 font-medium">Warehouse</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && !error && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No orders yet. Complete a test checkout on localhost:8080.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-border">
                <td className="p-3 whitespace-nowrap">
                  {new Date(order.createdAt).toLocaleString()}
                </td>
                <td className="p-3 capitalize">{order.status}</td>
                <td className="p-3">{order.customerEmail || "—"}</td>
                <td className="p-3">{order.shippingCountryCode || order.countryCode || "—"}</td>
                <td className="p-3">{warehouseLabel(order.fulfillmentWarehouse)}</td>
                <td className="p-3">{formatMoney(order.amountTotal, order.currency)}</td>
                <td className="p-3">
                  <Link
                    to="/admin/orders/$orderId"
                    params={{ orderId: order.id }}
                    className="link-underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
