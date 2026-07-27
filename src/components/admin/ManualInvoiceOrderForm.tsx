import { useEffect, useMemo, useState } from "react";
import { formatMoneyInput, parseMoneyInput } from "@/lib/parse-money";
import {
  createManualInvoiceOrder,
  fetchAdminCatalog,
  previewManualInvoiceOrder,
  type ManualInvoicePreview,
} from "@/lib/admin-api";
import type { Product } from "@/lib/catalog-types";
import { getShippingCountry, SHIPPING_COUNTRIES } from "@/data/shipping-countries";
import type { Currency } from "@/lib/currency";
import { EUR_TO_IDR, EUR_TO_USD, getUnitPrice } from "@/lib/pricing";
import { useAdminLocale } from "@/lib/admin-locale";
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
  unitPrice: string;
};

type ManualInvoiceOrderFormProps = {
  onCreated?: () => void;
};

const emptyLine = (): LineDraft => ({
  productSlug: "",
  variantSlug: "",
  qty: "1",
  unitPrice: "",
});

function currencySymbol(currency: Currency) {
  if (currency === "IDR") return "Rp";
  if (currency === "USD") return "$";
  return "€";
}

function formatAmount(amount: number, currency: Currency) {
  if (currency === "IDR") return `Rp ${Math.round(amount).toLocaleString("en-US")}`;
  if (currency === "USD") return `$${Number(amount).toFixed(2)}`;
  return `€${Number(amount).toFixed(2)}`;
}

/** Preview/DB amounts are Stripe smallest units (cents) except IDR (whole rupiah). */
function formatStripeAmount(amount: number, currency: Currency) {
  if (currency === "IDR") return formatAmount(amount, currency);
  return formatAmount(amount / 100, currency);
}

function convertDisplayAmount(amount: number, from: Currency, to: Currency) {
  if (from === to) return amount;
  const asEur =
    from === "EUR" ? amount : from === "USD" ? amount / EUR_TO_USD : amount / EUR_TO_IDR;
  if (to === "EUR") return Math.round(asEur * 100) / 100;
  if (to === "USD") return Math.round(asEur * EUR_TO_USD * 100) / 100;
  return Math.round(asEur * EUR_TO_IDR);
}

function toStripeUnit(displayAmount: number, currency: Currency) {
  if (currency === "IDR") return Math.round(displayAmount);
  return Math.round(displayAmount * 100);
}

