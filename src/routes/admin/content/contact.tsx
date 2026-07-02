import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminSiteContent, updateAdminSiteContent } from "@/lib/admin-api";
import type { ContactContent } from "@/lib/content-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentSubnav } from "@/components/admin/ContentSubnav";
import { CmsField } from "@/components/admin/CmsField";

export const Route = createFileRoute("/admin/content/contact")({
  head: () => ({ meta: [{ title: "Contact — Bingin Diaries Admin" }] }),
  component: AdminContactContentPage,
});

function AdminContactContentPage() {
  const [contact, setContact] = useState<ContactContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminSiteContent()
      .then((res) => setContact(res.contact))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!contact) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await updateAdminSiteContent({ contact });
      setContact(res.contact);
      setMessage("Page Contact enregistrée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!contact) {
    return <p className="text-muted-foreground">{error || "Chargement…"}</p>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <ContentSubnav />
      <div>
        <p className="text-eyebrow text-muted-foreground">CMS</p>
        <h2 className="font-display text-4xl mt-2">Contact</h2>
        <p className="text-sm text-muted-foreground mt-2">Textes de la page /contact et libellés du formulaire.</p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">En-tête</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField label="Eyebrow" value={contact.eyebrow} onChange={(v) => setContact({ ...contact, eyebrow: v })} />
            <CmsField label="Titre" value={contact.title} onChange={(v) => setContact({ ...contact, title: v })} />
            <div className="sm:col-span-2">
              <CmsField
                label="Description"
                value={contact.description}
                onChange={(v) => setContact({ ...contact, description: v })}
                multiline
              />
            </div>
            <CmsField label="Email affiché" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} />
            <CmsField
              label="Meta description (SEO)"
              value={contact.metaDescription}
              onChange={(v) => setContact({ ...contact, metaDescription: v })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Formulaire</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CmsField label="Label Nom" value={contact.formName} onChange={(v) => setContact({ ...contact, formName: v })} />
            <CmsField label="Label Email" value={contact.formEmail} onChange={(v) => setContact({ ...contact, formEmail: v })} />
            <CmsField label="Label Sujet" value={contact.formSubject} onChange={(v) => setContact({ ...contact, formSubject: v })} />
            <CmsField label="Label Message" value={contact.formMessage} onChange={(v) => setContact({ ...contact, formMessage: v })} />
            <CmsField label="Bouton envoyer" value={contact.formSubmit} onChange={(v) => setContact({ ...contact, formSubmit: v })} />
            <CmsField label="Texte envoi en cours" value={contact.formSending} onChange={(v) => setContact({ ...contact, formSending: v })} />
            <div className="sm:col-span-2">
              <CmsField label="Texte après envoi" value={contact.formSent} onChange={(v) => setContact({ ...contact, formSent: v })} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer Contact"}
        </Button>
      </form>
    </div>
  );
}
