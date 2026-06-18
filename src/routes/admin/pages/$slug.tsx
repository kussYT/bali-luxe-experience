import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminPage, saveAdminPage } from "@/lib/admin-api";
import type { CmsPage } from "@/lib/content-types";
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

function AdminPageEditPage() {
  const { slug } = Route.useParams();
  const [page, setPage] = useState<CmsPage & { status: string } | null>(null);
  const [bodyText, setBodyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminPage(slug)
      .then((res) => {
        setPage({ ...res.page, status: res.page.status || "published" });
        setBodyText((res.page.body || []).join("\n\n"));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [slug]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!page) return;
    setSaving(true);
    setError(null);
    try {
      const body = bodyText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
      const res = await saveAdminPage({ ...page, body });
      setPage({ ...res.page, status: res.page.status || page.status });
      setBodyText((res.page.body || []).join("\n\n"));
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

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link to="/admin/pages" className="text-sm text-muted-foreground hover:text-foreground">
          ← Pages
        </Link>
        <h2 className="font-display text-4xl mt-4">Éditer /{slug}</h2>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{page.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eyebrow">Eyebrow</Label>
              <Input id="eyebrow" value={page.eyebrow} onChange={(e) => setPage({ ...page, eyebrow: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta">Meta description</Label>
              <Input
                id="meta"
                value={page.metaDescription}
                onChange={(e) => setPage({ ...page, metaDescription: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
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
            <div className="space-y-2">
              <Label htmlFor="body">Contenu (paragraphes séparés par une ligne vide)</Label>
              <Textarea id="body" value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={12} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