const COPY = {
  fr: {
    trigger: "Créer commande + lien paiement",
    title: "Commande manuelle (facture)",
    intro:
      "Choisissez les produits, ajoutez une remise si besoin, générez l’aperçu (avec frais de livraison selon le pays), puis créez et envoyez le lien de paiement. Le stock n’est déduit qu’après paiement.",
    customerEmail: "Email client *",
    shippingCountry: "Pays livraison *",
    shippingHint:
      "La devise et les frais de port suivent le pays (Indonésie = IDR). Calculés dès l’aperçu.",
    countryPlaceholder: "Pays",
    items: "Articles",
    loading: "(chargement…)",
    addLine: "+ Ligne",
    product: "Produit",
    productPlaceholder: "Choisir une référence",
    variant: "Taille / variante",
    sizePlaceholder: "Taille",
    oneSize: "Taille unique",
    qty: "Qté",
    unitPrice: (symbol: string) => `Prix unitaire (${symbol})`,
    remove: "Retirer",
    discount: "Remise / promotion",
    discountNone: "Aucune",
    discountPercent: "Pourcentage (%)",
    discountFixed: (symbol: string) => `Montant fixe (${symbol})`,
    discountPctLabel: "Remise %",
    discountFixedLabel: (symbol: string) => `Remise ${symbol}`,
    notes: "Notes internes",
    notesPlaceholder: "Ex. commande Instagram DM",
    sendEmail: "Après validation : envoyer l’email avec le lien de paiement",
    previewing: "Calcul de l’aperçu…",
    previewBtn: "1. Aperçu (obligatoire)",
    previewTitle: "Aperçu avant envoi",
    client: "Client :",
    delivery: "Livraison :",
    currency: "Devise :",
    beforeDiscount: "Sous-total avant remise",
    discountLine: "Remise",
    subtotal: "Sous-total",
    shipping: "Livraison",
    total: "Total à payer",
    shippingNote:
      "Ces frais de livraison sont inclus dans le total du lien de paiement. Le client confirmera son adresse au checkout Stripe.",
    back: "← Modifier",
    creating: "Création…",
    createSend: "2. Créer et envoyer le lien",
    createNoEmail: "2. Créer sans email",
    emailSent: (email: string) => `Commande créée — email de paiement envoyé à ${email}.`,
    createdNoEmail:
      "Commande créée (email non envoyé). Vous pourrez renvoyer le lien depuis le détail.",
    paymentLink: "Lien de paiement (à copier si besoin)",
    errEmail: "Email client requis",
    errProduct: "Choisissez un produit pour chaque ligne",
    errPrice: (slug: string) => `Prix invalide pour ${slug}`,
    errPct: "Remise % invalide (1–100)",
    errFixed: "Montant de remise invalide",
    errPreview: "Échec de l'aperçu",
    errNeedPreview: "Veuillez d'abord générer l'aperçu",
    errCreate: "Échec de création",
  },
  en: {
    trigger: "Create order + payment link",
    title: "Manual order (invoice)",
    intro:
      "Pick products, add a discount if needed, generate the preview (shipping by country), then create and send the payment link. Stock is only deducted after payment.",
    customerEmail: "Customer email *",
    shippingCountry: "Shipping country *",
    shippingHint:
      "Currency and shipping follow the country (Indonesia = IDR). Calculated at preview.",
    countryPlaceholder: "Country",
    items: "Items",
    loading: "(loading…)",
    addLine: "+ Line",
    product: "Product",
    productPlaceholder: "Choose a product",
    variant: "Size / variant",
    sizePlaceholder: "Size",
    oneSize: "One size",
    qty: "Qty",
    unitPrice: (symbol: string) => `Unit price (${symbol})`,
    remove: "Remove",
    discount: "Discount / promotion",
    discountNone: "None",
    discountPercent: "Percentage (%)",
    discountFixed: (symbol: string) => `Fixed amount (${symbol})`,
    discountPctLabel: "Discount %",
    discountFixedLabel: (symbol: string) => `Discount ${symbol}`,
    notes: "Internal notes",
    notesPlaceholder: "e.g. Instagram DM order",
    sendEmail: "After create: send payment-link email",
    previewing: "Calculating preview…",
    previewBtn: "1. Preview (required)",
    previewTitle: "Preview before send",
    client: "Customer:",
    delivery: "Shipping:",
    currency: "Currency:",
    beforeDiscount: "Subtotal before discount",
    discountLine: "Discount",
    subtotal: "Subtotal",
    shipping: "Shipping",
    total: "Total due",
    shippingNote:
      "Shipping is included in the payment-link total. The customer will confirm their address at Stripe checkout.",
    back: "← Edit",
    creating: "Creating…",
    createSend: "2. Create and send link",
    createNoEmail: "2. Create without email",
    emailSent: (email: string) => `Order created — payment email sent to ${email}.`,
    createdNoEmail: "Order created (email not sent). You can resend the link from the order detail.",
    paymentLink: "Payment link (copy if needed)",
    errEmail: "Customer email required",
    errProduct: "Choose a product for each line",
    errPrice: (slug: string) => `Invalid price for ${slug}`,
    errPct: "Invalid % discount (1–100)",
    errFixed: "Invalid discount amount",
    errPreview: "Preview failed",
    errNeedPreview: "Please generate the preview first",
    errCreate: "Create failed",
  },
} as const;

