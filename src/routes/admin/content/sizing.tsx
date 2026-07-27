import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  autoTranslateSizing,
  fetchAdminSiteContent,
  fetchTranslateStatus,
  updateAdminSiteContent,
} from "@/lib/admin-api";
import type { SizingLocaleFields, SizingStored } from "@/lib/content-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ContentSubnav } from "@/components/admin/ContentSubnav";
import { CmsField } from "@/components/admin/CmsField";
import { CmsMediaField } from "@/components/admin/CmsMediaField";
import { CMS_LOCALES, emptySizingLocaleFields } from "@/lib/i18n/cms-locales";
import type { Locale } from "@/lib/i18n/messages";

export const Route = createFileRoute("/admin/content/sizing")({
  head: () => ({ meta: [{ title: "Sizing — Bingin Diaries Admin" }] }),
  component: AdminSizingContentPage,
});

function localeFields(stored: SizingStored, code: Locale): SizingLocaleFields {
  return stored.locales?.[code] || emptySizingLocaleFields();
}

function AdminSizingContentPage() {
  const [sizing, setSizing] = useState<SizingStored | null>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>("fr");
  const [sourceLocale, setSourceLocale] = useState<Locale>("fr");
  const [bodyTextByLocale, setBodyTextByLocale] = useState<Partial<Record<Locale, string>>>({});
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
      .then((res) => {
        setSizing(res.sizing);
        const bodies: Partial<Record<Locale, string>> = {};
        for (const { code } of CMS_LOCALES) {
          bodies[code] = (res.sizing.locales?.[code]?.body || []).join("\n\n");
        }
        setBodyTextByLocale(bodies);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  function patchLocale(code: Locale, patch: Partial<SizingLocaleFields>) {
    if (!sizing) return;
    const current = localeFields(sizing, code);
    setSizing({
      ...sizing,
      locales: {
        ...sizing.locales,
        [code]: { ...current, ...patch },
      },
    });
  }

  async function handleTranslate() {
    if (!sizing) return;
    const fields = localeFields(sizing, sourceLocale);
    const bodyRaw = bodyTextByLocale[sourceLocale] ?? "";
    const body = bodyRaw
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!fields.title.trim()) {
      setTranslateNote("Renseignez un titre dans la langue source avant de traduire.");
      return;
    }
    setTranslating(true);
    setTranslateNote(null);
    setError(null);
    try {
      const targets = CMS_LOCALES.map((l) => l.code).filter((c) => c !== sourceLocale);
      const res = await autoTranslateSizing({
        sourceLocale,
        targetLocales: targets,
        fields: { ...fields, body },
      });
      setSizing({
        ...sizing,
        locales: {
          ...sizing.locales,
          [sourceLocale]: { ...fields, body },
          ...res.locales,
        },
      });
      const bodies: Partial<Record<Locale, string>> = { ...bodyTextByLocale, [sourceLocale]: bodyRaw };
      for (const code of targets) {
        const translated = res.locales[code];
        if (translated) bodies[code as Locale] = (translated.body || []).join("\n\n");
      }
      setBodyTextByLocale(bodies);
      setTranslateNote(`Traduit via ${res.provider}. Relisez les autres langues avant publication.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Traduction impossible");
    } finally {
      setTranslating(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!sizing) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const locales = { ...sizing.locales } as SizingStored["locales"];
      for (const { code } of CMS_LOCALES) {
        const text = bodyTextByLocale[code] ?? "";
        const fields = localeFields(sizing, code);
        locales[code] = {
          ...fields,
          body: text
            .split(/\n\n+/)
            .map((p) => p.trim())
            .filter(Boolean),
        };
      }
      const payload: SizingStored = { ...sizing, locales };
      const res = await updateAdminSiteContent({ sizing: payload });
      setSizing(res.sizing);
      setMessage("Guide des tailles enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!sizing) {
    return <p className="text-muted-foreground">{error || "Chargement…"}</p>;
  }

  const fields = localeFields(sizing, activeLocale);
  const bodyText = bodyTextByLocale[activeLocale] ?? "";

  return (
    <div className="space-y-8 max-w-4xl">
      <ContentSubnav />
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">Guide des tailles</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Page /sizing — texte par langue (DeepL) et image partagée.
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {translateNote && <p className="text-sm text-muted-foreground">{translateNote}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Langue & traduction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CMS_LOCALES.map((l) => (
                <Button
                  key={l.code}
                  type="button"
                  size="sm"
                  variant={activeLocale === l.code ? "default" : "outline"}
                  onClick={() => setActiveLocale(l.code)}
                >
                  {l.adminLabel}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Langue source DeepL</Label>
                <div className="flex flex-wrap gap-2">
                  {CMS_LOCALES.map((l) => (
                    <Button
                      key={l.code}
                      type="button"
                      size="sm"
                      variant={sourceLocale === l.code ? "secondary" : "ghost"}
                      onClick={() => setSourceLocale(l.code)}
                    >
                      {l.code.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={translating || translateAvailable === false}
                onClick={handleTranslate}
              >
                {translating
                  ? "Traduction…"
                  : translateAvailable === false
                    ? "DeepL non configuré"
                    : "Traduire les autres langues"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Image partagée</CardTitle>
          </CardHeader>
          <CardContent>
            <CmsMediaField
              label="Image du guide"
              value={sizing.image}
              onChange={(v) => setSizing({ ...sizing, image: v })}
              folder="sizing"
              accept="image/*"
              focal={sizing.imageFocal}
              onFocalChange={(imageFocal) => setSizing({ ...sizing, imageFocal })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contenu ({activeLocale.toUpperCase()})</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField
              label="Eyebrow"
              value={fields.eyebrow}
              onChange={(v) => patchLocale(activeLocale, { eyebrow: v })}
            />
            <CmsField
              label="Titre"
              value={fields.title}
              onChange={(v) => patchLocale(activeLocale, { title: v })}
            />
            <div className="sm:col-span-2">
              <CmsField
                label="Texte (paragraphes séparés par une ligne vide)"
                value={bodyText}
                onChange={(v) => setBodyTextByLocale({ ...bodyTextByLocale, [activeLocale]: v })}
                multiline
              />
            </div>
            <CmsField
              label="Meta description (SEO)"
              value={fields.metaDescription}
              onChange={(v) => patchLocale(activeLocale, { metaDescription: v })}
            />
            <CmsField
              label="Lien retour"
              value={fields.backLink}
              onChange={(v) => patchLocale(activeLocale, { backLink: v })}
            />
            <CmsField
              label="Texte alternatif image"
              value={fields.imageAlt}
              onChange={(v) => patchLocale(activeLocale, { imageAlt: v })}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer Sizing"}
        </Button>
      </form>
    </div>
  );
}
