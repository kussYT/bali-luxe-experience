import { useState } from "react";
import { createMarketplaceOrder } from "@/lib/admin-api";
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

type MarketplaceOrderFormProps = {
  onCreated?: () => void;
};

const emptyLine = (): LineDraft => ({
  productSlug: "",
  variantSlug: "",
  qty: "1",
  unitPriceEur: "",
});

export function MarketplaceOrderForm({ onCreated }: MarketplaceOrderFormProps) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<"wolf_badger" | "other">("wolf_badger");
  const [externalRef, setExternalRef] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingCountryCode, setShippingCountryCode] = useState("GB");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const items = lines.map((line) => ({
        productSlug: line.productSlug.trim(),
        variantSlug: line.variantSlug.trim() || undefined,
        qty: Number(line.qty),
        unitPrice: Math.round(Number(line.unitPriceEur.replace(",", ".")) * 100),
      }));

      await createMarketplaceOrder({
        channel,
        externalRef: externalRef.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        shippingCountryCode: shippingCountryCode.trim().toUpperCase(),
        currency: "EUR",
        items,
        notes: notes.trim() || undefined,
      });

      setOpen(false);
      setExternalRef("");
      setCustomerEmail("");
      setNotes("");
      setLines([emptyLine()]);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Ajouter commande marketplace</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Commande marketplace</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Enregistrez une vente Wolf &amp; Badger (ou autre canal). Le stock sera décrémenté automatiquement.
        </p>
        <form className="space-y-5 mt-2" onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as "wolf_badger" | "other")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wolf_badger">Wolf &amp; Badger</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="externalRef">Réf. commande (W&amp;B)</Label>
              <Input
                id="externalRef"
                value={externalRef}
                onChange={(e) => setExternalRef(e.target.value)}
                placeholder="WB-12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email client</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingCountry">Pays livraison (ISO)</Label>
              <Input
                id="shippingCountry"
                value={shippingCountryCode}
                onChange={(e) => setShippingCountryCode(e.target.value)}
                maxLength={2}
                placeholder="GB"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Articles</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                + Ligne
              </Button>
            </div>
            {lines.map((line, index) => (
              <div key={index} className="grid sm:grid-cols-4 gap-2 items-end border border-border p-3 rounded-sm">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Slug produit</Label>
                  <Input
                    required
                    value={line.productSlug}
                    onChange={(e) => updateLine(index, { productSlug: e.target.value })}
                    placeholder="robe-linen-bali"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Taille (slug)</Label>
                  <Input
                    value={line.variantSlug}
                    onChange={(e) => updateLine(index, { variantSlug: e.target.value })}
                    placeholder="optionnel"
                  />
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
                    placeholder="89.00"
                  />
                </div>
                {lines.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(index)}>
                    Retirer
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? "Enregistrement…" : "Créer la commande"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
