import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { fetchAdminCatalog, reorderAdminProducts } from "@/lib/admin-api";
import type { Product } from "@/lib/catalog-types";
import { sortProductsForDisplay } from "@/lib/sort-products";
import { useCatalog } from "@/lib/catalog-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/admin/products/order")({
  head: () => ({ meta: [{ title: "Ordre boutique — Admin" }] }),
  component: AdminProductOrderPage,
});

function AdminProductOrderPage() {
  const { refresh } = useCatalog();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState("");

  function renumber(list: Product[]) {
    return list.map((p, i) => ({ ...p, sortOrder: (i + 1) * 10 }));
  }

  function applyLocalReorder(next: Product[]) {
    setProducts(renumber(next));
    setDirty(true);
    setMessage("Ordre modifié — cliquez « Enregistrer tout l'ordre » pour publier sur le site.");
  }

  async function persistOrder(list: Product[]) {
    const ordered = renumber(sortProductsForDisplay(list));
    setSaving(true);
    setError(null);
    try {
      const res = await reorderAdminProducts(
        ordered.map((p) => ({ slug: p.slug, sortOrder: p.sortOrder ?? 0 })),
      );
      setProducts(sortProductsForDisplay(res.catalog.products));
      await refresh();
      setDirty(false);
      setMessage("Ordre boutique enregistré (Shop All et grilles collection).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'enregistrer l'ordre");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    fetchAdminCatalog()
      .then((catalog) => setProducts(sortProductsForDisplay(catalog.products)))
      .catch((e) => setError(e instanceof Error ? e.message : "Chargement impossible"));
  }, []);

  const sorted = useMemo(() => sortProductsForDisplay(products), [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        String(p.sortOrder ?? "").includes(q),
    );
  }, [sorted, query]);

  function move(slug: string, direction: -1 | 1) {
    const index = sorted.findIndex((p) => p.slug === slug);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[target]] = [next[target], next[index]];
    applyLocalReorder(next);
  }

  function moveToPosition(slug: string, position: number) {
    const index = sorted.findIndex((p) => p.slug === slug);
    if (index < 0) return;
    const target = Math.max(1, Math.min(sorted.length, Math.round(position))) - 1;
    if (index === target) return;
    const next = [...sorted];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    applyLocalReorder(next);
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-muted-foreground">Catalogue</p>
          <h2 className="font-display text-4xl mt-2">Ordre boutique</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Définissez l&apos;ordre d&apos;affichage dans Shop All et les grilles collection. Cherchez un produit,
            placez-le en position <strong>1</strong> pour le mettre en tête, puis enregistrez. Seuls les produits{" "}
            <strong>publiés</strong> sont visibles côté client.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/products">Retour aux produits</Link>
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="flex flex-wrap gap-3 items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom, slug ou n° d'ordre…"
          className="max-w-sm"
        />
        <Button
          type="button"
          disabled={saving || sorted.length === 0 || !dirty}
          onClick={() => persistOrder(sorted)}
        >
          {saving ? "Enregistrement…" : "Enregistrer tout l'ordre"}
        </Button>
        {query.trim() && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} sur {sorted.length}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((product) => {
          const index = sorted.findIndex((p) => p.slug === product.slug);
          return (
            <ProductOrderRow
              key={product.slug}
              product={product}
              position={index + 1}
              total={sorted.length}
              saving={saving}
              onMove={(dir) => move(product.slug, dir)}
              onMoveToPosition={(pos) => moveToPosition(product.slug, pos)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ProductOrderRow({
  product,
  position,
  total,
  saving,
  onMove,
  onMoveToPosition,
}: {
  product: Product;
  position: number;
  total: number;
  saving: boolean;
  onMove: (direction: -1 | 1) => void;
  onMoveToPosition: (position: number) => void;
}) {
  const [positionInput, setPositionInput] = useState(String(position));

  useEffect(() => {
    setPositionInput(String(position));
  }, [position]);

  function applyPosition() {
    const n = Number(positionInput);
    if (!Number.isFinite(n) || n < 1) return;
    onMoveToPosition(n);
  }

  return (
    <Card className={product.status === "draft" ? "opacity-70" : ""}>
      <CardHeader className="py-4">
        <div className="flex flex-wrap items-center gap-4">
          <img src={product.image} alt="" className="size-14 object-cover bg-sand shrink-0" />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium truncate">{product.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {product.collection}
              {product.status === "draft" ? " · brouillon" : ""}
              {" · position "}
              {position}/{total}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 text-xs"
              disabled={position === 1 || saving}
              onClick={() => onMoveToPosition(1)}
            >
              En tête
            </Button>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={1}
                max={total}
                value={positionInput}
                onChange={(e) => setPositionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyPosition();
                  }
                }}
                className="h-8 w-16 text-center text-xs px-1"
                aria-label="Position souhaitée"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={saving}
                onClick={applyPosition}
              >
                OK
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={position === 1 || saving}
              onClick={() => onMove(-1)}
              aria-label="Monter d'une place"
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={position === total || saving}
              onClick={() => onMove(1)}
              aria-label="Descendre d'une place"
            >
              <ChevronDown className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {product.story && (
        <CardContent className="pt-0 pb-4">
          <p className="text-xs text-muted-foreground line-clamp-2">{product.story}</p>
        </CardContent>
      )}
    </Card>
  );
}
