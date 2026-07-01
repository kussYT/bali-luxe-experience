import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminSiteContent, updateAdminSiteContent } from "@/lib/admin-api";
import type { FooterContent } from "@/lib/content-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentSubnav } from "@/components/admin/ContentSubnav";
import { CmsField } from "@/components/admin/CmsField";

export const Route = createFileRoute("/admin/content/footer")({
  head: () => ({ meta: [{ title: "Footer — Bingin Diaries Admin" }] }),
  component: AdminFooterContentPage,
});

function AdminFooterContentPage() {
  const [footer, setFooter] = useState<FooterContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminSiteContent()
      .then((res) => setFooter(res.footer))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!footer) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await updateAdminSiteContent({ footer });
      setFooter(res.footer);
      setMessage("Footer enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!footer) {
    return <p className="text-muted-foreground">{error || "Chargement…"}</p>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <ContentSubnav />
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">Footer</h2>
        <p className="text-sm text-muted-foreground mt-2">Titres des colonnes et libellés des liens du pied de page.</p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shop</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField label="Titre colonne" value={footer.shopTitle} onChange={(v) => setFooter({ ...footer, shopTitle: v })} />
            <CmsField label="Tous les produits" value={footer.shopAll} onChange={(v) => setFooter({ ...footer, shopAll: v })} />
            <CmsField label="Soldes" value={footer.shopSale} onChange={(v) => setFooter({ ...footer, shopSale: v })} />
            <CmsField label="Wishlist" value={footer.shopWishlist} onChange={(v) => setFooter({ ...footer, shopWishlist: v })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer care</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField label="Titre colonne" value={footer.careTitle} onChange={(v) => setFooter({ ...footer, careTitle: v })} />
            <CmsField label="Contact" value={footer.contactUs} onChange={(v) => setFooter({ ...footer, contactUs: v })} />
            <CmsField label="Guide tailles" value={footer.sizeGuide} onChange={(v) => setFooter({ ...footer, sizeGuide: v })} />
            <CmsField label="Guide entretien" value={footer.careGuide} onChange={(v) => setFooter({ ...footer, careGuide: v })} />
            <CmsField label="FAQ" value={footer.faq} onChange={(v) => setFooter({ ...footer, faq: v })} />
            <CmsField label="Livraison" value={footer.shipping} onChange={(v) => setFooter({ ...footer, shipping: v })} />
            <CmsField label="Retours" value={footer.returns} onChange={(v) => setFooter({ ...footer, returns: v })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Explore & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField label="Titre Explore" value={footer.exploreTitle} onChange={(v) => setFooter({ ...footer, exploreTitle: v })} />
            <CmsField label="La marque" value={footer.theBrand} onChange={(v) => setFooter({ ...footer, theBrand: v })} />
            <CmsField label="Travel guide" value={footer.travelGuide} onChange={(v) => setFooter({ ...footer, travelGuide: v })} />
            <CmsField label="Titre Privacy" value={footer.privacyTitle} onChange={(v) => setFooter({ ...footer, privacyTitle: v })} />
            <CmsField label="CGV" value={footer.terms} onChange={(v) => setFooter({ ...footer, terms: v })} />
            <CmsField label="Artisans" value={footer.artisans} onChange={(v) => setFooter({ ...footer, artisans: v })} />
            <CmsField label="Matières" value={footer.materials} onChange={(v) => setFooter({ ...footer, materials: v })} />
            <div className="sm:col-span-2">
              <CmsField label="Copyright" value={footer.copyright} onChange={(v) => setFooter({ ...footer, copyright: v })} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer Footer"}
        </Button>
      </form>
    </div>
  );
}
