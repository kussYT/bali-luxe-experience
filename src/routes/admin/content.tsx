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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CmsStatusCard } from "@/components/admin/CmsStatusCard";

export const Route = createFileRoute("/admin/content")({
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

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetchAdminSiteContent();
      setAnnouncement(res.announcement);
      setHomepage(res.homepage);
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
      const res = await updateAdminSiteContent({ announcement, homepage });
      setAnnouncement(res.announcement);
      setHomepage(res.homepage);
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

  return (
    <div className="space-y-8 max-w-4xl">
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

      <CmsStatusCard />

      <form onSubmit={handleSave} className="space-y-6">
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
            <Field label="Eyebrow" value={hero.eyebrow} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, eyebrow: v } })} />
            <Field label="Titre" value={hero.title} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, title: v } })} />
            <div className="sm:col-span-2">
              <Field label="Sous-titre" value={hero.subtitle} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, subtitle: v } })} />
            </div>
            <Field label="Image poster" value={hero.poster} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, poster: v } })} />
            <Field label="Vidéo (URL)" value={hero.videoSrc} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, videoSrc: v } })} />
            <Field label="CTA principal" value={hero.ctaPrimary} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, ctaPrimary: v } })} />
            <Field label="Lien CTA principal" value={hero.ctaPrimaryHref} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, ctaPrimaryHref: v } })} />
            <Field label="CTA secondaire" value={hero.ctaSecondary} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, ctaSecondary: v } })} />
            <Field label="Lien CTA secondaire" value={hero.ctaSecondaryHref} onChange={(v) => setHomepage({ ...homepage, hero: { ...hero, ctaSecondaryHref: v } })} />
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
                <Field
                  label={`Tuile ${i + 1} — label`}
                  value={tile.label}
                  onChange={(v) => {
                    const tiles = [...(homepage.photoStrip?.tiles ?? [])];
                    tiles[i] = { ...tiles[i], label: v };
                    setHomepage({ ...homepage, photoStrip: { ...homepage.photoStrip!, tiles } });
                  }}
                />
                <Field
                  label="Image (URL)"
                  value={tile.image}
                  onChange={(v) => {
                    const tiles = [...(homepage.photoStrip?.tiles ?? [])];
                    tiles[i] = { ...tiles[i], image: v };
                    setHomepage({ ...homepage, photoStrip: { ...homepage.photoStrip!, tiles } });
                  }}
                />
                <Field
                  label="Lien"
                  value={tile.href}
                  onChange={(v) => {
                    const tiles = [...(homepage.photoStrip?.tiles ?? [])];
                    tiles[i] = { ...tiles[i], href: v };
                    setHomepage({ ...homepage, photoStrip: { ...homepage.photoStrip!, tiles } });
                  }}
                />
                <Field
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
            <p className="text-xs text-muted-foreground">
              TODO i18n : les libellés pourront être traduits quand le multilingue sera activé.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spotify — Bingin Sounds</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Titre section"
              value={homepage.binginSounds.title}
              onChange={(v) =>
                setHomepage({ ...homepage, binginSounds: { ...homepage.binginSounds, title: v } })
              }
            />
            <Field
              label="Nom playlist"
              value={homepage.binginSounds.playlistName}
              onChange={(v) =>
                setHomepage({ ...homepage, binginSounds: { ...homepage.binginSounds, playlistName: v } })
              }
            />
            <div className="sm:col-span-2">
              <Field
                label="Description"
                value={homepage.binginSounds.description}
                onChange={(v) =>
                  setHomepage({ ...homepage, binginSounds: { ...homepage.binginSounds, description: v } })
                }
                multiline
              />
            </div>
            <Field
              label="URL Spotify"
              value={homepage.binginSounds.spotifyUrl}
              onChange={(v) =>
                setHomepage({ ...homepage, binginSounds: { ...homepage.binginSounds, spotifyUrl: v } })
              }
            />
            <Field
              label="ID playlist Spotify"
              value={homepage.binginSounds.spotifyPlaylistId}
              onChange={(v) =>
                setHomepage({ ...homepage, binginSounds: { ...homepage.binginSounds, spotifyPlaylistId: v } })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Éditorial (legacy — hors homepage)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Surtitre" value={editorial.sub} onChange={(v) => setHomepage({ ...homepage, editorial: { ...editorial, sub: v } })} />
            <Field label="Titre" value={editorial.line} onChange={(v) => setHomepage({ ...homepage, editorial: { ...editorial, line: v } })} />
            <div className="sm:col-span-2">
              <Field label="Texte" value={editorial.body} onChange={(v) => setHomepage({ ...homepage, editorial: { ...editorial, body: v } })} multiline />
            </div>
            <Field label="Image" value={editorial.image} onChange={(v) => setHomepage({ ...homepage, editorial: { ...editorial, image: v } })} />
            <Field label="Lien label" value={editorial.linkLabel} onChange={(v) => setHomepage({ ...homepage, editorial: { ...editorial, linkLabel: v } })} />
            <Field label="Lien URL" value={editorial.linkHref} onChange={(v) => setHomepage({ ...homepage, editorial: { ...editorial, linkHref: v } })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Citation & journal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Citation" value={quote.text} onChange={(v) => setHomepage({ ...homepage, quote: { ...quote, text: v } })} multiline />
            <Field label="Attribution" value={quote.attribution} onChange={(v) => setHomepage({ ...homepage, quote: { ...quote, attribution: v } })} />
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <Field
                label="Journal — eyebrow"
                value={homepage.journalSection.eyebrow}
                onChange={(v) => setHomepage({ ...homepage, journalSection: { ...homepage.journalSection, eyebrow: v } })}
              />
              <Field
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
            <Field
              label="Eyebrow"
              value={homepage.travelDiariesPage.eyebrow}
              onChange={(v) => setHomepage({ ...homepage, travelDiariesPage: { ...homepage.travelDiariesPage, eyebrow: v } })}
            />
            <Field
              label="Titre"
              value={homepage.travelDiariesPage.title}
              onChange={(v) => setHomepage({ ...homepage, travelDiariesPage: { ...homepage.travelDiariesPage, title: v } })}
            />
            <div className="sm:col-span-2">
              <Field
                label="Description"
                value={homepage.travelDiariesPage.description}
                onChange={(v) => setHomepage({ ...homepage, travelDiariesPage: { ...homepage.travelDiariesPage, description: v } })}
                multiline
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {multiline ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
