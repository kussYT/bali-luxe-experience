import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  createAdminPromotion,
  deleteAdminPromotion,
  fetchAdminCatalog,
  fetchAdminCollections,
  fetchAdminPromotions,
  updateAdminPromotion,
  DEFAULT_PROMO_RULES,
  type AdminPromoCode,
  type PromoRules,
} from "@/lib/admin-api";
import type { Product } from "@/lib/catalog-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/admin/MoneyInput";
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
import {
  PROMO_CATEGORIES,
  formatPromoDate,
  promoCategoryLabel,
  promoStatus,
  promoStatusLabel,
} from "@/lib/promo-admin";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/promotions/")({
  head: () => ({ meta: [{ title: "Promotions — Bingin Diaries Admin" }] }),
  component: AdminPromotionsPage,
});

const EMPTY: Partial<AdminPromoCode> = {
  code: "",
  label: "",
  category: "other",
  discountType: "percent",
  discountValue: 10,
  freeShipping: false,
  influencerName: "",
  active: true,
  rules: { ...DEFAULT_PROMO_RULES },
};

function scopeSummary(rules?: PromoRules) {
  const r = rules || DEFAULT_PROMO_RULES;
  if (r.scope === "all") return "Tout le panier";
  if (r.scope === "collections") return `${r.collectionSlugs.length} collection(s)`;
  if (r.scope === "products") return `${r.productSlugs.length} produit(s)`;
  return "Tout le panier";
}

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

type PromoListFilter = "all" | "active" | "inactive" | "expired";

function statusBadgeClass(status: ReturnType<typeof promoStatus>) {
  if (status === "active") return "bg-emerald-100 text-emerald-950 border-emerald-200";
  if (status === "scheduled") return "bg-sky-100 text-sky-950 border-sky-200";
  if (status === "expired" || status === "exhausted") return "bg-amber-100 text-amber-950 border-amber-200";
  return "bg-muted text-muted-foreground border-border";
}

