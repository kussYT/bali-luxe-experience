import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { deleteAdminPost, fetchAdminPosts } from "@/lib/admin-api";
import type { JournalPost } from "@/lib/content-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/blog/")({
  head: () => ({ meta: [{ title: "Blog — Bingin Diaries Admin" }] }),
  component: AdminBlogListPage,
});

function AdminBlogListPage() {
  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetchAdminPosts();
      setPosts(res.posts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load posts");
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`Supprimer l'article « ${slug} » ?`)) return;
    try {
      await deleteAdminPost(slug);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-muted-foreground">CMS</p>
          <h2 className="font-display text-4xl mt-2">Blog</h2>
        </div>
        <Button asChild>
          <Link to="/admin/blog/$slug" params={{ slug: "new" }}>
            Nouvel article
          </Link>
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Articles ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {posts.length === 0 && <p className="text-muted-foreground text-sm py-4">Aucun article en base.</p>}
          {posts.map((post) => (
            <div key={post.slug} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0">
              <div>
                <p className="font-medium">{post.title}</p>
                <p className="text-sm text-muted-foreground">
                  /journal/{post.slug} · {post.status || "published"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/blog/$slug" params={{ slug: post.slug }}>
                    Éditer
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(post.slug)}>
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
