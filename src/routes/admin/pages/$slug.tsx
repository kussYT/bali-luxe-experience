import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminPage, saveAdminPage, autoTranslatePage } from "@/lib/admin-api";
import type { CmsPage, CmsPageLocaleFields } from "@/lib/content-types";
import { CMS_LOCALES, emptyPageLocaleFields } from "@/lib/i18n/cms-locales";
import type { Locale } from "@/lib/i18n/messages";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/pages/$slug")({
  head: () => ({ meta: [{ title: "Edit page — Bingin Diaries Admin" }] }),
  component: AdminPageEditPage,
});

function localeFields(page: CmsPage, code: Locale): CmsPageLocaleFields {
  return page.locales?.[code] || emptyPageLocaleFields();
}

function bodyText(fields: CmsPageLocaleFields) {
  return (fields.body || []).join("\n\n");
}

function AdminPageEditPage() {
  const { slug } = Route.useParams();
  const [page, setPage] = useState<(CmsPage & { status: string }) | null>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>("fr");
  const [bodyTextByLocale, setBodyTextByLocale] = useState<Partial<Record<Locale, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateNote, setTranslateNote] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminPage(slug)
      .then((res) => {
        const loaded = { ...res.page, status: res.page.status || "published" };
        const locales = loaded.locales || {};
        if (!loaded.locales?.en && loaded.title) {
          locales.en = {
            title: loaded.title,
            eyebrow: loaded.eyebrow,
            metaDescription: loaded.metaDescription,
            body: loaded.body || [],
          };
          loaded.locales = locales;
        }
        setPage(loaded);
        const bodies: Partial<Record<Locale, string>> = {};
        for (const { code } of CMS_LOCALES) {
          bodies[code] = bodyText(localeFields(loaded, code));
        }
        setBodyTextByLocale(bodies);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [slug]);

  function patchLocale(code: Locale, patch: Partial<CmsPageLocaleFields>) {
    if (!page) return;
    const current = localeFields(page, code);
    setPage({
      ...page,
      locales: {
        ...page.locales,
        [code]: { ...current, ...patch },
      },
    });
  }

  async function handleAutoTranslate() {
    if (!page) return;
    const source = activeLocale;
    const title = localeFields(page, source).title.trim();
    if (!title) {
      setError("Ajoutez un titre dans la langue active avant de traduire.");
      return;
    }
    const bodyRaw = bodyTextByLocale[source] ?? "";
    const body = bodyRaw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const fields = localeFields(page, source);

    setTranslating(true);
    setError(null);
    setTranslateNote(null);
    try {
      const targetLocales = CMS_LOCALES.map((l) => l.code).filter((c) => c !== source);
      const res = await autoTranslatePage({
        sourceLocale: source,
        targetLocales,
        fields: {
          title: fields.title,
          eyebrow: fields.eyebrow,
          metaDescription: fields.metaDescription,
          body,
        },
      });

      setPage({
        ...page,
        locales: {
          ...page.locales,
          [source]: { ...fields, body },
          ...res.locales,
        },
      });

      const bodies: Partial<Record<Locale, string>> = { ...bodyTextByLocale, [source]: bodyRaw };
      for (const code of targetLocales) {
        const translated = res.locales[code];
        if (translated) bodies[code as Locale] = (translated.body || []).join("\n\n");
      }
      setBodyTextByLocale(bodies);
      setTranslateNote(
        `Traduction auto (${res.provider}) vers ${targetLocales.join(", ").toUpperCase()} — relisez et ajustez si besoin.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Traduction impossible");
    } finally {
      setTranslating(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!page) return;
    setSaving(true);
    setError(null);
    try {
      const locales = { ...page.locales } as Partial<Record<Locale, CmsPageLocaleFields>>;
      for (const { code } of CMS_LOCALES) {
        const text = bodyTextByLocale[code] ?? "";
        const fields = localeFields(page, code);
        locales[code] = {
          ...fields,
          body: text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean),
        };
      }
      const res = await saveAdminPage({ slug: page.slug, status: page.status, locales });
      const loaded = { ...res.page, status: res.page.status || page.status };
      setPage(loaded);
      const bodies: Partial<Record<Locale, string>> = {};
      for (const { code } of CMS_LOCALES) {
        bodies[code] = bodyText(localeFields(loaded, code));
      }
      setBodyTextByLocale(bodies);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!page && !error) {
    return <p className="text-muted-foreground">Chargement…</p>;
  }

  if (!page) {
    return <p className="text-destructive">{error}</p>;
  }

  const fields = localeFields(page, activeLocale);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link to="/admin/pages" className="text-sm text-muted-foreground hover:text-foreground">
          ← Pages
        </Link>
        <h2 className="font-display text-4xl mt-4">Éditer /{slug}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Une URL par page — traduisez le contenu par langue (FR, EN, ID, ES). Le visiteur voit la version
          correspondant à son sélecteur de langue.
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {translateNote && <p className="text-sm text-muted-foreground">{translateNote}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {CMS_LOCALES.map(({ code, adminLabel }) => {
          const hasContent = Boolean(localeFields(page, code).title?.trim());
          return (
            <Button
              key={code}
              type="button"
              size="sm"
              variant={activeLocale === code ? "default" : "outline"}
              onClick={() => setActiveLocale(code)}
            >
              {adminLabel}
              {!hasContent && activeLocale !== code ? " · vide" : ""}
            </Button>
          );
        })}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="ml-auto"
          disabled={translating}
          onClick={handleAutoTranslate}
        >
          {translating
            ? "Traduction…"
            : `Traduire depuis ${CMS_LOCALES.find((l) => l.code === activeLocale)?.adminLabel}`}
        </Button>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {CMS_LOCALES.find((l) => l.code === activeLocale)?.adminLabel} — /{slug}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={fields.title}
                onChange={(e) => patchLocale(activeLocale, { title: e.target.value })}
                required={activeLocale === "en" || activeLocale === "fr"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eyebrow">Eyebrow</Label>
              <Input
                id="eyebrow"
                value={fields.eyebrow}
                onChange={(e) => patchLocale(activeLocale, { eyebrow: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta">Meta description</Label>
              <Input
                id="meta"
                value={fields.metaDescription}
                onChange={(e) => patchLocale(activeLocale, { metaDescription: e.target.value })}
              />
            </div>
            {activeLocale === "fr" && (
              <div className="space-y-2">
                <Label>Statut (toute la page)</Label>
                <Select value={page.status} onValueChange={(v) => setPage({ ...page, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="body">Contenu (paragraphes séparés par une ligne vide)</Label>
              <Textarea
                id="body"
                value={bodyTextByLocale[activeLocale] ?? ""}
                onChange={(e) =>
                  setBodyTextByLocale((prev) => ({ ...prev, [activeLocale]: e.target.value }))
                }
                rows={12}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer toutes les langues"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
