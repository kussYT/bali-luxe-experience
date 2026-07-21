import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminSiteContent, updateAdminSiteContent } from "@/lib/admin-api";
import type { CareContent } from "@/lib/content-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentSubnav } from "@/components/admin/ContentSubnav";
import { CmsField } from "@/components/admin/CmsField";
import { CmsMediaField } from "@/components/admin/CmsMediaField";

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
      .then((res) => setCare({ ...res.care, images: res.care.images ?? [] }))
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
      setCare({ ...res.care, images: res.care.images ?? [] });
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
        <p className="text-sm text-muted-foreground mt-2">Page /care — visuels du guide (images dans public/care/).</p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SEO & navigation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField label="Titre (SEO / accessibilité)" value={care.title} onChange={(v) => setCare({ ...care, title: v })} />
            <CmsField
              label="Meta description (SEO)"
              value={care.metaDescription}
              onChange={(v) => setCare({ ...care, metaDescription: v })}
            />
            <CmsField label="Lien retour" value={care.backLink} onChange={(v) => setCare({ ...care, backLink: v })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Visuels du guide</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCare({ ...care, images: [...care.images, { src: "", alt: "" }] })}
            >
              Ajouter une image
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {care.images.map((img, i) => (
              <div key={i} className="border border-border p-4 space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <p className="text-sm font-medium">Image {i + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCare({ ...care, images: care.images.filter((_, j) => j !== i) })}
                  >
                    Supprimer
                  </Button>
                </div>
                <CmsMediaField
                  label="Fichier"
                  folder="care"
                  value={img.src}
                  onChange={(src) => {
                    const images = [...care.images];
                    images[i] = { ...images[i], src };
                    setCare({ ...care, images });
                  }}
                  accept="image/*"
                />
                <CmsField
                  label="Texte alternatif"
                  value={img.alt}
                  onChange={(v) => {
                    const images = [...care.images];
                    images[i] = { ...images[i], alt: v };
                    setCare({ ...care, images });
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer Care"}
        </Button>
      </form>
    </div>
  );
}
