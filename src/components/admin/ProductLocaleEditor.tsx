import { useEffect, useState } from "react";
import type { Product, ProductLocaleFields } from "@/lib/catalog-types";
import type { Locale } from "@/lib/i18n/messages";
import { CMS_LOCALES } from "@/lib/i18n/cms-locales";
import { emptyProductLocaleFields } from "@/lib/product-locale";
import { autoTranslateProduct, fetchTranslateStatus } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function localeFields(product: Product, code: Locale): ProductLocaleFields {
  return product.locales?.[code] || emptyProductLocaleFields();
}

type ProductLocaleEditorProps = {
  product: Product;
  onChange: (locales: NonNullable<Product["locales"]>) => void;
};

export function ProductLocaleEditor({ product, onChange }: ProductLocaleEditorProps) {
  const [activeLocale, setActiveLocale] = useState<Locale>("fr");
  const [sourceLocale, setSourceLocale] = useState<Locale>("en");
  const [translateAvailable, setTranslateAvailable] = useState<boolean | null>(null);
  const [translating, setTranslating] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const locales = product.locales || {};

  useEffect(() => {
    fetchTranslateStatus()
      .then((s) => setTranslateAvailable(s.available))
      .catch(() => setTranslateAvailable(false));
  }, []);

  const patchLocale = (code: Locale, patch: Partial<ProductLocaleFields>) => {
    const current = localeFields(product, code);
    onChange({
      ...locales,
      [code]: { ...current, ...patch },
    });
  };

  async function handleTranslate() {
    const fields = localeFields(product, sourceLocale);
    if (!fields.name.trim()) {
      setNote("Renseignez au moins le nom dans la langue source.");
      return;
    }
    setTranslating(true);
    setNote(null);
    try {
      const targets = CMS_LOCALES.map((l) => l.code).filter((c) => c !== sourceLocale);
      const res = await autoTranslateProduct({
        sourceLocale,
        targetLocales: targets,
        fields,
      });
      onChange({ ...locales, ...res.locales });
      setNote(`Traduit via ${res.provider}.`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Traduction impossible");
    } finally {
      setTranslating(false);
    }
  }

  const fields = localeFields(product, activeLocale);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Traductions produit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {CMS_LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setActiveLocale(l.code)}
              className={`px-3 py-1.5 text-xs border ${activeLocale === l.code ? "border-foreground bg-muted" : "border-border"}`}
            >
              {l.adminLabel}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-name-locale">Nom ({activeLocale})</Label>
          <Input
            id="product-name-locale"
            value={fields.name}
            onChange={(e) => patchLocale(activeLocale, { name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-story-locale">Description ({activeLocale})</Label>
          <Textarea
            id="product-story-locale"
            rows={5}
            value={fields.story}
            onChange={(e) => patchLocale(activeLocale, { story: e.target.value })}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>SEO title ({activeLocale})</Label>
            <Input
              value={fields.seoTitle}
              onChange={(e) => patchLocale(activeLocale, { seoTitle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Meta description ({activeLocale})</Label>
            <Input
              value={fields.metaDescription}
              onChange={(e) => patchLocale(activeLocale, { metaDescription: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-border">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Traduire depuis</Label>
            <select
              className="border border-border bg-background px-3 py-2 text-sm"
              value={sourceLocale}
              onChange={(e) => setSourceLocale(e.target.value as Locale)}
            >
              {CMS_LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.adminLabel}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={translating || translateAvailable === false}
            onClick={handleTranslate}
          >
            {translating ? "Traduction…" : "Traduire (DeepL)"}
          </Button>
          {translateAvailable === false && (
            <p className="text-xs text-amber-700">DEEPL_API_KEY non configurée.</p>
          )}
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
