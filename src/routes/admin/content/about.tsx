import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  autoTranslateAbout,
  fetchAdminSiteContent,
  fetchTranslateStatus,
  updateAdminSiteContent,
} from "@/lib/admin-api";
import type { AboutLocaleFields, AboutStored } from "@/lib/content-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ContentSubnav } from "@/components/admin/ContentSubnav";
import { CmsField } from "@/components/admin/CmsField";
import { CmsMediaField } from "@/components/admin/CmsMediaField";
import { CMS_LOCALES, emptyAboutLocaleFields } from "@/lib/i18n/cms-locales";
import type { Locale } from "@/lib/i18n/messages";

export const Route = createFileRoute("/admin/content/about")({
  head: () => ({ meta: [{ title: "About — Bingin Diaries Admin" }] }),
  component: AdminAboutContentPage,
});

function localeFields(stored: AboutStored, code: Locale): AboutLocaleFields {
  return stored.locales?.[code] || emptyAboutLocaleFields();
}

function AdminAboutContentPage() {
  const [about, setAbout] = useState<AboutStored | null>(null);
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
      .then((res) => setAbout(res.about))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  function patchLocale(code: Locale, patch: Partial<AboutLocaleFields>) {
    if (!about) return;
    const current = localeFields(about, code);
    setAbout({
      ...about,
      locales: {
        ...about.locales,
        [code]: { ...current, ...patch },
      },
    });
  }

  async function handleTranslate() {
    if (!about) return;
    const fields = localeFields(about, sourceLocale);
    if (!fields.title.trim()) {
      setTranslateNote("Renseignez un titre dans la langue source avant de traduire.");
      return;
    }
    setTranslating(true);
    setTranslateNote(null);
    setError(null);
    try {
      const targets = CMS_LOCALES.map((l) => l.code).filter((c) => c !== sourceLocale);
      const res = await autoTranslateAbout({
        sourceLocale,
        targetLocales: targets,
        fields,
      });
      setAbout({
        ...about,
        locales: { ...about.locales, ...res.locales },
      });
      setTranslateNote(`Traduit via ${res.provider}. Relisez les autres langues avant publication.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Traduction impossible");
    } finally {
      setTranslating(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!about) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await updateAdminSiteContent({ about });
      setAbout(res.about);
      setMessage("Page About enregistrée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!about) {
    return <p className="text-muted-foreground">{error || "Chargement…"}</p>;
  }

  const fields = localeFields(about, activeLocale);

  return (
    <div className="space-y-8 max-w-4xl">
      <ContentSubnav />
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">About — La marque</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Textes, vidéo YouTube, sections et photos latérales — par langue (DeepL).
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
            <CardTitle className="text-lg">Partagé (toutes langues)</CardTitle>
          </CardHeader>
          <CardContent>
            <CmsField
              label="ID vidéo YouTube"
              value={about.youtubeId}
              onChange={(v) => setAbout({ ...about, youtubeId: v })}
              placeholder="Ol56ZDhtlnY"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">En-tête ({activeLocale.toUpperCase()})</CardTitle>
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
                label="Meta description (SEO)"
                value={fields.metaDescription}
                onChange={(v) => patchLocale(activeLocale, { metaDescription: v })}
                multiline
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Sections de texte</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                patchLocale(activeLocale, {
                  sections: [
                    ...fields.sections,
                    { id: `section-${fields.sections.length + 1}`, eyebrow: "", title: "", body: "" },
                  ],
                })
              }
            >
              Ajouter une section
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.sections.map((section, i) => (
              <div key={i} className="border border-border p-4 rounded-sm space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <p className="text-sm font-medium">Section {i + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      patchLocale(activeLocale, {
                        sections: fields.sections.filter((_, j) => j !== i),
                      })
                    }
                  >
                    Supprimer
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <CmsField
                    label="Ancre (id)"
                    value={section.id}
                    onChange={(v) => {
                      const sections = [...fields.sections];
                      sections[i] = { ...sections[i], id: v };
                      patchLocale(activeLocale, { sections });
                    }}
                  />
                  <CmsField
                    label="Eyebrow"
                    value={section.eyebrow}
                    onChange={(v) => {
                      const sections = [...fields.sections];
                      sections[i] = { ...sections[i], eyebrow: v };
                      patchLocale(activeLocale, { sections });
                    }}
                  />
                  <div className="sm:col-span-2">
                    <CmsField
                      label="Titre"
                      value={section.title}
                      onChange={(v) => {
                        const sections = [...fields.sections];
                        sections[i] = { ...sections[i], title: v };
                        patchLocale(activeLocale, { sections });
                      }}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <CmsField
                      label="Texte"
                      value={section.body}
                      onChange={(v) => {
                        const sections = [...fields.sections];
                        sections[i] = { ...sections[i], body: v };
                        patchLocale(activeLocale, { sections });
                      }}
                      multiline
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Valeurs (3 colonnes)</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                patchLocale(activeLocale, {
                  values: [...fields.values, { n: "", t: "", d: "" }],
                })
              }
            >
              Ajouter
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.values.map((value, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-3 border border-border p-4 rounded-sm">
                <CmsField
                  label="Numéro"
                  value={value.n}
                  onChange={(v) => {
                    const values = [...fields.values];
                    values[i] = { ...values[i], n: v };
                    patchLocale(activeLocale, { values });
                  }}
                />
                <CmsField
                  label="Titre"
                  value={value.t}
                  onChange={(v) => {
                    const values = [...fields.values];
                    values[i] = { ...values[i], t: v };
                    patchLocale(activeLocale, { values });
                  }}
                />
                <CmsField
                  label="Description"
                  value={value.d}
                  onChange={(v) => {
                    const values = [...fields.values];
                    values[i] = { ...values[i], d: v };
                    patchLocale(activeLocale, { values });
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Photos latérales (Explore)</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                patchLocale(activeLocale, {
                  sidebarLinks: [...fields.sidebarLinks, { label: "", to: "/about", image: "" }],
                })
              }
            >
              Ajouter
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.sidebarLinks.map((link, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-2 border border-border p-4 rounded-sm">
                <CmsField
                  label="Label"
                  value={link.label}
                  onChange={(v) => {
                    const sidebarLinks = [...fields.sidebarLinks];
                    sidebarLinks[i] = { ...sidebarLinks[i], label: v };
                    patchLocale(activeLocale, { sidebarLinks });
                  }}
                />
                <CmsField
                  label="Lien (chemin)"
                  value={link.to}
                  onChange={(v) => {
                    const sidebarLinks = [...fields.sidebarLinks];
                    sidebarLinks[i] = { ...sidebarLinks[i], to: v };
                    patchLocale(activeLocale, { sidebarLinks });
                  }}
                />
                <CmsField
                  label="Ancre (#, optionnel)"
                  value={link.hash ?? ""}
                  onChange={(v) => {
                    const sidebarLinks = [...fields.sidebarLinks];
                    sidebarLinks[i] = { ...sidebarLinks[i], hash: v || undefined };
                    patchLocale(activeLocale, { sidebarLinks });
                  }}
                />
                <CmsMediaField
                  label="Image (URL)"
                  value={link.image}
                  onChange={(v) => {
                    const sidebarLinks = [...fields.sidebarLinks];
                    sidebarLinks[i] = { ...sidebarLinks[i], image: v };
                    patchLocale(activeLocale, { sidebarLinks });
                  }}
                  folder={`sidebar-${i + 1}`}
                  accept="image/*"
                  focal={link.imageFocal}
                  onFocalChange={(imageFocal) => {
                    const sidebarLinks = [...fields.sidebarLinks];
                    sidebarLinks[i] = { ...sidebarLinks[i], imageFocal };
                    patchLocale(activeLocale, { sidebarLinks });
                  }}
                  focalAspect={3 / 4}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer About"}
        </Button>
      </form>
    </div>
  );
}
