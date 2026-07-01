import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminPages } from "@/lib/admin-api";
import { CMS_LOCALES } from "@/lib/i18n/cms-locales";
import type { CmsPage } from "@/lib/content-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/pages/")({
  head: () => ({ meta: [{ title: "Pages — Bingin Diaries Admin" }] }),
  component: AdminPagesListPage,
});

function AdminPagesListPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminPages()
      .then((res) => setPages(res.pages))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">Pages info</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Shipping, returns, FAQ, terms — une URL par page, contenu par langue (FR · EN · ID · ES).
          Pour Contact, Care, Sizing et le footer → menu <strong>Content</strong>.
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pages ({pages.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {pages.length === 0 && (
            <p className="text-muted-foreground text-sm py-4">
              Aucune page en base — utilisez « Importer le contenu par défaut » dans Content.
            </p>
          )}
          {pages.map((page) => (
            <div key={page.slug} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0">
              <div>
                <p className="font-medium">{page.title}</p>
                <p className="text-sm text-muted-foreground">/{page.slug} · {page.status || "published"}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {CMS_LOCALES.map(({ code }) => {
                    const filled = Boolean(page.locales?.[code]?.title?.trim());
                    return (
                      <span
                        key={code}
                        className={`text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${
                          filled
                            ? "border-foreground/30 text-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {code}
                      </span>
                    );
                  })}
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/pages/$slug" params={{ slug: page.slug }}>
                  Éditer
                </Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
