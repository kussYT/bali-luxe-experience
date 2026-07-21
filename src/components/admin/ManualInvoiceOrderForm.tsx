import { useEffect, useMemo, useState } from "react";
import { parseMoneyInput } from "@/lib/parse-money";
import {
  createManualInvoiceOrder,
  fetchAdminCatalog,
  previewManualInvoiceOrder,
  type ManualInvoicePreview,
} from "@/lib/admin-api";
import type { Product } from "@/lib/catalog-types";
import { SHIPPING_COUNTRIES } from "@/data/shipping-countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type LineDraft = {
  productSlug: string;
  variantSlug: string;
  qty: string;
  unitPriceEur: string;
};

type ManualInvoiceOrderFormProps = {
  onCreated?: () => void;
};

const emptyLine = (): LineDraft => ({
  productSlug: "",
  variantSlug: "",
  qty: "1",
  unitPriceEur: "",
});

function formatEurCents(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

function saleUnitEur(product: Product) {
  if (product.onSale && product.compareAtEUR != null) return Number(product.compareAtEUR);
  return Number(product.priceEUR) || 0;
}

export function ManualInvoiceOrderForm({ onCreated }: ManualInvoiceOrderFormProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"edit" | "preview">("edit");
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingCountryCode, setShippingCountryCode] = useState("FR");
  const [notes, setNotes] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [discountType, setDiscountType] = useState<"none" | "percent" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [preview, setPreview] = useState<ManualInvoicePreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCatalogLoading(true);
    fetchAdminCatalog()
      .then((catalog) => {
        const list = [...(catalog.products || [])]
          .filter((p) => p.status === "published")
          .sort((a, b) => a.name.localeCompare(b.name));
        setProducts(list);
      })
      .catch(() => setProducts([]))
      .finally(() => setCatalogLoading(false));
  }, [open]);

  const productBySlug = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(p.slug, p);
    return map;
  }, [products]);

  function resetForm() {
    setStep("edit");
    setCustomerEmail("");
    setShippingCountryCode("FR");
    setNotes("");
    setSendEmail(true);
    setDiscountType("none");
    setDiscountValue("");
    setLines([emptyLine()]);
    setPreview(null);
    setError(null);
    setSuccess(null);
  }

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
    setPreview(null);
    setStep("edit");
  }

  function selectProduct(index: number, slug: string) {
    const product = productBySlug.get(slug);
    const variants = product?.variants?.filter((v) => v.title !== "Default Title" && v.title !== "Default") ?? [];
    const defaultVariant = variants[0];
    updateLine(index, {
      productSlug: slug,
      variantSlug: defaultVariant?.slug || "",
      unitPriceEur: product ? String(saleUnitEur(product).toFixed(2)).replace(".", ",") : "",
    });
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
    setPreview(null);
    setStep("edit");
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setPreview(null);
    setStep("edit");
  }

  function buildPayload() {
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      throw new Error("Email client requis");
    }
    const items = lines.map((line) => {
      if (!line.productSlug.trim()) throw new Error("Choisissez un produit pour chaque ligne");
      const euros = parseMoneyInput(line.unitPriceEur);
      if (euros == null || euros < 0) {
        throw new Error(`Prix invalide pour ${line.productSlug}`);
      }
      return {
        productSlug: line.productSlug.trim(),
        variantSlug: line.variantSlug.trim() || undefined,
        qty: Number(line.qty),
        unitPrice: Math.round(euros * 100),
      };
    });

    let discountPayload: {
      discountType?: "percent" | "fixed" | null;
      discountValue?: number;
    } = { discountType: null, discountValue: 0 };

    if (discountType === "percent") {
      const pct = Number(String(discountValue).replace(",", "."));
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        throw new Error("Remise % invalide (1–100)");
      }
      discountPayload = { discountType: "percent", discountValue: pct };
    } else if (discountType === "fixed") {
      const euros = parseMoneyInput(discountValue);
      if (euros == null || euros <= 0) throw new Error("Montant de remise invalide");
      discountPayload = { discountType: "fixed", discountValue: Math.round(euros * 100) };
    }

    return {
      customerEmail: customerEmail.trim(),
      shippingCountryCode: shippingCountryCode.trim().toUpperCase(),
      currency: "EUR" as const,
      items,
      notes: notes.trim() || undefined,
      ...discountPayload,
    };
  }

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setPreviewing(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = buildPayload();
      const result = await previewManualInvoiceOrder(payload);
      setPreview(result.preview);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'aperçu");
      setStep("edit");
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  }

  async function handleCreate() {
    if (!preview) {
      setError("Veuillez d'abord générer l'aperçu");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = buildPayload();
      const result = await createManualInvoiceOrder({ ...payload, sendEmail });
      setSuccess(
        result.emailSent
          ? `Commande créée — email de paiement envoyé à ${result.email}.`
          : "Commande créée (email non envoyé). Vous pourrez renvoyer le lien depuis le détail.",
      );
      onCreated?.();
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de création");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Créer commande + lien paiement</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Commande manuelle (facture)</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Choisissez les produits, ajoutez une remise si besoin, générez l’aperçu (avec frais de
          livraison selon le pays), puis créez et envoyez le lien de paiement. Le stock n’est déduit
          qu’après paiement.
        </p>

        {step === "edit" ? (
          <form className="space-y-5 mt-2" onSubmit={handlePreview}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceEmail">Email client *</Label>
                <Input
                  id="invoiceEmail"
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    setStep("edit");
                    setPreview(null);
                  }}
                  placeholder="client@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Pays livraison *</Label>
                <Select
                  value={shippingCountryCode}
                  onValueChange={(v) => {
                    setShippingCountryCode(v);
                    setStep("edit");
                    setPreview(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pays" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {SHIPPING_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Les frais de port sont calculés pour ce pays dès l’aperçu (pas à la dernière minute
                  au paiement).
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Articles {catalogLoading ? "(chargement…)" : ""}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  + Ligne
                </Button>
              </div>
              {lines.map((line, index) => {
                const product = productBySlug.get(line.productSlug);
                const variants =
                  product?.variants?.filter(
                    (v) => v.title !== "Default Title" && v.title !== "Default",
                  ) ?? [];
                return (
                  <div
                    key={index}
                    className="grid sm:grid-cols-4 gap-2 items-end border border-border p-3 rounded-sm"
                  >
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Produit</Label>
                      <Select
                        value={line.productSlug || undefined}
                        onValueChange={(slug) => selectProduct(index, slug)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une référence" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {products.map((p) => (
                            <SelectItem key={p.slug} value={p.slug}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Taille / variante</Label>
                      {variants.length > 0 ? (
                        <Select
                          value={line.variantSlug || undefined}
                          onValueChange={(slug) => updateLine(index, { variantSlug: slug })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Taille" />
                          </SelectTrigger>
                          <SelectContent>
                            {variants.map((v) => (
                              <SelectItem key={v.id} value={v.slug}>
                                {v.option1 || v.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value="Taille unique" disabled />
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Qté</Label>
                      <Input
                        required
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={(e) => updateLine(index, { qty: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Prix unitaire (€)</Label>
                      <Input
                        required
                        value={line.unitPriceEur}
                        onChange={(e) => updateLine(index, { unitPriceEur: e.target.value })}
                        placeholder="49,00"
                      />
                    </div>
                    {lines.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(index)}>
                        Retirer
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 border border-border rounded-sm p-3">
              <div className="space-y-2">
                <Label>Remise / promotion</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) => {
                    setDiscountType(v as "none" | "percent" | "fixed");
                    setPreview(null);
                    setStep("edit");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    <SelectItem value="percent">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {discountType !== "none" && (
                <div className="space-y-2">
                  <Label>{discountType === "percent" ? "Remise %" : "Remise €"}</Label>
                  <Input
                    value={discountValue}
                    onChange={(e) => {
                      setDiscountValue(e.target.value);
                      setPreview(null);
                      setStep("edit");
                    }}
                    placeholder={discountType === "percent" ? "10" : "15,00"}
                    required
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNotes">Notes internes</Label>
              <Textarea
                id="invoiceNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex. commande Instagram DM"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
              Après validation : envoyer l’email avec le lien de paiement
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={previewing || catalogLoading}>
              {previewing ? "Calcul de l’aperçu…" : "1. Aperçu (obligatoire)"}
            </Button>
          </form>
        ) : (
          <div className="space-y-5 mt-2">
            <div className="border border-border rounded-sm p-4 space-y-3 bg-muted/30">
              <p className="text-eyebrow text-muted-foreground">Aperçu avant envoi</p>
              <p className="text-sm">
                <span className="text-muted-foreground">Client :</span> {preview?.customerEmail}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Livraison :</span>{" "}
                {preview?.shippingCountryCode}
              </p>
              <table className="w-full text-sm">
                <tbody>
                  {preview?.lines.map((line, i) => (
                    <tr key={`${line.productSlug}-${i}`} className="border-t border-border">
                      <td className="py-2">
                        {line.name}
                        {line.variantTitle ? ` — ${line.variantTitle}` : ""} × {line.qty}
                      </td>
                      <td className="py-2 text-right">{formatEurCents(line.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 text-sm border-t border-border pt-3">
                {(preview?.discountCents ?? 0) > 0 && (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Sous-total avant remise</span>
                      <span>{formatEurCents(preview!.grossSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>
                        Remise
                        {preview?.discountType === "percent"
                          ? ` (−${preview.discountValue}%)`
                          : ""}
                      </span>
                      <span>−{formatEurCents(preview!.discountCents)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Sous-total</span>
                  <span>{formatEurCents(preview?.amountSubtotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Livraison ({preview?.shippingCountryCode})</span>
                  <span>{preview?.shippingLabel || formatEurCents(preview?.amountShipping ?? 0)}</span>
                </div>
                <div className="flex justify-between font-medium text-base pt-1">
                  <span>Total à payer</span>
                  <span>{formatEurCents(preview?.amountTotal ?? 0)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Ces frais de livraison sont inclus dans le total du lien de paiement. Le client
                confirmera son adresse au checkout Stripe, mais le montant shipping affiché / facturé
                est celui calculé pour le pays choisi ici.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-muted-foreground">{success}</p>}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("edit")} disabled={saving}>
                ← Modifier
              </Button>
              <Button type="button" onClick={handleCreate} disabled={saving || !preview}>
                {saving
                  ? "Création…"
                  : sendEmail
                    ? "2. Créer et envoyer le lien"
                    : "2. Créer sans email"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
