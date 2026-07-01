import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminInventory,
  updateInventoryQuantity,
  type AdminInventoryResponse,
  type InventoryRow,
} from "@/lib/admin-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Bingin Diaries Admin" }] }),
  component: AdminInventoryPage,
});

function AdminInventoryPage() {
  const [data, setData] = useState<AdminInventoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, { france: string; bali: string }>>({});

  const load = useCallback(async () => {
    try {
      const inv = await fetchAdminInventory();
      setData(inv);
      setError(null);
      const next: Record<string, { france: string; bali: string }> = {};
      for (const row of inv.items) {
        next[row.variantId] = { france: String(row.france), bali: String(row.bali) };
      }
      setDraft(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const collections = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, string>();
    for (const row of data.items) {
      if (row.collectionSlug) map.set(row.collectionSlug, row.collectionName || row.collectionSlug);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    let list = data.items;
    if (collectionFilter) {
      list = list.filter((r) => r.collectionSlug === collectionFilter);
    }
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.productSlug.toLowerCase().includes(q) ||
        r.variantTitle.toLowerCase().includes(q) ||
        (r.collectionName?.toLowerCase().includes(q) ?? false) ||
        (r.sku?.toLowerCase().includes(q) ?? false),
    );
  }, [data, filter, collectionFilter]);

  const saveCell = async (row: InventoryRow, warehouseId: "france" | "bali") => {
    const key = row.variantId;
    const raw = draft[key]?.[warehouseId];
    const quantity = Number(raw);
    if (!Number.isFinite(quantity) || quantity < 0) {
      setError("Quantity must be a non-negative number");
      return;
    }
    const current = warehouseId === "france" ? row.france : row.bali;
    if (quantity === current) return;

    setSaving(`${key}-${warehouseId}`);
    setError(null);
    try {
      await updateInventoryQuantity({ variantId: key, warehouseId, quantity });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-eyebrow text-muted-foreground">Sprint S2</p>
        <h2 className="font-display text-4xl mt-2">France / Bali inventory</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Quantités Paris / Bali par variante. Filtrez par collection pour vérifier qu&apos;une ligne est complète
          avant mise en ligne (photo + stock + statut publié dans Products).
        </p>
      </div>

      {data && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">Paris (France)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl">{data.totals.france}</p>
              <p className="text-xs text-muted-foreground mt-1">available units</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">Bali (Indonesia)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl">{data.totals.bali}</p>
              <p className="text-xs text-muted-foreground mt-1">available units</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">Low stock alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl">{data.lowStockCount}</p>
              <p className="text-xs text-muted-foreground mt-1">variants ≤ 3 in either warehouse</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end flex-wrap">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Collection</Label>
          <Select value={collectionFilter || "all"} onValueChange={(v) => setCollectionFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[min(100%,16rem)]">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les collections</SelectItem>
              {collections.map(([slug, name]) => (
                <SelectItem key={slug} value={slug}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex-1 min-w-[12rem]">
          <Label className="text-xs text-muted-foreground">Recherche</Label>
          <Input
            placeholder="Produit, slug, variante, SKU…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Button variant="outline" onClick={load} disabled={!!saving} className="sm:mb-0.5">
          Refresh
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!data && !error && <p className="text-muted-foreground">Loading inventory…</p>}

      {data && (
        <div className="border border-border rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Product</th>
                <th className="p-3 font-medium">Variant</th>
                <th className="p-3 font-medium w-28">Paris</th>
                <th className="p-3 font-medium w-28">Bali</th>
                <th className="p-3 font-medium w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.variantId} className="border-t border-border">
                  <td className="p-3">
                    <p className="font-medium">{row.productName}</p>
                    <p className="text-xs text-muted-foreground">{row.productSlug}</p>
                  </td>
                  <td className="p-3">
                    <p>{row.variantTitle}</p>
                    {row.isDefault && (
                      <span className="text-xs text-muted-foreground">default</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min={0}
                      className="h-9"
                      value={draft[row.variantId]?.france ?? ""}
                      disabled={saving === `${row.variantId}-france`}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [row.variantId]: { ...d[row.variantId], france: e.target.value },
                        }))
                      }
                      onBlur={() => saveCell(row, "france")}
                    />
                    {row.franceReserved > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">reserved {row.franceReserved}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min={0}
                      className="h-9"
                      value={draft[row.variantId]?.bali ?? ""}
                      disabled={saving === `${row.variantId}-bali`}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [row.variantId]: { ...d[row.variantId], bali: e.target.value },
                        }))
                      }
                      onBlur={() => saveCell(row, "bali")}
                    />
                    {row.baliReserved > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">reserved {row.baliReserved}</p>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground capitalize">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
