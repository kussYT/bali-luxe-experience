import { useMemo, useState } from "react";
import type { CountryShippingRow } from "@/lib/country-shipping-types";
import { SHIPPING_CONTINENTS } from "@/data/shipping-continents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/admin/MoneyInput";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Props = {
  rows: CountryShippingRow[];
  onChange: (rows: CountryShippingRow[]) => void;
};

function currencySuffix(currency: CountryShippingRow["currency"]) {
  if (currency === "EUR") return "€";
  if (currency === "IDR") return "Rp";
  return "$";
}

function continentRows(rows: CountryShippingRow[], continentId: string) {
  const group = SHIPPING_CONTINENTS.find((c) => c.id === continentId);
  if (!group) return [];
  const set = new Set(group.countryCodes);
  return rows.filter((r) => set.has(r.code));
}

function ContinentBlock({
  continentId,
  label,
  rows,
  onChange,
}: {
  continentId: string;
  label: string;
  rows: CountryShippingRow[];
  onChange: (rows: CountryShippingRow[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const subset = continentRows(rows, continentId);
  const enabledCount = subset.filter((r) => r.enabled).length;
  const allEnabled = subset.length > 0 && enabledCount === subset.length;
  const someEnabled = enabledCount > 0 && !allEnabled;

  function patchCodes(codes: string[], patch: Partial<CountryShippingRow>) {
    const set = new Set(codes);
    onChange(rows.map((r) => (set.has(r.code) ? { ...r, ...patch } : r)));
  }

  function setWarehouse(codes: string[], warehouse: "france" | "bali") {
    patchCodes(codes, { warehouse });
  }

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 bg-muted/40 px-4 py-3 border-b border-border">
        <button
          type="button"
          className="flex items-center gap-2 text-left font-medium"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-muted-foreground text-sm w-4">{open ? "▾" : "▸"}</span>
          {label}
          <span className="text-xs text-muted-foreground font-normal">
            ({enabledCount}/{subset.length} actifs)
          </span>
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={allEnabled ? true : someEnabled ? "indeterminate" : false}
              onCheckedChange={(checked) =>
                patchCodes(
                  subset.map((r) => r.code),
                  { enabled: checked === true },
                )
              }
            />
            Tout le continent
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setWarehouse(subset.map((r) => r.code), "france")}
          >
            Paris
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setWarehouse(subset.map((r) => r.code), "bali")}
          >
            Bali
          </Button>
        </div>
      </div>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left font-normal px-4 py-2 w-10">Actif</th>
                <th className="text-left font-normal px-4 py-2">Pays</th>
                <th className="text-left font-normal px-4 py-2 w-40">Entrepôt</th>
                <th className="text-left font-normal px-4 py-2 w-36">Frais de port</th>
              </tr>
            </thead>
            <tbody>
              {subset.map((row) => (
                <tr
                  key={row.code}
                  className={cn("border-b border-border/60", !row.enabled && "opacity-50")}
                >
                  <td className="px-4 py-2">
                    <Checkbox
                      checked={row.enabled}
                      onCheckedChange={(checked) =>
                        onChange(
                          rows.map((r) =>
                            r.code === row.code ? { ...r, enabled: checked === true } : r,
                          ),
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{row.code}</span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="inline-flex rounded-sm border border-border overflow-hidden">
                      <button
                        type="button"
                        className={cn(
                          "px-3 py-1 text-xs transition-colors",
                          row.warehouse === "france"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted",
                        )}
                        onClick={() =>
                          onChange(
                            rows.map((r) =>
                              r.code === row.code ? { ...r, warehouse: "france" } : r,
                            ),
                          )
                        }
                      >
                        Paris
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "px-3 py-1 text-xs border-l border-border transition-colors",
                          row.warehouse === "bali"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted",
                        )}
                        onClick={() =>
                          onChange(
                            rows.map((r) =>
                              r.code === row.code ? { ...r, warehouse: "bali" } : r,
                            ),
                          )
                        }
                      >
                        Bali
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <MoneyInput
                        className="h-8 w-24"
                        value={row.shippingPrice}
                        disabled={!row.enabled}
                        onChange={(n) =>
                          onChange(
                            rows.map((r) =>
                              r.code === row.code ? { ...r, shippingPrice: n ?? 0 } : r,
                            ),
                          )
                        }
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {currencySuffix(row.currency)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function CountryShippingMatrix({ rows, onChange }: Props) {
  const stats = useMemo(() => {
    const enabled = rows.filter((r) => r.enabled);
    return {
      enabled: enabled.length,
      paris: enabled.filter((r) => r.warehouse === "france").length,
      bali: enabled.filter((r) => r.warehouse === "bali").length,
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground">{stats.enabled}</strong> pays actifs
        </span>
        <span>
          Paris : <strong className="text-foreground">{stats.paris}</strong>
        </span>
        <span>
          Bali : <strong className="text-foreground">{stats.bali}</strong>
        </span>
      </div>

      {SHIPPING_CONTINENTS.map((continent) => (
        <ContinentBlock
          key={continent.id}
          continentId={continent.id}
          label={continent.label}
          rows={rows}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

export function rowsToConfig(rows: CountryShippingRow[]) {
  const countries: Record<
    string,
    { enabled: boolean; warehouse: "france" | "bali"; shippingPrice: number }
  > = {};
  for (const row of rows) {
    countries[row.code] = {
      enabled: row.enabled,
      warehouse: row.warehouse,
      shippingPrice: row.shippingPrice,
    };
  }
  return { countries };
}
