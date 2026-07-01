import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminSiteContent, updateAdminSiteContent } from "@/lib/admin-api";
import type { SizingContent } from "@/lib/content-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentSubnav } from "@/components/admin/ContentSubnav";
import { CmsField } from "@/components/admin/CmsField";
import { CmsMediaField } from "@/components/admin/CmsMediaField";

export const Route = createFileRoute("/admin/content/sizing")({
  head: () => ({ meta: [{ title: "Sizing — Bingin Diaries Admin" }] }),
  component: AdminSizingContentPage,
});

function AdminSizingContentPage() {
  const [sizing, setSizing] = useState<SizingContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminSiteContent()
      .then((res) => setSizing(res.sizing))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!sizing) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await updateAdminSiteContent({ sizing });
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

  const bodyText = sizing.body.join("\n\n");

  return (
    <div className="space-y-8 max-w-4xl">
      <ContentSubnav />
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">Guide des tailles</h2>
        <p className="text-sm text-muted-foreground mt-2">Page /sizing — texte et image du tableau des tailles.</p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contenu</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField label="Eyebrow" value={sizing.eyebrow} onChange={(v) => setSizing({ ...sizing, eyebrow: v })} />
            <CmsField label="Titre" value={sizing.title} onChange={(v) => setSizing({ ...sizing, title: v })} />
            <div className="sm:col-span-2">
              <CmsField
                label="Texte (paragraphes séparés par une ligne vide)"
                value={bodyText}
                onChange={(v) =>
                  setSizing({
                    ...sizing,
                    body: v.split(/\n\n+/).map((p) => p.trim()).filter(Boolean),
                  })
                }
                multiline
              />
            </div>
            <CmsField
              label="Meta description (SEO)"
              value={sizing.metaDescription}
              onChange={(v) => setSizing({ ...sizing, metaDescription: v })}
            />
            <CmsField label="Lien retour" value={sizing.backLink} onChange={(v) => setSizing({ ...sizing, backLink: v })} />
            <div className="sm:col-span-2">
              <CmsMediaField
                label="Image du guide"
                value={sizing.image}
                onChange={(v) => setSizing({ ...sizing, image: v })}
                folder="sizing"
                accept="image/*"
              />
            </div>
            <CmsField
              label="Texte alternatif image"
              value={sizing.imageAlt}
              onChange={(v) => setSizing({ ...sizing, imageAlt: v })}
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
