import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  autoTranslatePost,
  fetchAdminPost,
  fetchTranslateStatus,
  saveAdminPost,
} from "@/lib/admin-api";
import type { JournalPost, JournalPostLocaleFields } from "@/lib/content-types";
import { CMS_LOCALES, emptyPostLocaleFields } from "@/lib/i18n/cms-locales";
import type { Locale } from "@/lib/i18n/messages";
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
import { CmsMediaField } from "@/components/admin/CmsMediaField";
import { JournalBlockEditor } from "@/components/admin/JournalBlockEditor";
import { UploadsUnavailableBanner } from "@/components/admin/UploadsUnavailableBanner";
import { useUploadsAvailable } from "@/lib/use-uploads-available";
import {
  bodyFromBlocks,
  defaultArticleBlocks,
  resolvePostBlocks,
} from "@/lib/journal-blocks";

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

function localeFields(post: JournalPost, code: Locale): JournalPostLocaleFields {
  const raw = post.locales?.[code] || emptyPostLocaleFields();
  return {
    ...raw,
    blocks: resolvePostBlocks(raw),
    body: bodyFromBlocks(resolvePostBlocks(raw)),
  };
}

function AdminBlogEditPage() {
  const { slug: routeSlug } = Route.useParams();
  const navigate = useNavigate();
  const isNew = routeSlug === "new";
  const [post, setPost] = useState<JournalPost & { status: string }>(EMPTY);
  const [activeLocale, setActiveLocale] = useState<Locale>("fr");
  const [sourceLocale, setSourceLocale] = useState<Locale>("en");
  const [translateAvailable, setTranslateAvailable] = useState<boolean | null>(null);
  const [translateNote, setTranslateNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const { available: uploadsAvailable, loading: uploadsLoading } = useUploadsAvailable();

  useEffect(() => {
    fetchTranslateStatus()
      .then((s) => setTranslateAvailable(s.available))
      .catch(() => setTranslateAvailable(false));
  }, []);

  useEffect(() => {
    if (isNew) {
      setPost({
        ...EMPTY,
        locales: { fr: { ...emptyPostLocaleFields(), blocks: defaultArticleBlocks() } },
      });
      return;
    }
    fetchAdminPost(routeSlug)
      .then((res) => {
        const loaded = { ...res.post, status: res.post.status || "published" };
        const locales = loaded.locales || {};
        if (!loaded.locales?.en && loaded.title) {
          locales.en = {
            title: loaded.title,
            excerpt: loaded.excerpt,
            category: loaded.category,
            body: loaded.body || [],
            blocks: resolvePostBlocks({ body: loaded.body || [], blocks: loaded.blocks }),
          };
          loaded.locales = locales;
        }
        for (const { code } of CMS_LOCALES) {
          if (locales[code]) {
            locales[code] = {
              ...locales[code],
              blocks: resolvePostBlocks(locales[code]),
              body: bodyFromBlocks(resolvePostBlocks(locales[code])),
            };
          }
        }
        setPost(loaded);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [routeSlug, isNew]);

  function patchLocale(code: Locale, patch: Partial<JournalPostLocaleFields>) {
    const current = localeFields(post, code);
    setPost({
      ...post,
      locales: {
        ...post.locales,
        [code]: { ...current, ...patch },
      },
    });
  }

  async function handleAutoTranslate() {
    const source = sourceLocale;
    const title = localeFields(post, source).title.trim();
    if (!title) {
      setError(`Ajoutez un titre en ${CMS_LOCALES.find((l) => l.code === source)?.adminLabel} avant de traduire.`);
      return;
    }
    const fields = localeFields(post, source);
    const blocks = fields.blocks;

    setTranslating(true);
    setError(null);
    setTranslateNote(null);
    try {
      const targetLocales = CMS_LOCALES.map((l) => l.code).filter((c) => c !== source);
      const res = await autoTranslatePost({
        sourceLocale: source,
        targetLocales,
        fields: {
          title: fields.title,
          excerpt: fields.excerpt,
          category: fields.category,
          blocks,
          body: bodyFromBlocks(blocks),
        },
      });

      const nextLocales = { ...post.locales, [source]: { ...fields, blocks, body: bodyFromBlocks(blocks) } };
      for (const code of targetLocales) {
        const translated = res.locales[code];
        if (translated) {
          const translatedBlocks = resolvePostBlocks(translated);
          nextLocales[code as Locale] = {
            ...localeFields(post, code as Locale),
            ...translated,
            blocks: translatedBlocks,
            body: bodyFromBlocks(translatedBlocks),
          };
        }
      }

      setPost({ ...post, locales: nextLocales });
      setTranslateNote(
        `Traduction DeepL : ${CMS_LOCALES.find((l) => l.code === source)?.adminLabel} → ${targetLocales.map((c) => c.toUpperCase()).join(", ")} — relisez avant publication.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Traduction impossible");
    } finally {
      setTranslating(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const locales = { ...post.locales } as Partial<Record<Locale, JournalPostLocaleFields>>;
      for (const { code } of CMS_LOCALES) {
        const fields = localeFields(post, code);
        const blocks = fields.blocks;
        locales[code] = {
          ...fields,
          blocks,
          body: bodyFromBlocks(blocks),
        };
      }
      const res = await saveAdminPost({
        slug: post.slug,
        status: post.status,
        image: post.image,
        imageFocal: post.imageFocal,
        readMinutes: post.readMinutes,
        locales,
      });
      const loaded = { ...res.post, status: res.post.status || post.status };
      for (const { code } of CMS_LOCALES) {
        if (loaded.locales?.[code]) {
          loaded.locales[code] = {
            ...loaded.locales[code],
            blocks: resolvePostBlocks(loaded.locales[code]),
          };
        }
      }
      setPost(loaded);
      if (isNew) {
        navigate({ to: "/admin/blog/$slug", params: { slug: res.post.slug } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const fields = localeFields(post, activeLocale);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link to="/admin/blog" className="text-sm text-muted-foreground hover:text-foreground">
          ← Blog
        </Link>
        <h2 className="font-display text-4xl mt-4">{isNew ? "Nouvel article" : "Éditer l'article"}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Modèle article : texte → 2 photos côte à côte → texte → photo. Contenu par langue (FR · EN · ID · ES).
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {translateNote && <p className="text-sm text-muted-foreground">{translateNote}</p>}

      {!uploadsLoading && !uploadsAvailable && (
        <UploadsUnavailableBanner hint="Utilisez « Uploader un fichier » si R2 est actif, ou collez une URL complète (https://… ou /uploads/…)." />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {CMS_LOCALES.map(({ code, adminLabel }) => {
          const hasContent = Boolean(localeFields(post, code).title?.trim());
          return (
            <Button
              key={code}
              type="button"
              size="sm"
              variant={activeLocale === code ? "default" : "outline"}
              onClick={() => setActiveLocale(code)}
            >
              {adminLabel}
              {!hasContent && activeLocale !== code ? " · vide" : ""}
            </Button>
          );
        })}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Source :</span>
          <Select value={sourceLocale} onValueChange={(v) => setSourceLocale(v as Locale)}>
            <SelectTrigger className="h-8 w-[10rem] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CMS_LOCALES.map(({ code, adminLabel }) => (
                <SelectItem key={code} value={code}>
                  {adminLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={translating || translateAvailable === false}
            onClick={handleAutoTranslate}
          >
            {translating ? "Traduction…" : "Traduire vers les autres langues"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Paramètres communs</CardTitle>
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
            <CmsMediaField
              label="Image de couverture"
              value={post.image}
              onChange={(v) => setPost({ ...post, image: v })}
              folder={`blog-${post.slug || "draft"}`}
              focal={post.imageFocal}
              onFocalChange={(imageFocal) => setPost({ ...post, imageFocal })}
              focalAspect={16 / 9}
            />
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {CMS_LOCALES.find((l) => l.code === activeLocale)?.adminLabel} — /journal/{post.slug || "…"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={fields.title}
                onChange={(e) => patchLocale(activeLocale, { title: e.target.value })}
                required={activeLocale === "en" || activeLocale === "fr"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Extrait</Label>
              <Textarea
                id="excerpt"
                value={fields.excerpt}
                onChange={(e) => patchLocale(activeLocale, { excerpt: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Input
                id="category"
                value={fields.category}
                onChange={(e) => patchLocale(activeLocale, { category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Corps de l&apos;article</Label>
              <JournalBlockEditor
                blocks={fields.blocks ?? defaultArticleBlocks()}
                mediaFolder={`blog/${post.slug || "draft"}`}
                onChange={(blocks) =>
                  patchLocale(activeLocale, {
                    blocks,
                    body: bodyFromBlocks(blocks),
                  })
                }
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer toutes les langues"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
