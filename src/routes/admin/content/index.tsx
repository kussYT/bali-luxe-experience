import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  fetchAdminSiteContent,
  updateAdminSiteContent,
  seedAdminCms,
} from "@/lib/admin-api";
import type { AnnouncementContent, HomepageContent } from "@/lib/content-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CmsStatusCard } from "@/components/admin/CmsStatusCard";
import { ContentSubnav } from "@/components/admin/ContentSubnav";
import { CmsField } from "@/components/admin/CmsField";
import { CmsMediaField } from "@/components/admin/CmsMediaField";
import { UploadsUnavailableBanner } from "@/components/admin/UploadsUnavailableBanner";
import { CmsMediaGuide } from "@/components/admin/CmsMediaGuide";
import { useUploadsAvailable } from "@/lib/use-uploads-available";
import { NavigationLocaleEditor } from "@/components/admin/NavigationLocaleEditor";
import type { Locale } from "@/lib/i18n/messages";
import type { SiteNavigationStored } from "@/lib/content-types";

export const Route = createFileRoute("/admin/content/")({
  head: () => ({ meta: [{ title: "Content — Bingin Diaries Admin" }] }),
  component: AdminContentPage,
});

function AdminContentPage() {
  const [announcement, setAnnouncement] = useState<AnnouncementContent | null>(null);
  const [homepage, setHomepage] = useState<HomepageContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [navLocale, setNavLocale] = useState<Locale>("fr");
  const [navigationStored, setNavigationStored] = useState<SiteNavigationStored>({ locales: {} });
  const { available: uploadsAvailable, loading: uploadsLoading } = useUploadsAvailable();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetchAdminSiteContent();
      setAnnouncement(res.announcement);
      setHomepage(res.homepage);
      setNavigationStored(res.homepage.navigationStored ?? { locales: {} });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load content");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!announcement || !homepage) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await updateAdminSiteContent({
        announcement,
        homepage: {
          ...homepage,
          navigation: { locales: navigationStored.locales },
        },
      });
      setAnnouncement(res.announcement);
      setHomepage(res.homepage);
      setNavigationStored(res.homepage.navigationStored ?? { locales: navigationStored.locales });
      setMessage("Contenu enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    setError(null);
    try {
      const res = await seedAdminCms();
      setMessage(`Seed OK — ${res.posts.seeded} articles, ${res.pages.seeded} pages.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  if (!announcement || !homepage) {
    return <p className="text-muted-foreground">{error || "Chargement…"}</p>;
  }

  const hero = homepage.hero;
  const editorial = homepage.editorial;
  const quote = homepage.quote;
  const spotlight = {
    enabled: false,
    productSlug: "",
    eyebrow: "Spotlight",
    title: "",
    description: "",
    image: "",
    ctaLabel: "Discover the piece",
    ...homepage.spotlightProduct,
  };
  const seo = {
    title: "Bingin Diaries — Hand-woven hats from Bali & France",
    metaDescription:
      "A boutique house of sun-soaked hats, hand-woven between Canggu and Paris.",
    ...homepage.seo,
  };

  const patchSpotlight = (patch: Partial<typeof spotlight>) =>
    setHomepage({ ...homepage, spotlightProduct: { ...spotlight, ...patch } });

  return (
    <div className="space-y-8 max-w-4xl">
      <ContentSubnav />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-muted-foreground">CMS</p>
          <h2 className="font-display text-4xl mt-2">Homepage & bandeau</h2>
        </div>
        <Button type="button" variant="outline" onClick={handleSeed} disabled={seeding}>
          {seeding ? "Seed…" : "Importer le contenu par défaut"}
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {!uploadsLoading && uploadsAvailable && (
        <div className="rounded-sm border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Photos & vidéos :</strong> clique sur{" "}
          <strong className="text-foreground">Uploader un fichier</strong> à côté du champ — le lien se remplit
          automatiquement. Formats : JPG, PNG, WebP, MP4. Pas besoin de taper le chemin à la main.
        </div>
      )}
      <CmsMediaGuide />
      {!uploadsLoading && !uploadsAvailable && (
        <UploadsUnavailableBanner hint="Colle une URL d'image ou de vidéo dans le champ pour l'instant." />
      )}

      <CmsStatusCard />

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SEO — Page d&apos;accueil (Google)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Titre et description affichés quand quelqu&apos;un cherche « Bingin Diaries » sur Google.
            </p>
            <CmsField
              label="Meta titre"
              value={seo.title}
              onChange={(v) => setHomepage({ ...homepage, seo: { ...seo, title: v } })}
            />
            <CmsField
              label="Meta description"
              value={seo.metaDescription}
              onChange={(v) => setHomepage({ ...homepage, seo: { ...seo, metaDescription: v } })}
              multiline
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bandeau (marquee)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={announcement.enabled}
                onCheckedChange={(v) => setAnnouncement({ ...announcement, enabled: v })}
              />
              <Label>Afficher le bandeau</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-text">Texte</Label>
              <Input
                id="announcement-text"
                value={announcement.text}
                onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-link">Lien (optionnel)</Label>
              <Input
                id="announcement-link"
                value={announcement.link}
                onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })}
                placeholder="/collection"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hero</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField label="Eyebrow" value={hero.eyebrow} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, eyebrow: v } })} />
            <CmsField label="Titre" value={hero.title} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, title: v } })} />
            <div className="sm:col-span-2">
              <CmsField label="Sous-titre" value={hero.subtitle} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, subtitle: v } })} />
            </div>
            <CmsMediaField
              label="Image poster"
              value={hero.poster}
              onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, poster: v } })}
              folder="hero"
              accept="image/*"
              focal={hero.posterFocal}
              onFocalChange={(posterFocal) => setHomepage({ ...homepage, hero: { ...hero, posterFocal } })}
              focalAspect={16 / 9}
            />
            <CmsMediaField
              label="Vidéo (URL ou fichier MP4)"
              value={hero.videoSrc}
              onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, videoSrc: v } })}
              folder="hero"
              accept="video/mp4,video/webm,image/*"
            />
            <CmsField label="CTA principal" value={hero.ctaPrimary} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, ctaPrimary: v } })} />
            <CmsField label="Lien CTA principal" value={hero.ctaPrimaryHref} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, ctaPrimaryHref: v } })} />
            <CmsField label="CTA secondaire" value={hero.ctaSecondary} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, ctaSecondary: v } })} />
            <CmsField label="Lien CTA secondaire" value={hero.ctaSecondaryHref} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, ctaSecondaryHref: v } })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Produit en avant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={spotlight.enabled} onCheckedChange={(v) => patchSpotlight({ enabled: v })} />
              <Label>Afficher un produit mis en avant sur la homepage</Label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <CmsField
                label="Slug produit (ex: gilda-hat)"
                value={spotlight.productSlug}
                onChange={(v) => patchSpotlight({ productSlug: v })}
              />
              <CmsField label="Eyebrow" value={spotlight.eyebrow} onChange={(v) => patchSpotlight({ eyebrow: v })} />
              <CmsField
                label="Titre (vide = nom du produit)"
                value={spotlight.title}
                onChange={(v) => patchSpotlight({ title: v })}
              />
              <CmsField
                label="Bouton CTA"
                value={spotlight.ctaLabel}
                onChange={(v) => patchSpotlight({ ctaLabel: v })}
              />
              <div className="sm:col-span-2">
                <CmsField
                  label="Description courte"
                  value={spotlight.description}
                  onChange={(v) => patchSpotlight({ description: v })}
                  multiline
                />
              </div>
              <div className="sm:col-span-2">
                <CmsMediaField
                  label="Image (optionnel — sinon photo principale du produit)"
                  value={spotlight.image}
                  onChange={(v) => patchSpotlight({ image: v })}
                  folder="spotlight"
                  accept="image/*"
                  focal={spotlight.imageFocal}
                  onFocalChange={(imageFocal) => patchSpotlight({ imageFocal })}
                  focalAspect={3 / 4}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Le produit doit être <strong>publié</strong>. Trouve le slug dans Admin → Produits (champ URL).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bloc photos (sous le hero)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Disposition</Label>
              <select
                className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background"
                value={homepage.photoStrip?.layout ?? "grid"}
                onChange={(e) =>
                  setHomepage({
                    ...homepage,
                    photoStrip: {
                      ...(homepage.photoStrip ?? { tiles: [] }),
                      layout: e.target.value as "landscape" | "grid",
                    },
                  })
                }
              >
                <option value="grid">Grille (2–3 catégories)</option>
                <option value="landscape">Photo paysage unique</option>
              </select>
            </div>
            {(homepage.photoStrip?.tiles ?? []).map((tile, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-2 border border-border p-4 rounded-sm">
                <CmsField
                  label={`Tuile ${i + 1} — label`}
                  value={tile.label}
                  onChange={(v) => {
                    const tiles = [...(homepage.photoStrip?.tiles ?? [])];
                    tiles[i] = { ...tiles[i], label: v };
                    setHomepage({ ...homepage, photoStrip: { ...homepage.photoStrip!, tiles } });
                  }}
                />
                <CmsMediaField
                  label="Image (URL)"
                  value={tile.image}
                  onChange={(v) => {
                    const tiles = [...(homepage.photoStrip?.tiles ?? [])];
                    tiles[i] = { ...tiles[i], image: v };
                    setHomepage({ ...homepage, photoStrip: { ...homepage.photoStrip!, tiles } });
                  }}
                  folder={`photo-strip-${i + 1}`}
                  accept="image/*"
                  focal={tile.imageFocal}
                  onFocalChange={(imageFocal) => {
                    const tiles = [...(homepage.photoStrip?.tiles ?? [])];
                    tiles[i] = { ...tiles[i], imageFocal };
                    setHomepage({ ...homepage, photoStrip: { ...homepage.photoStrip!, tiles } });
                  }}
                  focalAspect={3 / 4}
                />
                <CmsField
                  label="Lien"
                  value={tile.href}
                  onChange={(v) => {
                    const tiles = [...(homepage.photoStrip?.tiles ?? [])];
                    tiles[i] = { ...tiles[i], href: v };
                    setHomepage({ ...homepage, photoStrip: { ...homepage.photoStrip!, tiles } });
                  }}
                />
                <CmsField
                  label="Collection (slug, optionnel)"
                  value={tile.search?.c ?? ""}
                  onChange={(v) => {
                    const tiles = [...(homepage.photoStrip?.tiles ?? [])];
                    tiles[i] = { ...tiles[i], search: v ? { c: v } : undefined };
                    setHomepage({ ...homepage, photoStrip: { ...homepage.photoStrip!, tiles } });
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spotify — Bingin Sounds</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField
              label="Titre section"
              value={homepage.binginSounds.title}
              onChange={(v) => setHomepage({ ...homepage, binginSounds: { ...homepage.binginSounds, title: v } })}
            />
            <CmsField
              label="Nom playlist"
              value={homepage.binginSounds.playlistName}
              onChange={(v) => setHomepage({ ...homepage, binginSounds: { ...homepage.binginSounds, playlistName: v } })}
            />
            <div className="sm:col-span-2">
              <CmsField
                label="Description"
                value={homepage.binginSounds.description}
                onChange={(v) => setHomepage({ ...homepage, binginSounds: { ...homepage.binginSounds, description: v } })}
                multiline
              />
            </div>
            <CmsField
              label="URL Spotify"
              value={homepage.binginSounds.spotifyUrl}
              onChange={(v) => setHomepage({ ...homepage, binginSounds: { ...homepage.binginSounds, spotifyUrl: v } })}
            />
            <CmsField
              label="ID playlist Spotify"
              value={homepage.binginSounds.spotifyPlaylistId}
              onChange={(v) => setHomepage({ ...homepage, binginSounds: { ...homepage.binginSounds, spotifyPlaylistId: v } })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Citation & journal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CmsField label="Citation" value={quote.text} onChange={(v) => setHomepage({ ...homepage, quote: { ...quote, text: v } })} multiline />
            <CmsField label="Attribution" value={quote.attribution} onChange={(v) => setHomepage({ ...homepage, quote: { ...quote, attribution: v } })} />
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <CmsField
                label="Journal — eyebrow"
                value={homepage.journalSection.eyebrow}
                onChange={(v) => setHomepage({ ...homepage, journalSection: { ...homepage.journalSection, eyebrow: v } })}
              />
              <CmsField
                label="Journal — titre"
                value={homepage.journalSection.title}
                onChange={(v) => setHomepage({ ...homepage, journalSection: { ...homepage.journalSection, title: v } })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Page Travel Diaries</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField
              label="Eyebrow"
              value={homepage.travelDiariesPage.eyebrow}
              onChange={(v) => setHomepage({ ...homepage, travelDiariesPage: { ...homepage.travelDiariesPage, eyebrow: v } })}
            />
            <CmsField
              label="Titre"
              value={homepage.travelDiariesPage.title}
              onChange={(v) => setHomepage({ ...homepage, travelDiariesPage: { ...homepage.travelDiariesPage, title: v } })}
            />
            <div className="sm:col-span-2">
              <CmsField
                label="Description"
                value={homepage.travelDiariesPage.description}
                onChange={(v) => setHomepage({ ...homepage, travelDiariesPage: { ...homepage.travelDiariesPage, description: v } })}
                multiline
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Navigation (libellés menu)</CardTitle>
          </CardHeader>
          <CardContent>
            <NavigationLocaleEditor
              stored={navigationStored}
              activeLocale={navLocale}
              onLocaleChange={setNavLocale}
              onChange={(locales) => setNavigationStored({ locales })}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </div>
  );
}