function AdminPromotionsPage() {
  const [promos, setPromos] = useState<AdminPromoCode[]>([]);
  const [collections, setCollections] = useState<{ slug: string; name: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Partial<AdminPromoCode>>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState("");
  const [listFilter, setListFilter] = useState<PromoListFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const rules = draft.rules || DEFAULT_PROMO_RULES;

  const summary = useMemo(() => {
    const statuses = promos.map((p) => promoStatus(p));
    return {
      total: promos.length,
      active: statuses.filter((s) => s === "active").length,
      scheduled: statuses.filter((s) => s === "scheduled").length,
      expired: statuses.filter((s) => s === "expired" || s === "exhausted").length,
      inactive: statuses.filter((s) => s === "inactive").length,
    };
  }, [promos]);

  const visiblePromos = useMemo(() => {
    return promos.filter((promo) => {
      const status = promoStatus(promo);
      if (listFilter === "active") return status === "active" || status === "scheduled";
      if (listFilter === "inactive") return status === "inactive";
      if (listFilter === "expired") return status === "expired" || status === "exhausted";
      return true;
    });
  }, [promos, listFilter]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 12);
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
      .slice(0, 12);
  }, [products, productQuery]);

  async function load() {
    const res = await fetchAdminPromotions();
    setPromos(res.promos);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
    fetchAdminCollections()
      .then((res) => setCollections(res.collections.map((c) => ({ slug: c.slug, name: c.name }))))
      .catch(() => {});
    fetchAdminCatalog()
      .then((res) => setProducts(res.products.filter((p) => p.status === "published")))
      .catch(() => {});
  }, []);

  function resetForm() {
    setDraft(EMPTY);
    setEditingId(null);
    setProductQuery("");
  }

  function applyPreset(preset: "collection" | "influencer" | "product" | "newsletter" | "loyalty" | "friends") {
    if (preset === "influencer") {
      setDraft({
        ...EMPTY,
        category: "influencer",
        discountType: "free",
        discountValue: 100,
        freeShipping: true,
        rules: { ...DEFAULT_PROMO_RULES, scope: "all" },
      });
    } else if (preset === "newsletter") {
      setDraft({
        ...EMPTY,
        category: "newsletter",
        discountType: "percent",
        discountValue: 10,
        rules: { ...DEFAULT_PROMO_RULES, scope: "all" },
      });
    } else if (preset === "loyalty") {
      setDraft({
        ...EMPTY,
        category: "loyalty",
        discountType: "percent",
        discountValue: 10,
        rules: { ...DEFAULT_PROMO_RULES, scope: "all" },
      });
    } else if (preset === "friends") {
      setDraft({
        ...EMPTY,
        category: "friends",
        discountType: "percent",
        discountValue: 15,
        rules: { ...DEFAULT_PROMO_RULES, scope: "all" },
      });
    } else if (preset === "collection") {
      setDraft({
        ...EMPTY,
        discountType: "percent",
        discountValue: 20,
        rules: { ...DEFAULT_PROMO_RULES, scope: "collections", collectionSlugs: [] },
      });
    } else {
      setDraft({
        ...EMPTY,
        discountType: "percent",
        discountValue: 15,
        rules: { ...DEFAULT_PROMO_RULES, scope: "products", productSlugs: [] },
      });
    }
    setEditingId(null);
  }

  function startEdit(promo: AdminPromoCode) {
    setEditingId(promo.id);
    setDraft({
      ...promo,
      rules: promo.rules || { ...DEFAULT_PROMO_RULES },
    });
    setProductQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function patchRules(patch: Partial<PromoRules>) {
    setDraft({
      ...draft,
      rules: { ...rules, ...patch },
    });
  }

  function toggleCollection(slug: string) {
    const set = new Set(rules.collectionSlugs);
    if (set.has(slug)) set.delete(slug);
    else set.add(slug);
    patchRules({ collectionSlugs: [...set] });
  }

  function toggleProduct(slug: string) {
    const set = new Set(rules.productSlugs);
    if (set.has(slug)) set.delete(slug);
    else set.add(slug);
    patchRules({ productSlugs: [...set] });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (rules.scope === "collections" && rules.collectionSlugs.length === 0) {
      setError("Sélectionnez au moins une collection.");
      return;
    }
    if (rules.scope === "products" && rules.productSlugs.length === 0) {
      setError("Sélectionnez au moins un produit.");
      return;
    }
    try {
      if (editingId) {
        await updateAdminPromotion(editingId, draft);
        setMessage("Code promo mis à jour.");
      } else {
        await createAdminPromotion(draft);
        setMessage("Code promo créé.");
      }
      resetForm();
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
    if (editingId === id) resetForm();
    await load();
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-eyebrow text-muted-foreground">Marketing</p>
        <h2 className="font-display text-4xl mt-2">Codes promo</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Réduction sur tout le panier, une collection ou des produits précis. La réduction ne touche que les articles
          éligibles.
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total", value: summary.total },
          { label: "Actifs", value: summary.active },
          { label: "Programmés", value: summary.scheduled },
          { label: "Expirés / limite", value: summary.expired },
          { label: "Inactifs", value: summary.inactive },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Tous"],
            ["active", "Actifs / programmés"],
            ["expired", "Expirés"],
            ["inactive", "Inactifs"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={listFilter === value ? "default" : "outline"}
            onClick={() => setListFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => applyPreset("newsletter")}>
          Preset · Newsletter
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => applyPreset("loyalty")}>
          Preset · 2e commande
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => applyPreset("friends")}>
          Preset · Amis proches
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => applyPreset("collection")}>
          Preset · Soldes collection
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => applyPreset("product")}>
          Preset · Produit ciblé
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => applyPreset("influencer")}>
          Preset · Cadeau influenceur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{editingId ? "Modifier le code" : "Nouveau code"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={draft.code || ""}
                  onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                  required
                  disabled={Boolean(editingId)}
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
                <Label>Catégorie</Label>
                <Select
                  value={draft.category || "other"}
                  onValueChange={(v) => setDraft({ ...draft, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMO_CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <MoneyInput
                  value={draft.discountValue ?? 0}
                  onChange={(n) => setDraft({ ...draft, discountValue: n ?? 0 })}
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
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={Boolean(draft.freeShipping)}
                onCheckedChange={(v) => setDraft({ ...draft, freeShipping: v })}
              />
              <Label>Livraison offerte</Label>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <p className="text-sm font-medium">S&apos;applique à</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "all", label: "Tout le panier" },
                    { value: "collections", label: "Collections" },
                    { value: "products", label: "Produits précis" },
                  ] as const
                ).map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    size="sm"
                    variant={rules.scope === opt.value ? "default" : "outline"}
                    onClick={() =>
                      patchRules({
                        scope: opt.value,
                        collectionSlugs: opt.value === "collections" ? rules.collectionSlugs : [],
                        productSlugs: opt.value === "products" ? rules.productSlugs : [],
                      })
                    }
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>

              {rules.scope === "collections" && (
                <div className="flex flex-wrap gap-2">
                  {collections.map((c) => (
                    <Button
                      key={c.slug}
                      type="button"
                      size="sm"
                      variant={rules.collectionSlugs.includes(c.slug) ? "default" : "outline"}
                      onClick={() => toggleCollection(c.slug)}
                    >
                      {c.name}
                    </Button>
                  ))}
                </div>
              )}

              {rules.scope === "products" && (
                <div className="space-y-3">
                  <Input
                    placeholder="Rechercher un produit…"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                  />
                  {rules.productSlugs.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {rules.productSlugs.map((slug) => {
                        const p = products.find((x) => x.slug === slug);
                        return (
                          <Button
                            key={slug}
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => toggleProduct(slug)}
                          >
                            {p?.name || slug} ×
                          </Button>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {filteredProducts.map((p) => (
                      <Button
                        key={p.slug}
                        type="button"
                        size="sm"
                        variant={rules.productSlugs.includes(p.slug) ? "default" : "outline"}
                        onClick={() => toggleProduct(p.slug)}
                      >
                        {p.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <details className="border border-border rounded-sm p-4">
              <summary className="text-sm font-medium cursor-pointer">Avancé (optionnel)</summary>
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label>Panier éligible min. (€)</Label>
                  <MoneyInput
                    allowEmpty
                    value={rules.minSubtotalEur ?? undefined}
                    onChange={(n) => patchRules({ minSubtotalEur: n ?? null })}
                    placeholder="Ex. 80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Actif à partir du</Label>
                  <Input
                    type="datetime-local"
                    value={toDatetimeLocal(rules.startsAt)}
                    onChange={(e) => patchRules({ startsAt: fromDatetimeLocal(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expire le</Label>
                  <Input
                    type="datetime-local"
                    value={toDatetimeLocal(draft.expiresAt ?? null)}
                    onChange={(e) => setDraft({ ...draft, expiresAt: fromDatetimeLocal(e.target.value) })}
                  />
                </div>
              </div>
            </details>

            <div className="flex flex-wrap gap-2">
              <Button type="submit">{editingId ? "Enregistrer" : "Créer le code"}</Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {visiblePromos.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun code dans ce filtre.</p>
        )}
        {visiblePromos.map((promo) => {
          const status = promoStatus(promo);
          return (
          <Card key={promo.id}>
            <CardContent className="pt-6 flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono font-medium">{promo.code}</p>
                  <Badge variant="outline" className={statusBadgeClass(status)}>
                    {promoStatusLabel(status)}
                  </Badge>
                  <Badge variant="outline">{promoCategoryLabel(promo.category)}</Badge>
                </div>
                {promo.label && <p className="text-sm text-foreground/90">{promo.label}</p>}
                <p className="text-sm text-muted-foreground">
                  {promo.discountType === "free"
                    ? "Cadeau 100 %"
                    : promo.discountType === "percent"
                      ? `${promo.discountValue} %`
                      : `${promo.discountValue} €`}
                  {promo.freeShipping ? " · livraison offerte" : ""}
                  {" · "}
                  {scopeSummary(promo.rules)}
                  {promo.influencerName ? ` · ${promo.influencerName}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {promo.usedCount} utilisation{promo.usedCount !== 1 ? "s" : ""}
                  {promo.maxUses != null ? ` / ${promo.maxUses}` : ""}
                  {" · "}Début : {formatPromoDate(promo.rules?.startsAt ?? null)}
                  {" · "}Fin : {formatPromoDate(promo.expiresAt)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button type="button" variant="outline" size="sm" onClick={() => startEdit(promo)}>
                  Modifier
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => toggleActive(promo)}>
                  {promo.active ? "Désactiver" : "Activer"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(promo.id)}>
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>
    </div>
  );
}
