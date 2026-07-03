import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { deleteProduct, fetchAdminCatalog } from "@/lib/admin-api";
import type { Catalog, Product } from "@/lib/catalog-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCatalog } from "@/lib/catalog-context";
import { formatMoneyAmount } from "@/lib/format-money";

export const Route = createFileRoute("/admin/products/")({
  head: () => ({ meta: [{ title: "Products — Admin" }] }),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const { refresh: refreshPublic } = useCatalog();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = () => fetchAdminCatalog().then(setCatalog);

  useEffect(() => {
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    const products = catalog?.products ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((p) => {
      const haystack = [p.name, p.slug, p.collection, p.subcategory, p.category, p.productType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [catalog?.products, query]);

  const remove = async (product: Product) => {
    await deleteProduct(product.slug);
    setMessage(`Deleted “${product.name}”`);
    await load();
    await refreshPublic();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-muted-foreground">Catalog</p>
          <h2 className="font-display text-4xl mt-2">Products</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/admin/products/new">Add product</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/products/order">Ordre boutique (Shop All)</Link>
          </Button>
        </div>
      </div>

      {message && (
        <p className="text-sm bg-muted border border-border px-4 py-3" role="status">
          {message}
        </p>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom, slug, collection…"
          className="pl-9"
          aria-label="Rechercher des produits"
        />
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Stock</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.slug} className="border-t border-border">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="size-12 object-cover bg-sand" />
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">{p.collection}</td>
                <td className="p-3 font-mono">
                  {formatMoneyAmount(p.priceEUR, "EUR", "fr")}
                  {p.onSale && p.compareAtEUR != null && (
                    <span className="text-muted-foreground line-through ml-2">
                      {formatMoneyAmount(p.compareAtEUR, "EUR", "fr")}
                    </span>
                  )}
                </td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 capitalize">
                  {p.status}
                  {p.featured && <span className="ml-2 text-xs text-clay">★</span>}
                </td>
                <td className="p-3 text-right space-x-2 whitespace-nowrap">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/products/$slug" params={{ slug: p.slug }}>
                      Edit
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete product?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove “{p.name}” from the shop. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(p)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">Aucun produit ne correspond à cette recherche.</p>
        )}
      </div>
    </div>
  );
}


