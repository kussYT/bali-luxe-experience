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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Bingin Diaries Admin" }] }),
  component: AdminInventoryPage,
});

function AdminInventoryPage() {
  const [data, setData] = useState<AdminInventoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
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

  const rows = useMemo(() => {
    if (!data) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return data.items;
    return data.items.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.productSlug.toLowerCase().includes(q) ||
        r.variantTitle.toLowerCase().includes(q) ||
        (r.sku?.toLowerCase().includes(q) ?? false),
    );
  }, [data, filter]);

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
          Edit quantities per variant and warehouse. Each change is recorded in{" "}
          <code className="text-xs">inventory_movements</code>.
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

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Input
          placeholder="Search product, slug, variant, SKU…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-md"
        />
        <Button variant="outline" onClick={load} disabled={!!saving}>
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
