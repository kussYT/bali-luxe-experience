import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  fetchAdminShipping,
  updateAdminShipping,
  type ShippingZone,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/shipping")({
  head: () => ({ meta: [{ title: "Livraison — Bingin Diaries Admin" }] }),
  component: AdminShippingPage,
});

const EMPTY_ZONE: ShippingZone = {
  id: "",
  name: "",
  countries: [],
  rates: { EUR: 0, USD: 0, IDR: 0 },
};

function AdminShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminShipping()
      .then((res) => setZones(res.settings.zones))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, []);

  function updateZone(index: number, patch: Partial<ShippingZone>) {
    setZones((prev) => prev.map((z, i) => (i === index ? { ...z, ...patch } : z)));
  }

  function addZone() {
    setZones((prev) => [
      ...prev,
      { ...EMPTY_ZONE, id: `zone-${Date.now()}`, name: "Nouvelle zone" },
    ]);
  }

  function removeZone(index: number) {
    setZones((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await updateAdminShipping(zones);
      setZones(res.settings.zones);
      setMessage("Tarifs enregistrés.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-eyebrow text-muted-foreground">Logistique</p>
        <h2 className="font-display text-4xl mt-2">Zones de livraison</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Tarifs par zone et devise (centimes pour EUR/USD, unité pour IDR). Pays = codes ISO séparés par des virgules (ex. FR, BE, CH).
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="space-y-4">
        {zones.map((zone, index) => (
          <Card key={zone.id || index}>
            <CardHeader>
              <CardTitle className="text-lg">{zone.name || "Zone"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={zone.name}
                  onChange={(e) => updateZone(index, { name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Pays (ISO)</Label>
                <Input
                  value={zone.countries.join(", ")}
                  onChange={(e) =>
                    updateZone(index, {
                      countries: e.target.value
                        .split(",")
                        .map((c) => c.trim().toUpperCase())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>EUR (centimes)</Label>
                <Input
                  type="number"
                  value={zone.rates.EUR}
                  onChange={(e) =>
                    updateZone(index, { rates: { ...zone.rates, EUR: Number(e.target.value) } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>USD (centimes)</Label>
                <Input
                  type="number"
                  value={zone.rates.USD}
                  onChange={(e) =>
                    updateZone(index, { rates: { ...zone.rates, USD: Number(e.target.value) } })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>IDR</Label>
                <Input
                  type="number"
                  value={zone.rates.IDR}
                  onChange={(e) =>
                    updateZone(index, { rates: { ...zone.rates, IDR: Number(e.target.value) } })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="button" variant="outline" size="sm" onClick={() => removeZone(index)}>
                  Supprimer la zone
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addZone}>
          Ajouter une zone
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
