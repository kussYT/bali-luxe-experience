import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminSiteContent, updateAdminSiteContent } from "@/lib/admin-api";
import type { CareContent } from "@/lib/content-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentSubnav } from "@/components/admin/ContentSubnav";
import { CmsField } from "@/components/admin/CmsField";

export const Route = createFileRoute("/admin/content/care")({
  head: () => ({ meta: [{ title: "Care — Bingin Diaries Admin" }] }),
  component: AdminCareContentPage,
});

function AdminCareContentPage() {
  const [care, setCare] = useState<CareContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminSiteContent()
      .then((res) => setCare(res.care))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!care) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await updateAdminSiteContent({ care });
      setCare(res.care);
      setMessage("Guide d'entretien enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!care) {
    return <p className="text-muted-foreground">{error || "Chargement…"}</p>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <ContentSubnav />
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">Guide d&apos;entretien</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Page /care — PDF officiel ou conseils par matière (si pas de PDF).
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">En-tête</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField label="Eyebrow" value={care.eyebrow} onChange={(v) => setCare({ ...care, eyebrow: v })} />
            <CmsField label="Titre" value={care.title} onChange={(v) => setCare({ ...care, title: v })} />
            <div className="sm:col-span-2">
              <CmsField label="Introduction" value={care.intro} onChange={(v) => setCare({ ...care, intro: v })} multiline />
            </div>
            <CmsField
              label="Meta description (SEO)"
              value={care.metaDescription}
              onChange={(v) => setCare({ ...care, metaDescription: v })}
            />
            <CmsField label="Lien retour" value={care.backLink} onChange={(v) => setCare({ ...care, backLink: v })} />
            <CmsField
              label="PDF (URL publique)"
              value={care.pdfUrl ?? ""}
              onChange={(v) => setCare({ ...care, pdfUrl: v })}
              placeholder="/docs/washcare-rev.pdf"
            />
            <CmsField
              label="Libellé lien PDF"
              value={care.pdfDownloadLabel ?? ""}
              onChange={(v) => setCare({ ...care, pdfDownloadLabel: v })}
            />
          </CardContent>
        </Card>

        {!care.pdfUrl?.trim() && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Sections par matière</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCare({ ...care, sections: [...care.sections, { title: "", tips: [] }] })}
            >
              Ajouter une section
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {care.sections.map((section, i) => (
              <div key={i} className="border border-border p-4 rounded-sm space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <p className="text-sm font-medium">Section {i + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCare({ ...care, sections: care.sections.filter((_, j) => j !== i) })}
                  >
                    Supprimer
                  </Button>
                </div>
                <CmsField
                  label="Titre matière"
                  value={section.title}
                  onChange={(v) => {
                    const sections = [...care.sections];
                    sections[i] = { ...sections[i], title: v };
                    setCare({ ...care, sections });
                  }}
                />
                <CmsField
                  label="Conseils (un par ligne)"
                  value={section.tips.join("\n")}
                  onChange={(v) => {
                    const sections = [...care.sections];
                    sections[i] = {
                      ...sections[i],
                      tips: v.split("\n").map((t) => t.trim()).filter(Boolean),
                    };
                    setCare({ ...care, sections });
                  }}
                  multiline
                />
              </div>
            ))}
          </CardContent>
        </Card>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer Care"}
        </Button>
      </form>
    </div>
  );
}
