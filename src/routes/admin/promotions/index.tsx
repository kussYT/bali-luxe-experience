import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  createAdminPromotion,
  deleteAdminPromotion,
  fetchAdminPromotions,
  updateAdminPromotion,
  type AdminPromoCode,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/promotions/")({
  head: () => ({ meta: [{ title: "Promotions — Bingin Diaries Admin" }] }),
  component: AdminPromotionsPage,
});

const EMPTY: Partial<AdminPromoCode> = {
  code: "",
  label: "",
  discountType: "percent",
  discountValue: 10,
  freeShipping: false,
  influencerName: "",
  active: true,
};

function AdminPromotionsPage() {
  const [promos, setPromos] = useState<AdminPromoCode[]>([]);
  const [draft, setDraft] = useState<Partial<AdminPromoCode>>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetchAdminPromotions();
    setPromos(res.promos);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await createAdminPromotion(draft);
      setDraft(EMPTY);
      setMessage("Code promo créé.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  async function toggleActive(promo: AdminPromoCode) {
    await updateAdminPromotion(promo.id, { active: !promo.active });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce code ?")) return;
    await deleteAdminPromotion(id);
    await load();
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-eyebrow text-muted-foreground">Marketing</p>
        <h2 className="font-display text-4xl mt-2">Codes promo</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Réductions checkout · type <strong>free</strong> + livraison offerte = cadeau influenceur (0 €).
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nouveau code</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={draft.code || ""}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Libellé interne</Label>
              <Input
                value={draft.label || ""}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={draft.discountType || "percent"}
                onValueChange={(v) =>
                  setDraft({
                    ...draft,
                    discountType: v as AdminPromoCode["discountType"],
                    discountValue: v === "free" ? 100 : draft.discountValue,
                    freeShipping: v === "free" ? true : draft.freeShipping,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Pourcentage</SelectItem>
                  <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                  <SelectItem value="free">100 % cadeau</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valeur (% ou €)</Label>
              <Input
                type="number"
                value={draft.discountValue ?? 0}
                onChange={(e) => setDraft({ ...draft, discountValue: Number(e.target.value) })}
                disabled={draft.discountType === "free"}
              />
            </div>
            <div className="space-y-2">
              <Label>Influenceur (optionnel)</Label>
              <Input
                value={draft.influencerName || ""}
                onChange={(e) => setDraft({ ...draft, influencerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Utilisations max</Label>
              <Input
                type="number"
                value={draft.maxUses ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, maxUses: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="Illimité"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <Switch
                checked={Boolean(draft.freeShipping)}
                onCheckedChange={(v) => setDraft({ ...draft, freeShipping: v })}
              />
              <Label>Livraison offerte</Label>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Créer le code</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {promos.map((promo) => (
          <Card key={promo.id}>
            <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono font-medium">{promo.code}</p>
                <p className="text-sm text-muted-foreground">
                  {promo.discountType === "free"
                    ? "Cadeau 100 %"
                    : promo.discountType === "percent"
                      ? `${promo.discountValue} %`
                      : `${promo.discountValue} €`}
                  {promo.freeShipping ? " · livraison offerte" : ""}
                  {promo.influencerName ? ` · ${promo.influencerName}` : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {promo.usedCount} utilisation{promo.usedCount !== 1 ? "s" : ""}
                  {promo.maxUses != null ? ` / ${promo.maxUses}` : ""}
                  {!promo.active ? " · inactif" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => toggleActive(promo)}>
                  {promo.active ? "Désactiver" : "Activer"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(promo.id)}>
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
