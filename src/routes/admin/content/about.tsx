import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminSiteContent, updateAdminSiteContent } from "@/lib/admin-api";
import type { AboutContent } from "@/lib/content-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentSubnav } from "@/components/admin/ContentSubnav";
import { CmsField } from "@/components/admin/CmsField";
import { CmsMediaField } from "@/components/admin/CmsMediaField";

export const Route = createFileRoute("/admin/content/about")({
  head: () => ({ meta: [{ title: "About — Bingin Diaries Admin" }] }),
  component: AdminAboutContentPage,
});

function AdminAboutContentPage() {
  const [about, setAbout] = useState<AboutContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminSiteContent()
      .then((res) => setAbout(res.about))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

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

  return (
    <div className="space-y-8 max-w-4xl">
      <ContentSubnav />
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">About — La marque</h2>
        <p className="text-sm text-muted-foreground mt-2">Textes, vidéo YouTube, sections et photos latérales.</p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">En-tête</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField label="Eyebrow" value={about.eyebrow} onChange={(v) => setAbout({ ...about, eyebrow: v })} />
            <CmsField label="Titre" value={about.title} onChange={(v) => setAbout({ ...about, title: v })} />
            <CmsField
              label="ID vidéo YouTube"
              value={about.youtubeId}
              onChange={(v) => setAbout({ ...about, youtubeId: v })}
              placeholder="Ol56ZDhtlnY"
            />
            <div className="sm:col-span-2">
              <CmsField
                label="Meta description (SEO)"
                value={about.metaDescription}
                onChange={(v) => setAbout({ ...about, metaDescription: v })}
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
                setAbout({
                  ...about,
                  sections: [
                    ...about.sections,
                    { id: `section-${about.sections.length + 1}`, eyebrow: "", title: "", body: "" },
                  ],
                })
              }
            >
              Ajouter une section
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {about.sections.map((section, i) => (
              <div key={i} className="border border-border p-4 rounded-sm space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <p className="text-sm font-medium">Section {i + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAbout({ ...about, sections: about.sections.filter((_, j) => j !== i) })}
                  >
                    Supprimer
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <CmsField
                    label="Ancre (id)"
                    value={section.id}
                    onChange={(v) => {
                      const sections = [...about.sections];
                      sections[i] = { ...sections[i], id: v };
                      setAbout({ ...about, sections });
                    }}
                  />
                  <CmsField
                    label="Eyebrow"
                    value={section.eyebrow}
                    onChange={(v) => {
                      const sections = [...about.sections];
                      sections[i] = { ...sections[i], eyebrow: v };
                      setAbout({ ...about, sections });
                    }}
                  />
                  <div className="sm:col-span-2">
                    <CmsField
                      label="Titre"
                      value={section.title}
                      onChange={(v) => {
                        const sections = [...about.sections];
                        sections[i] = { ...sections[i], title: v };
                        setAbout({ ...about, sections });
                      }}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <CmsField
                      label="Texte"
                      value={section.body}
                      onChange={(v) => {
                        const sections = [...about.sections];
                        sections[i] = { ...sections[i], body: v };
                        setAbout({ ...about, sections });
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
              onClick={() => setAbout({ ...about, values: [...about.values, { n: "", t: "", d: "" }] })}
            >
              Ajouter
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {about.values.map((value, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-3 border border-border p-4 rounded-sm">
                <CmsField
                  label="Numéro"
                  value={value.n}
                  onChange={(v) => {
                    const values = [...about.values];
                    values[i] = { ...values[i], n: v };
                    setAbout({ ...about, values });
                  }}
                />
                <CmsField
                  label="Titre"
                  value={value.t}
                  onChange={(v) => {
                    const values = [...about.values];
                    values[i] = { ...values[i], t: v };
                    setAbout({ ...about, values });
                  }}
                />
                <CmsField
                  label="Description"
                  value={value.d}
                  onChange={(v) => {
                    const values = [...about.values];
                    values[i] = { ...values[i], d: v };
                    setAbout({ ...about, values });
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
                setAbout({
                  ...about,
                  sidebarLinks: [...about.sidebarLinks, { label: "", to: "/about", image: "" }],
                })
              }
            >
              Ajouter
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {about.sidebarLinks.map((link, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-2 border border-border p-4 rounded-sm">
                <CmsField
                  label="Label"
                  value={link.label}
                  onChange={(v) => {
                    const sidebarLinks = [...about.sidebarLinks];
                    sidebarLinks[i] = { ...sidebarLinks[i], label: v };
                    setAbout({ ...about, sidebarLinks });
                  }}
                />
                <CmsField
                  label="Lien (chemin)"
                  value={link.to}
                  onChange={(v) => {
                    const sidebarLinks = [...about.sidebarLinks];
                    sidebarLinks[i] = { ...sidebarLinks[i], to: v };
                    setAbout({ ...about, sidebarLinks });
                  }}
                />
                <CmsField
                  label="Ancre (#, optionnel)"
                  value={link.hash ?? ""}
                  onChange={(v) => {
                    const sidebarLinks = [...about.sidebarLinks];
                    sidebarLinks[i] = { ...sidebarLinks[i], hash: v || undefined };
                    setAbout({ ...about, sidebarLinks });
                  }}
                />
                <CmsMediaField
                  label="Image (URL)"
                  value={link.image}
                  onChange={(v) => {
                    const sidebarLinks = [...about.sidebarLinks];
                    sidebarLinks[i] = { ...sidebarLinks[i], image: v };
                    setAbout({ ...about, sidebarLinks });
                  }}
                  folder={`sidebar-${i + 1}`}
                  accept="image/*"
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
