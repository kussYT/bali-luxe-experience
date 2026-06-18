import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { fetchAdminCmsStatus, type AdminCmsStatus } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function CmsStatusCard({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<AdminCmsStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminCmsStatus()
      .then(setStatus)
      .catch((e) => setError(e instanceof Error ? e.message : "Status unavailable"));
  }, []);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">Chargement de l'état CMS…</CardContent>
      </Card>
    );
  }

  const ig = status.instagram;

  return (
    <Card>
      <CardHeader className={compact ? "pb-2" : undefined}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">État CMS</CardTitle>
          {!compact && (
            <Link to="/admin/content" className="text-eyebrow link-underline !text-muted-foreground">
              Éditer le contenu
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-eyebrow text-muted-foreground">Base de données</p>
            <p className="mt-1">{status.database ? "Postgres connecté" : "Non configurée"}</p>
          </div>
          {status.cms && (
            <div>
              <p className="text-eyebrow text-muted-foreground">Contenu</p>
              <p className="mt-1">
                {status.cms.posts} articles · {status.cms.pages} pages · {status.cms.collections} collections
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-eyebrow text-muted-foreground">Instagram (cache)</p>
            <p className="mt-1">
              Source : <span className="font-mono text-xs">{ig.source}</span>
            </p>
            <p className="text-muted-foreground mt-1">
              {ig.postCount} posts · {ig.localImages} images locales
              {ig.cdnImages > 0 && ` · ${ig.cdnImages} CDN expirées`}
            </p>
            <p className="text-muted-foreground mt-1">Dernier sync : {formatDate(ig.syncedAt)}</p>
          </div>
          <div>
            <p className="text-eyebrow text-muted-foreground">API Instagram</p>
            <p className="mt-1">
              Token : {status.instagramApi.hasToken ? "configuré" : "manquant"}
              {status.instagramApi.hasUserId ? " · User ID ok" : ""}
            </p>
            {ig.needsRefresh && (
              <p className="text-amber-700 dark:text-amber-400 mt-2">
                Refresh recommandé — lance <code className="text-xs">npm run instagram:refresh</code>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
