import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminSiteContent, updateAdminSiteContent } from "@/lib/admin-api";
import type { ProductMessagesContent } from "@/lib/content-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentSubnav } from "@/components/admin/ContentSubnav";
import { CmsField } from "@/components/admin/CmsField";

export const Route = createFileRoute("/admin/content/product-messages")({
  head: () => ({ meta: [{ title: "Product messages — Bingin Diaries Admin" }] }),
  component: AdminProductMessagesPage,
});

function AdminProductMessagesPage() {
  const [messages, setMessages] = useState<ProductMessagesContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminSiteContent()
      .then((res) => setMessages(res.productMessages))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!messages) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await updateAdminSiteContent({ productMessages: messages });
      setMessages(res.productMessages);
      setMessage("Messages produit enregistrés.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!messages) {
    return <p className="text-muted-foreground">{error || "Chargement…"}</p>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <ContentSubnav />
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">Messages fiche produit</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Textes affichés sur les pages produit. Variables :{" "}
          <code className="text-xs">{"{country}"}</code>, <code className="text-xs">{"{warehouse}"}</code>,{" "}
          <code className="text-xs">{"{count}"}</code>, <code className="text-xs">{"{variant}"}</code>.
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Disponibilité & stock</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <CmsField
              label="Note — indisponible dans la région"
              value={messages.regionalUnavailable}
              onChange={(v) => setMessages({ ...messages, regionalUnavailable: v })}
              multiline
            />
            <CmsField
              label="Bouton — indisponible"
              value={messages.unavailableInRegion}
              onChange={(v) => setMessages({ ...messages, unavailableInRegion: v })}
            />
            <CmsField
              label="Rupture de stock"
              value={messages.soldOut}
              onChange={(v) => setMessages({ ...messages, soldOut: v })}
            />
            <CmsField
              label="Ajouter au panier"
              value={messages.addToBag}
              onChange={(v) => setMessages({ ...messages, addToBag: v })}
            />
            <CmsField
              label="Ligne stock ({count}, {variant}, {warehouse})"
              value={messages.inStock}
              onChange={(v) => setMessages({ ...messages, inStock: v })}
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
