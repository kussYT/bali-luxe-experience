import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminOrder, shipAdminOrder, type AdminOrder } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/orders/$orderId")({
  head: () => ({ meta: [{ title: "Order detail — Bingin Diaries Admin" }] }),
  component: AdminOrderDetailPage,
});

function warehouseLabel(id: string | null) {
  if (id === "france") return "Paris (France)";
  if (id === "bali") return "Bali (Indonesia)";
  return "—";
}

function AdminOrderDetailPage() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shipping, setShipping] = useState(false);

  useEffect(() => {
    fetchAdminOrder(orderId)
      .then((res) => setOrder(res.order))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load order"));
  }, [orderId]);

  async function handleShip() {
    if (!order || order.status !== "paid") return;
    setShipping(true);
    setError(null);
    try {
      const res = await shipAdminOrder(orderId);
      setOrder(res.order);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark as shipped");
    } finally {
      setShipping(false);
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error}</p>
        <Link to="/admin/orders" className="link-underline">
          Back to orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return <p className="text-muted-foreground">Loading order…</p>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link to="/admin/orders" className="text-sm link-underline text-muted-foreground">
          ← Orders
        </Link>
        <h2 className="font-display text-4xl mt-4">Order detail</h2>
        <p className="text-xs text-muted-foreground mt-2 font-mono">{order.id}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl capitalize">{order.status}</p>
            {order.paidAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Paid {new Date(order.paidAt).toLocaleString()}
              </p>
            )}
            {order.shippedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Shipped {new Date(order.shippedAt).toLocaleString()}
              </p>
            )}
            {order.status === "paid" && (
              <Button className="mt-4" size="sm" onClick={handleShip} disabled={shipping}>
                {shipping ? "Sending…" : "Mark as shipped"}
              </Button>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Fulfillment</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Checkout country:</span>{" "}
              {order.countryCode || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Shipping country:</span>{" "}
              {order.shippingCountryCode || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Warehouse:</span>{" "}
              {warehouseLabel(order.fulfillmentWarehouse)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 border-b border-border pb-3 last:border-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground">
                    {item.variantTitle} · {item.slug} · qty {item.qty}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ships from {warehouseLabel(item.warehouseId)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Stripe</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1 font-mono text-xs break-all">
          <p>Session: {order.stripeSessionId || "—"}</p>
          <p>Email: {order.customerEmail || "—"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
