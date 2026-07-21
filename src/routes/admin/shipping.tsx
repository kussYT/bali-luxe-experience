import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminCountryShipping, updateAdminCountryShipping } from "@/lib/admin-api";
import type { CountryShippingRow } from "@/lib/country-shipping-types";
import { CountryShippingMatrix, rowsToConfig } from "@/components/admin/CountryShippingMatrix";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/shipping")({
  head: () => ({ meta: [{ title: "Livraison — Bingin Diaries Admin" }] }),
  component: AdminShippingPage,
});

function AdminShippingPage() {
  const [rows, setRows] = useState<CountryShippingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminCountryShipping()
      .then((res) => setRows(res.rows))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await updateAdminCountryShipping(rowsToConfig(rows));
      setRows(res.rows);
      setMessage("Configuration enregistrée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="text-eyebrow text-muted-foreground">Logistique</p>
        <h2 className="font-display text-4xl mt-2">Livraison par pays</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Activez les pays de livraison, choisissez l&apos;entrepôt (Paris ou Bali) et définissez
          les frais de port par pays. Les montants sont en <strong>unités entières</strong> dans la
          devise du pays (ex. 8 €, 18 $, 200000 Rp).
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <CountryShippingMatrix rows={rows} onChange={setRows} />
      )}

      <Button type="button" onClick={handleSave} disabled={saving || loading}>
        {saving ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}
