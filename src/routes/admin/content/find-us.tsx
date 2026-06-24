import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminSiteContent, updateAdminSiteContent } from "@/lib/admin-api";
import type { FindUsContent, StockistArea, StockistCountry, StockistStore } from "@/lib/content-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ContentSubnav } from "@/components/admin/ContentSubnav";
import { CmsField } from "@/components/admin/CmsField";

export const Route = createFileRoute("/admin/content/find-us")({
  head: () => ({ meta: [{ title: "Find us — Bingin Diaries Admin" }] }),
  component: AdminFindUsContentPage,
});

function AdminFindUsContentPage() {
  const [findUs, setFindUs] = useState<FindUsContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminSiteContent()
      .then((res) => setFindUs(res.findUs))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!findUs) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await updateAdminSiteContent({ findUs });
      setFindUs(res.findUs);
      setMessage("Page Find us enregistrée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function updateCountry(ci: number, patch: Partial<StockistCountry>) {
    if (!findUs) return;
    const countries = [...findUs.countries];
    countries[ci] = { ...countries[ci], ...patch };
    setFindUs({ ...findUs, countries });
  }

  function updateArea(ci: number, ai: number, patch: Partial<StockistArea>) {
    if (!findUs) return;
    const countries = [...findUs.countries];
    const areas = [...countries[ci].areas];
    areas[ai] = { ...areas[ai], ...patch };
    countries[ci] = { ...countries[ci], areas };
    setFindUs({ ...findUs, countries });
  }

  function updateStore(ci: number, ai: number, si: number, patch: Partial<StockistStore>) {
    if (!findUs) return;
    const countries = [...findUs.countries];
    const areas = [...countries[ci].areas];
    const stores = [...areas[ai].stores];
    stores[si] = { ...stores[si], ...patch };
    areas[ai] = { ...areas[ai], stores };
    countries[ci] = { ...countries[ci], areas };
    setFindUs({ ...findUs, countries });
  }

  if (!findUs) {
    return <p className="text-muted-foreground">{error || "Chargement…"}</p>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <ContentSubnav />
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">Find us — Retailers</h2>
        <p className="text-sm text-muted-foreground mt-2">Carte Atlist, liste des boutiques et bloc wholesale.</p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">En-tête</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField label="Eyebrow" value={findUs.eyebrow} onChange={(v) => setFindUs({ ...findUs, eyebrow: v })} />
            <CmsField label="Titre" value={findUs.title} onChange={(v) => setFindUs({ ...findUs, title: v })} />
            <div className="sm:col-span-2">
              <CmsField
                label="Introduction"
                value={findUs.description}
                onChange={(v) => setFindUs({ ...findUs, description: v })}
                multiline
              />
            </div>
            <div className="sm:col-span-2">
              <CmsField
                label="Meta description (SEO)"
                value={findUs.metaDescription}
                onChange={(v) => setFindUs({ ...findUs, metaDescription: v })}
                multiline
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Carte Atlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CmsField
              label="URL embed (iframe)"
              value={findUs.atlistEmbedUrl}
              onChange={(v) => setFindUs({ ...findUs, atlistEmbedUrl: v })}
            />
            <CmsField
              label="URL carte complète"
              value={findUs.atlistMapUrl}
              onChange={(v) => setFindUs({ ...findUs, atlistMapUrl: v })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bloc wholesale</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField
              label="Email wholesale"
              value={findUs.wholesaleEmail}
              onChange={(v) => setFindUs({ ...findUs, wholesaleEmail: v })}
            />
            <CmsField
              label="Label bouton contact"
              value={findUs.wholesaleCtaLabel}
              onChange={(v) => setFindUs({ ...findUs, wholesaleCtaLabel: v })}
            />
            <div className="sm:col-span-2">
              <CmsField
                label="Titre wholesale"
                value={findUs.wholesaleTitle}
                onChange={(v) => setFindUs({ ...findUs, wholesaleTitle: v })}
                multiline
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Liste des boutiques</CardTitle>
            <div className="flex items-center gap-3">
              <Switch
                checked={findUs.showStockistList}
                onCheckedChange={(v) => setFindUs({ ...findUs, showStockistList: v })}
              />
              <Label>Afficher la liste</Label>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setFindUs({
                  ...findUs,
                  countries: [...findUs.countries, { country: "New country", areas: [{ name: "General", stores: [] }] }],
                })
              }
            >
              Ajouter un pays
            </Button>

            {findUs.countries.map((country, ci) => (
              <div key={ci} className="border border-border p-4 rounded-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CmsField
                    label={`Pays ${ci + 1}`}
                    value={country.country}
                    onChange={(v) => updateCountry(ci, { country: v })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFindUs({ ...findUs, countries: findUs.countries.filter((_, j) => j !== ci) })
                    }
                  >
                    Supprimer pays
                  </Button>
                </div>

                {country.areas.map((area, ai) => (
                  <div key={ai} className="ml-2 sm:ml-4 border-l border-border pl-4 space-y-3">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <CmsField
                        label="Région / ville"
                        value={area.name}
                        onChange={(v) => updateArea(ci, ai, { name: v })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const areas = country.areas.filter((_, j) => j !== ai);
                          updateCountry(ci, { areas });
                        }}
                      >
                        Supprimer région
                      </Button>
                    </div>

                    {area.stores.map((store, si) => (
                      <div key={si} className="grid gap-2 sm:grid-cols-3 bg-muted/30 p-3 rounded-sm">
                        <CmsField
                          label="Boutique"
                          value={store.name}
                          onChange={(v) => updateStore(ci, ai, si, { name: v })}
                        />
                        <CmsField
                          label="Instagram"
                          value={store.instagram ?? ""}
                          onChange={(v) => updateStore(ci, ai, si, { instagram: v || undefined })}
                        />
                        <CmsField
                          label="URL"
                          value={store.url ?? ""}
                          onChange={(v) => updateStore(ci, ai, si, { url: v || undefined })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="sm:col-span-3 justify-start"
                          onClick={() => {
                            const stores = area.stores.filter((_, j) => j !== si);
                            updateArea(ci, ai, { stores });
                          }}
                        >
                          Supprimer boutique
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateArea(ci, ai, { stores: [...area.stores, { name: "" }] })}
                    >
                      Ajouter une boutique
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateCountry(ci, { areas: [...country.areas, { name: "General", stores: [] }] })}
                >
                  Ajouter une région
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer Find us"}
        </Button>
      </form>
    </div>
  );
}
