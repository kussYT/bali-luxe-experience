import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminCustomersExportUrl,
  adminCustomersBrevoExportUrl,
  fetchAdminCatalog,
  fetchAdminCustomers,
  type AdminCustomer,
} from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/catalog-types";

export const Route = createFileRoute("/admin/customers/")({
  head: () => ({ meta: [{ title: "Clients — Bingin Diaries Admin" }] }),
  component: AdminCustomersPage,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [stats, setStats] = useState<{ total: number; withWishlist: number; totalWishlistItems: number } | null>(
    null,
  );
  const [productsBySlug, setProductsBySlug] = useState<Record<string, Product>>({});
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [emailQuery, setEmailQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(() => {
    fetchAdminCustomers(wishlistOnly)
      .then((res) => {
        setCustomers(res.customers);
        setStats(res.stats);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load customers"));
  }, [wishlistOnly]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    fetchAdminCatalog()
      .then((catalog) => {
        const map: Record<string, Product> = {};
        for (const product of catalog.products) map[product.slug] = product;
        setProductsBySlug(map);
      })
      .catch(() => {});
  }, []);

  const productLabel = useMemo(
    () => (slug: string) => productsBySlug[slug]?.name || slug,
    [productsBySlug],
  );

  const filteredCustomers = useMemo(() => {
    const q = emailQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.email.toLowerCase().includes(q));
  }, [customers, emailQuery]);

  if (!stats && !error) {
    return <p className="text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-muted-foreground">Clients</p>
          <h2 className="font-display text-4xl mt-2">Comptes &amp; wishlists</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Clients connectés via magic link — wishlists synchronisées pour relances et codes promo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href={adminCustomersExportUrl(wishlistOnly)} download>
              Export CSV
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={adminCustomersBrevoExportUrl(wishlistOnly)} download>
              Export Brevo
            </a>
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {stats && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Comptes", value: stats.total },
            { label: "Avec wishlist", value: stats.withWishlist },
            { label: "Articles en wishlist", value: stats.totalWishlistItems },
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
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant={wishlistOnly ? "outline" : "default"} size="sm" onClick={() => setWishlistOnly(false)}>
          Tous les comptes
        </Button>
        <Button variant={wishlistOnly ? "default" : "outline"} size="sm" onClick={() => setWishlistOnly(true)}>
          Wishlist non vide
        </Button>
        <Input
          className="max-w-xs"
          placeholder="Filtrer par e-mail…"
          value={emailQuery}
          onChange={(e) => setEmailQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-normal">E-mail</th>
                <th className="p-3 font-normal">Wishlist</th>
                <th className="p-3 font-normal">Articles</th>
                <th className="p-3 font-normal">Commandes</th>
                <th className="p-3 font-normal">Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border align-top">
                    <td className="p-3 whitespace-nowrap">{customer.email}</td>
                    <td className="p-3">
                      {customer.wishlist.length ? (
                        <ul className="space-y-1">
                          {customer.wishlist.map((slug) => (
                            <li key={slug}>
                              <Link
                                to="/product/$slug"
                                params={{ slug }}
                                className="link-underline"
                                target="_blank"
                              >
                                {productLabel(slug)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">{customer.wishlist.length}</td>
                    <td className="p-3">{customer.orderCount}</td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">{formatDate(customer.updatedAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Aucun compte client pour l&apos;instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground max-w-2xl">
        Seuls les clients ayant confirmé leur e-mail (magic link) apparaissent ici. Les visiteurs non connectés
        gardent une wishlist locale dans leur navigateur jusqu&apos;à création de compte.
        {" "}
        <strong>Export Brevo</strong> : CSV séparateur point-virgule — créez d&apos;abord les attributs contact{" "}
        <code className="text-[0.65rem]">WISHLIST_SLUGS</code>,{" "}
        <code className="text-[0.65rem]">WISHLIST_PRODUCTS</code>,{" "}
        <code className="text-[0.65rem]">WISHLIST_COUNT</code>,{" "}
        <code className="text-[0.65rem]">PAID_ORDERS</code>,{" "}
        <code className="text-[0.65rem]">LAST_ACTIVE</code> dans Brevo, puis importez le fichier.
      </p>
    </div>
  );
}
