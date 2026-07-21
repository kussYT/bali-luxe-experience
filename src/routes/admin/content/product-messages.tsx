import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  autoTranslateProductMessages,
  fetchAdminSiteContent,
  fetchTranslateStatus,
  updateAdminSiteContent,
} from "@/lib/admin-api";
import type { ProductMessagesLocaleFields, ProductMessagesStored } from "@/lib/content-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ContentSubnav } from "@/components/admin/ContentSubnav";
import { CmsField } from "@/components/admin/CmsField";
import { CMS_LOCALES, emptyProductMessagesLocaleFields } from "@/lib/i18n/cms-locales";
import type { Locale } from "@/lib/i18n/messages";

export const Route = createFileRoute("/admin/content/product-messages")({
  head: () => ({ meta: [{ title: "Product messages — Bingin Diaries Admin" }] }),
  component: AdminProductMessagesPage,
});

function localeFields(stored: ProductMessagesStored, code: Locale): ProductMessagesLocaleFields {
  return stored.locales?.[code] || emptyProductMessagesLocaleFields();
}

function AdminProductMessagesPage() {
  const [messages, setMessages] = useState<ProductMessagesStored | null>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>("fr");
  const [sourceLocale, setSourceLocale] = useState<Locale>("fr");
  const [translateAvailable, setTranslateAvailable] = useState<boolean | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateNote, setTranslateNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTranslateStatus()
      .then((s) => setTranslateAvailable(s.available))
      .catch(() => setTranslateAvailable(false));
  }, []);

  useEffect(() => {
    fetchAdminSiteContent()
      .then((res) => setMessages(res.productMessages))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  function patchLocale(code: Locale, patch: Partial<ProductMessagesLocaleFields>) {
    if (!messages) return;
    const current = localeFields(messages, code);
    setMessages({
      locales: {
        ...messages.locales,
        [code]: { ...current, ...patch },
      },
    });
  }

  async function handleTranslate() {
    if (!messages) return;
    const fields = localeFields(messages, sourceLocale);
    if (!fields.addToBag.trim()) {
      setTranslateNote("Renseignez au moins « Ajouter au panier » dans la langue source.");
      return;
    }
    setTranslating(true);
    setTranslateNote(null);
    setError(null);
    try {
      const targets = CMS_LOCALES.map((l) => l.code).filter((c) => c !== sourceLocale);
      const res = await autoTranslateProductMessages({
        sourceLocale,
        targetLocales: targets,
        fields,
      });
      setMessages({
        locales: { ...messages.locales, ...res.locales },
      });
      setTranslateNote(`Traduit via ${res.provider}. Relisez les variables {country}, {warehouse}, etc.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Traduction impossible");
    } finally {
      setTranslating(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!messages) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await updateAdminSiteContent({ productMessages: messages });
      setMessages(res.productMessages);
      setMessage("Messages produit enregistrés.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!messages) {
    return <p className="text-muted-foreground">{error || "Chargement…"}</p>;
  }

  const fields = localeFields(messages, activeLocale);

  return (
    <div className="space-y-8 max-w-4xl">
      <ContentSubnav />
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">Messages fiche produit</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Textes affichés sur les pages produit, par langue. Variables :{" "}
          <code className="text-xs">{"{country}"}</code>, <code className="text-xs">{"{warehouse}"}</code>,{" "}
          <code className="text-xs">{"{count}"}</code>, <code className="text-xs">{"{variant}"}</code> — laissées
          telles quelles, elles seront remplacées automatiquement sur le site.
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Traductions</CardTitle>
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

            <div className="flex flex-wrap items-end gap-3 pb-4 border-b border-border">
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
              {translateNote && <p className="text-xs text-muted-foreground">{translateNote}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Disponibilité & stock ({activeLocale})</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <CmsField
              label="Note — indisponible dans la région"
              value={fields.regionalUnavailable}
              onChange={(v) => patchLocale(activeLocale, { regionalUnavailable: v })}
              multiline
            />
            <CmsField
              label="Bouton — indisponible"
              value={fields.unavailableInRegion}
              onChange={(v) => patchLocale(activeLocale, { unavailableInRegion: v })}
            />
            <CmsField
              label="Rupture de stock"
              value={fields.soldOut}
              onChange={(v) => patchLocale(activeLocale, { soldOut: v })}
            />
            <CmsField
              label="Ajouter au panier"
              value={fields.addToBag}
              onChange={(v) => patchLocale(activeLocale, { addToBag: v })}
            />
            <CmsField
              label="Ligne stock ({count}, {variant}, {warehouse})"
              value={fields.inStock}
              onChange={(v) => patchLocale(activeLocale, { inStock: v })}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </div>
  );
}
