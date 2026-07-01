import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminSiteContent, updateAdminSiteContent } from "@/lib/admin-api";
import type { HomepageContent, MegaMenuFeaturedContent, MegaMenuFeaturedTile } from "@/lib/content-types";
import { ContentSubnav } from "@/components/admin/ContentSubnav";
import { CmsMediaField } from "@/components/admin/CmsMediaField";
import { CmsField } from "@/components/admin/CmsField";
import { UploadsUnavailableBanner } from "@/components/admin/UploadsUnavailableBanner";
import { useUploadsAvailable } from "@/lib/use-uploads-available";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/content/navigation")({
  head: () => ({ meta: [{ title: "Navigation menu — Bingin Diaries Admin" }] }),
  component: AdminNavigationContentPage,
});

const SECTIONS: { key: keyof MegaMenuFeaturedContent; title: string; hint: string }[] = [
  {
    key: "about",
    title: "À propos (ex. Travel Diaries, The brand)",
    hint: "Images à droite quand on survole « À propos » dans le menu.",
  },
  {
    key: "shop",
    title: "Boutique",
    hint: "Images à droite du menu Boutique.",
  },
  {
    key: "newCollection",
    title: "Nouvelle collection",
    hint: "Images à droite du menu Nouvelle collection.",
  },
  {
    key: "sales",
    title: "Soldes",
    hint: "Images à droite du menu Soldes.",
  },
];

function emptyTile(): MegaMenuFeaturedTile {
  return { label: "", to: "/collection", image: "" };
}

export function AdminNavigationContentPage() {
  const [homepage, setHomepage] = useState<HomepageContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { available: uploadsAvailable, loading: uploadsLoading } = useUploadsAvailable();

  useEffect(() => {
    fetchAdminSiteContent()
      .then((res) => setHomepage(res.homepage))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const featured = homepage?.megaMenuFeatured;

  function patchTile(
    section: keyof MegaMenuFeaturedContent,
    index: number,
    patch: Partial<MegaMenuFeaturedTile>,
  ) {
    if (!homepage || !featured) return;
    const tiles = [...(featured[section] || [])];
    tiles[index] = { ...tiles[index], ...patch };
    setHomepage({
      ...homepage,
      megaMenuFeatured: { ...featured, [section]: tiles },
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!homepage) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await updateAdminSiteContent({ homepage });
      setHomepage(res.homepage);
      setMessage("Menu navigation enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!homepage || !featured) {
    return <p className="text-muted-foreground">{error || "Chargement…"}</p>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <ContentSubnav />
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">Menu navigation — images</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Modifie les deux photos à droite de chaque grand menu (desktop). Après enregistrement, rafraîchis le site
          public pour voir le changement.
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {!uploadsLoading && !uploadsAvailable && (
        <UploadsUnavailableBanner hint="Colle l'URL complète de l'image (ex. https://… ou /uploads/…)." />
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {SECTIONS.map(({ key, title, hint }) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-muted-foreground font-normal">{hint}</p>
            </CardHeader>
            <CardContent className="space-y-8">
              {(featured[key]?.length ? featured[key] : [emptyTile(), emptyTile()]).map((tile, index) => (
                <div key={index} className="grid gap-4 sm:grid-cols-2 border-t border-border pt-6 first:border-0 first:pt-0">
                  <p className="sm:col-span-2 text-eyebrow text-muted-foreground">Image {index + 1}</p>
                  <CmsField
                    label="Libellé"
                    value={tile.label}
                    onChange={(v) => patchTile(key, index, { label: v })}
                  />
                  <CmsField
                    label="Lien (chemin)"
                    value={tile.to}
                    onChange={(v) => patchTile(key, index, { to: v })}
                  />
                  <CmsField
                    label="Collection (slug, optionnel)"
                    value={tile.collectionSlug || ""}
                    onChange={(v) => patchTile(key, index, { collectionSlug: v || undefined })}
                  />
                  <CmsMediaField
                    label="Photo"
                    value={tile.image}
                    onChange={(v) => patchTile(key, index, { image: v })}
                    uploadsAvailable={uploadsAvailable}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </div>
  );
}