export function ManualInvoiceOrderForm({ onCreated }: ManualInvoiceOrderFormProps) {
  const { locale } = useAdminLocale();
  const copy = COPY[locale] || COPY.en;
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
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const currency = getShippingCountry(shippingCountryCode).currency;
  const symbol = currencySymbol(currency);

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
    setPaymentUrl(null);
  }

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
    setPreview(null);
    setStep("edit");
  }

  function selectProduct(index: number, slug: string) {
    const product = productBySlug.get(slug);
    const variants =
      product?.variants?.filter((v) => v.title !== "Default Title" && v.title !== "Default") ?? [];
    const defaultVariant = variants[0];
    const price = product ? getUnitPrice(product, currency) : 0;
    updateLine(index, {
      productSlug: slug,
      variantSlug: defaultVariant?.slug || "",
      unitPrice: product ? formatMoneyInput(price) : "",
    });
  }

  function changeShippingCountry(code: string) {
    const nextCurrency = getShippingCountry(code).currency;
    const prevCurrency = currency;
    setShippingCountryCode(code);
    setStep("edit");
    setPreview(null);
    if (nextCurrency === prevCurrency) return;

    setLines((prev) =>
      prev.map((line) => {
        const parsed = parseMoneyInput(line.unitPrice);
        if (parsed == null) return line;
        const converted = convertDisplayAmount(parsed, prevCurrency, nextCurrency);
        return { ...line, unitPrice: formatMoneyInput(converted) };
      }),
    );
    if (discountType === "fixed") {
      const parsed = parseMoneyInput(discountValue);
      if (parsed != null) {
        setDiscountValue(formatMoneyInput(convertDisplayAmount(parsed, prevCurrency, nextCurrency)));
      }
    }
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
      throw new Error(copy.errEmail);
    }
    const items = lines.map((line) => {
      if (!line.productSlug.trim()) throw new Error(copy.errProduct);
      const amount = parseMoneyInput(line.unitPrice);
      if (amount == null || amount < 0) {
        throw new Error(copy.errPrice(line.productSlug));
      }
      return {
        productSlug: line.productSlug.trim(),
        variantSlug: line.variantSlug.trim() || undefined,
        qty: Number(line.qty),
        unitPrice: toStripeUnit(amount, currency),
      };
    });

    let discountPayload: {
      discountType?: "percent" | "fixed" | null;
      discountValue?: number;
    } = { discountType: null, discountValue: 0 };

    if (discountType === "percent") {
      const pct = Number(String(discountValue).replace(",", "."));
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        throw new Error(copy.errPct);
      }
      discountPayload = { discountType: "percent", discountValue: pct };
    } else if (discountType === "fixed") {
      const amount = parseMoneyInput(discountValue);
      if (amount == null || amount <= 0) throw new Error(copy.errFixed);
      discountPayload = { discountType: "fixed", discountValue: toStripeUnit(amount, currency) };
    }

    return {
      customerEmail: customerEmail.trim(),
      shippingCountryCode: shippingCountryCode.trim().toUpperCase(),
      currency,
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
      setError(err instanceof Error ? err.message : copy.errPreview);
      setStep("edit");
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  }

  async function handleCreate() {
    if (!preview) {
      setError(copy.errNeedPreview);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = buildPayload();
      const result = await createManualInvoiceOrder({ ...payload, sendEmail });
      setPaymentUrl(result.paymentUrl || null);
      setSuccess(
        result.emailSent
          ? copy.emailSent(result.email || customerEmail.trim())
          : copy.createdNoEmail,
      );
      onCreated?.();
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 6000);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errCreate);
    } finally {
      setSaving(false);
    }
  }

  const previewCurrency = (preview?.currency as Currency) || currency;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">{copy.trigger}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{copy.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{copy.intro}</p>

        {step === "edit" ? (
          <form className="space-y-5 mt-2" onSubmit={handlePreview}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceEmail">{copy.customerEmail}</Label>
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
                <Label>{copy.shippingCountry}</Label>
                <Select value={shippingCountryCode} onValueChange={changeShippingCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder={copy.countryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {SHIPPING_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name} ({c.code}) · {c.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{copy.shippingHint}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  {copy.items} {catalogLoading ? copy.loading : ""}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  {copy.addLine}
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
                      <Label className="text-xs">{copy.product}</Label>
                      <Select
                        value={line.productSlug || undefined}
                        onValueChange={(slug) => selectProduct(index, slug)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={copy.productPlaceholder} />
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
                      <Label className="text-xs">{copy.variant}</Label>
                      {variants.length > 0 ? (
                        <Select
                          value={line.variantSlug || undefined}
                          onValueChange={(slug) => updateLine(index, { variantSlug: slug })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={copy.sizePlaceholder} />
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
                        <Input value={copy.oneSize} disabled />
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{copy.qty}</Label>
                      <Input
                        required
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={(e) => updateLine(index, { qty: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">{copy.unitPrice(symbol)}</Label>
                      <Input
                        required
                        value={line.unitPrice}
                        onChange={(e) => updateLine(index, { unitPrice: e.target.value })}
                        placeholder={currency === "IDR" ? "697000" : "49,00"}
                      />
                    </div>
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(index)}
                      >
                        {copy.remove}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 border border-border rounded-sm p-3">
              <div className="space-y-2">
                <Label>{copy.discount}</Label>
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
                    <SelectItem value="none">{copy.discountNone}</SelectItem>
                    <SelectItem value="percent">{copy.discountPercent}</SelectItem>
                    <SelectItem value="fixed">{copy.discountFixed(symbol)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {discountType !== "none" && (
                <div className="space-y-2">
                  <Label>
                    {discountType === "percent"
                      ? copy.discountPctLabel
                      : copy.discountFixedLabel(symbol)}
                  </Label>
                  <Input
                    value={discountValue}
                    onChange={(e) => {
                      setDiscountValue(e.target.value);
                      setPreview(null);
                      setStep("edit");
                    }}
                    placeholder={discountType === "percent" ? "10" : currency === "IDR" ? "50000" : "15,00"}
                    required
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNotes">{copy.notes}</Label>
              <Textarea
                id="invoiceNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={copy.notesPlaceholder}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
              {copy.sendEmail}
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={previewing || catalogLoading}>
              {previewing ? copy.previewing : copy.previewBtn}
            </Button>
          </form>
        ) : (
          <div className="space-y-5 mt-2">
            <div className="border border-border rounded-sm p-4 space-y-3 bg-muted/30">
              <p className="text-eyebrow text-muted-foreground">{copy.previewTitle}</p>
              <p className="text-sm">
                <span className="text-muted-foreground">{copy.client}</span>{" "}
                {preview?.customerEmail}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">{copy.delivery}</span>{" "}
                {preview?.shippingCountryCode}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">{copy.currency}</span> {previewCurrency}
              </p>
              <table className="w-full text-sm">
                <tbody>
                  {preview?.lines.map((line, i) => (
                    <tr key={`${line.productSlug}-${i}`} className="border-t border-border">
                      <td className="py-2">
                        {line.name}
                        {line.variantTitle ? ` — ${line.variantTitle}` : ""} × {line.qty}
                      </td>
                      <td className="py-2 text-right">
                        {formatStripeAmount(line.lineTotal, previewCurrency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 text-sm border-t border-border pt-3">
                {(preview?.discountCents ?? 0) > 0 && (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>{copy.beforeDiscount}</span>
                      <span>{formatStripeAmount(preview!.grossSubtotal, previewCurrency)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>
                        {copy.discountLine}
                        {preview?.discountType === "percent"
                          ? ` (−${preview.discountValue}%)`
                          : ""}
                      </span>
                      <span>−{formatStripeAmount(preview!.discountCents, previewCurrency)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{copy.subtotal}</span>
                  <span>{formatStripeAmount(preview?.amountSubtotal ?? 0, previewCurrency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    {copy.shipping} ({preview?.shippingCountryCode})
                  </span>
                  <span>
                    {preview?.shippingLabel ||
                      formatStripeAmount(preview?.amountShipping ?? 0, previewCurrency)}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-base pt-1">
                  <span>{copy.total}</span>
                  <span>{formatStripeAmount(preview?.amountTotal ?? 0, previewCurrency)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{copy.shippingNote}</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-muted-foreground">{success}</p>}
            {paymentUrl && (
              <div className="rounded-sm border border-border bg-muted/40 p-3 space-y-1">
                <p className="text-xs font-medium">{copy.paymentLink}</p>
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs break-all text-foreground underline"
                >
                  {paymentUrl}
                </a>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("edit")} disabled={saving}>
                {copy.back}
              </Button>
              <Button type="button" onClick={handleCreate} disabled={saving || !preview}>
                {saving ? copy.creating : sendEmail ? copy.createSend : copy.createNoEmail}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
