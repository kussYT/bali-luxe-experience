import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminCollections,
  fetchAdminCatalog,
  fetchCollectionProducts,
  patchCollectionProducts,
  reorderAdminCollections,
  updateAdminCollection,
} from "@/lib/admin-api";
import type { AdminCollectionMeta } from "@/lib/content-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

function CollectionProductsPanel({ slug }: { slug: string }) {
  const [products, setProducts] = useState<{ slug: string; name: string; isPrimary: boolean }[]>([]);
  const [catalog, setCatalog] = useState<{ slug: string; name: string }[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchCollectionProducts(slug), fetchAdminCatalog()])
      .then(([res, cat]) => {
        setProducts(res.products);
        setCatalog(cat.products.map((p) => ({ slug: p.slug, name: p.name })));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load products"))
      .finally(() => setLoading(false));
  }, [slug]);

  const suggestions = useMemo(() => {
    const inCollection = new Set(products.map((p) => p.slug));
    const needle = query.trim().toLowerCase();
    return catalog
      .filter((p) => !inCollection.has(p.slug))
      .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.slug.includes(needle))
      .slice(0, 8);
  }, [catalog, products, query]);

  async function addProduct(productSlug: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await patchCollectionProducts(slug, { add: [productSlug] });
      setProducts(res.products);
      setQuery("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(productSlug: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await patchCollectionProducts(slug, { remove: [productSlug] });
      setProducts(res.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Chargement des produits…</p>;

  return (
    <div className="sm:col-span-2 space-y-3 border-t border-border pt-4">
      <p className="text-sm font-medium">Produits dans cette collection</p>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <ul className="space-y-2">
        {products.map((p) => (
          <li key={p.slug} className="flex items-center justify-between gap-3 text-sm border border-border px-3 py-2">
            <div className="min-w-0">
              <Link to="/admin/products/$slug" params={{ slug: p.slug }} className="link-underline truncate block">
                {p.name}
              </Link>
              <p className="text-xs text-muted-foreground">{p.slug}{p.isPrimary ? " · collection principale" : ""}</p>
            </div>
            <Button type="button" variant="outline" size="icon" className="size-8 shrink-0" onClick={() => removeProduct(p.slug)} disabled={saving}>
              <X className="size-4" />
            </Button>
          </li>
        ))}
        {products.length === 0 && <p className="text-sm text-muted-foreground">Aucun produit dans cette collection.</p>}
      </ul>
      <div className="space-y-2">
        <Label>Ajouter un produit</Label>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou slug…"
        />
        {query.trim() && suggestions.length > 0 && (
          <ul className="border border-border divide-y divide-border">
            {suggestions.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => addProduct(p.slug)}
                  disabled={saving}
                >
                  {p.name} <span className="text-muted-foreground">({p.slug})</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/collections/")({
  head: () => ({ meta: [{ title: "Collections — Bingin Diaries Admin" }] }),
  component: AdminCollectionsPage,
});

function AdminCollectionsPage() {
  const [collections, setCollections] = useState<AdminCollectionMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function sortList(list: AdminCollectionMeta[]) {
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  function renumberOrders(list: AdminCollectionMeta[]) {
    return list.map((c, i) => ({ ...c, sortOrder: (i + 1) * 10 }));
  }

  async function persistOrder(list: AdminCollectionMeta[]) {
    const ordered = renumberOrders(sortList(list));
    setSavingOrder(true);
    setError(null);
    try {
      const res = await reorderAdminCollections(
        ordered.map((c) => ({ slug: c.slug, sortOrder: c.sortOrder })),
      );
      setCollections(sortList(res.collections));
      setMessage("Ordre des collections enregistré.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'enregistrer l'ordre");
    } finally {
      setSavingOrder(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetchAdminCollections();
      setCollections(sortList(res.collections));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load collections");
    }
  }

  async function handleSave(col: AdminCollectionMeta) {
    setSavingSlug(col.slug);
    setMessage(null);
    setError(null);
    try {
      const res = await updateAdminCollection(col.slug, {
        name: col.name,
        season: col.season,
        description: col.description,
        heroImage: col.heroImage,
        sortOrder: col.sortOrder,
        hidden: col.hidden,
      });
      setCollections((prev) => sortList(prev.map((c) => (c.slug === col.slug ? res.collection : c))));
      setMessage(`Collection « ${col.name} » enregistrée.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingSlug(null);
    }
  }

  function patch(slug: string, patch: Partial<AdminCollectionMeta>) {
    setCollections((prev) => prev.map((c) => (c.slug === slug ? { ...c, ...patch } : c)));
  }

  async function move(slug: string, direction: -1 | 1) {
    const sorted = sortList(collections);
    const index = sorted.findIndex((c) => c.slug === slug);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[target]] = [next[target], next[index]];
    setCollections(renumberOrders(next));
    await persistOrder(next);
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">Collections</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Ordre d&apos;affichage, visibilité boutique et métadonnées. Les flèches enregistrent l&apos;ordre
          immédiatement. Vous pouvez aussi saisir un numéro puis cliquer Enregistrer sur la carte.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={savingOrder || collections.length === 0}
          onClick={() => persistOrder(collections)}
        >
          {savingOrder ? "Enregistrement…" : "Enregistrer tout l'ordre"}
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="space-y-6">
        {collections.map((col, index) => (
          <Card key={col.slug} className={col.hidden ? "opacity-75" : ""}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle className="text-lg flex flex-wrap items-baseline gap-2">
                  {col.name}
                  {col.hidden && (
                    <span className="text-xs font-normal uppercase tracking-wider text-amber-700">Masquée</span>
                  )}
                  <span className="text-sm font-normal text-muted-foreground">
                    {col.productCount} produit{col.productCount !== 1 ? "s" : ""} · ordre {col.sortOrder}
                  </span>
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="outline" size="icon" className="size-8" disabled={index === 0} onClick={() => move(col.slug, -1)} aria-label="Monter">
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={index === collections.length - 1}
                    onClick={() => move(col.slug, 1)}
                    aria-label="Descendre"
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex items-center gap-3">
                <Switch checked={!col.hidden} onCheckedChange={(v) => patch(col.slug, { hidden: !v })} />
                <Label>Visible dans la boutique</Label>
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={col.name} onChange={(e) => patch(col.slug, { name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Saison</Label>
                <Input value={col.season} onChange={(e) => patch(col.slug, { season: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ordre d&apos;affichage (nombre)</Label>
                <Input
                  type="number"
                  value={col.sortOrder}
                  onChange={(e) => patch(col.slug, { sortOrder: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Image hero (URL)</Label>
                <Input value={col.heroImage} onChange={(e) => patch(col.slug, { heroImage: e.target.value })} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={col.description}
                  onChange={(e) => patch(col.slug, { description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="button" onClick={() => handleSave(col)} disabled={savingSlug === col.slug}>
                  {savingSlug === col.slug ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
              <CollectionProductsPanel slug={col.slug} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
