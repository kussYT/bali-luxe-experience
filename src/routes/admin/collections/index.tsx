import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminCollections, updateAdminCollection } from "@/lib/admin-api";
import type { AdminCollectionMeta } from "@/lib/content-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/admin/collections/")({
  head: () => ({ meta: [{ title: "Collections — Bingin Diaries Admin" }] }),
  component: AdminCollectionsPage,
});

function AdminCollectionsPage() {
  const [collections, setCollections] = useState<AdminCollectionMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetchAdminCollections();
      setCollections(
        [...res.collections].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
      );
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
      setCollections((prev) =>
        [...prev.map((c) => (c.slug === col.slug ? res.collection : c))].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        ),
      );
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

  function move(slug: string, direction: -1 | 1) {
    const sorted = [...collections].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((c) => c.slug === slug);
    const swap = sorted[index + direction];
    if (!swap || index < 0) return;
    const current = sorted[index];
    patch(current.slug, { sortOrder: swap.sortOrder });
    patch(swap.slug, { sortOrder: current.sortOrder });
    setCollections((prev) =>
      [...prev].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">Collections</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Ordre d&apos;affichage, visibilité boutique et métadonnées. Les produits restent dans Products.
        </p>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
