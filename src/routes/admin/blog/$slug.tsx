import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminPost, saveAdminPost } from "@/lib/admin-api";
import type { JournalPost } from "@/lib/content-types";
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

export const Route = createFileRoute("/admin/blog/$slug")({
  head: () => ({ meta: [{ title: "Edit article — Bingin Diaries Admin" }] }),
  component: AdminBlogEditPage,
});

const EMPTY: JournalPost & { status: string } = {
  slug: "",
  title: "",
  excerpt: "",
  image: "",
  category: "",
  readMinutes: 5,
  body: [],
  status: "draft",
};

function AdminBlogEditPage() {
  const { slug: routeSlug } = Route.useParams();
  const navigate = useNavigate();
  const isNew = routeSlug === "new";
  const [post, setPost] = useState<JournalPost & { status: string }>(EMPTY);
  const [bodyText, setBodyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) {
      setPost(EMPTY);
      setBodyText("");
      return;
    }
    fetchAdminPost(routeSlug)
      .then((res) => {
        setPost({ ...res.post, status: res.post.status || "published" });
        setBodyText((res.post.body || []).join("\n\n"));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [routeSlug, isNew]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = bodyText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
      const res = await saveAdminPost({ ...post, body });
      if (isNew) {
        navigate({ to: "/admin/blog/$slug", params: { slug: res.post.slug } });
      } else {
        setPost({ ...res.post, status: res.post.status || post.status });
        setBodyText((res.post.body || []).join("\n\n"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link to="/admin/blog" className="text-sm text-muted-foreground hover:text-foreground">
          ← Blog
        </Link>
        <h2 className="font-display text-4xl mt-4">{isNew ? "Nouvel article" : "Éditer l'article"}</h2>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={post.slug}
                onChange={(e) => setPost({ ...post, slug: e.target.value })}
                disabled={!isNew}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Extrait</Label>
              <Textarea id="excerpt" value={post.excerpt} onChange={(e) => setPost({ ...post, excerpt: e.target.value })} rows={2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Input id="category" value={post.category} onChange={(e) => setPost({ ...post, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="readMinutes">Temps de lecture (min)</Label>
                <Input
                  id="readMinutes"
                  type="number"
                  min={1}
                  value={post.readMinutes}
                  onChange={(e) => setPost({ ...post, readMinutes: Number(e.target.value) || 5 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image (URL)</Label>
              <Input id="image" value={post.image} onChange={(e) => setPost({ ...post, image: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={post.status} onValueChange={(v) => setPost({ ...post, status: v })}>
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
              <Label htmlFor="body">Corps (paragraphes séparés par une ligne vide)</Label>
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
