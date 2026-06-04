import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminCatalog, fetchAdminInventory } from "@/lib/admin-api";
import type { Catalog } from "@/lib/catalog-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin dashboard — Bingin Diaries" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [stockParis, setStockParis] = useState<number | null>(null);
  const [stockBali, setStockBali] = useState<number | null>(null);
  const [lowStockWh, setLowStockWh] = useState<number | null>(null);

  useEffect(() => {
    fetchAdminCatalog().then(setCatalog).catch(console.error);
    fetchAdminInventory()
      .then((inv) => {
        setStockParis(inv.totals.france);
        setStockBali(inv.totals.bali);
        setLowStockWh(inv.lowStockCount);
      })
      .catch(() => {});
  }, []);

  const published = catalog?.products.filter((p) => p.status === "published").length ?? 0;
  const drafts = catalog?.products.filter((p) => p.status === "draft").length ?? 0;
  const onSale = catalog?.products.filter((p) => p.onSale).length ?? 0;
  const lowStock = catalog?.products.filter((p) => p.stock <= 3).length ?? 0;

  return (
    <div className="space-y-10">
      <div>
        <p className="text-eyebrow text-muted-foreground">Dashboard</p>
        <h2 className="font-display text-4xl mt-2">Store overview</h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Products", value: catalog?.productCount ?? "—" },
          { label: "Published", value: published },
          { label: "On sale", value: onSale },
          { label: "Low stock (≤3)", value: lowStock },
          { label: "Paris available", value: stockParis ?? "—" },
          { label: "Bali available", value: stockBali ?? "—" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Link to="/admin/products/new" className="link-underline w-fit">
              Add a new product
            </Link>
            <Link to="/admin/products" className="link-underline w-fit">
              Manage all products
            </Link>
            <Link to="/admin/inventory" className="link-underline w-fit">
              France / Bali inventory
            </Link>
            <Link to="/collection" className="link-underline w-fit text-muted-foreground">
              View public shop
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Content sections</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Products</strong> — {catalog?.productCount ?? 0} items ({drafts}{" "}
              drafts)
            </p>
            <p>
              <strong className="text-foreground">Categories</strong> — {catalog?.collections.length ?? 0} collections
            </p>
            <p>
              <strong className="text-foreground">Images</strong> — managed per product
            </p>
            <p>
              <strong className="text-foreground">Sales</strong> — products with a sale price appear in Sales
            </p>
            <p>
              <strong className="text-foreground">Warehouses</strong> —{" "}
              {lowStockWh != null ? `${lowStockWh} low-stock variant alerts` : "load inventory for totals"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


