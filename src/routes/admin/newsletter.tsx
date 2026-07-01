import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  fetchAdminNewsletter,
  updateAdminNewsletter,
  adminNewsletterExportUrl,
  type AdminNewsletterSettings,
} from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export const Route = createFileRoute("/admin/newsletter")({
  head: () => ({ meta: [{ title: "Newsletter — Bingin Diaries Admin" }] }),
  component: AdminNewsletterPage,
});

function AdminNewsletterPage() {
  const [settings, setSettings] = useState<AdminNewsletterSettings | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    siteSignups: number;
    brevoTotal: number | null;
    brevoListName: string | null;
    bySource: Record<string, number>;
  } | null>(null);
  const [subscribers, setSubscribers] = useState<{ email: string; source: string; subscribedAt: string | null }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetchAdminNewsletter();
      setSettings(res.settings);
      setStats(res.stats);
      setSubscribers(res.subscribers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load newsletter");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await updateAdminNewsletter({
        brevoListId: settings.brevoListId,
        copy: settings.copy,
      });
      setSettings(res.settings);
      setMessage("Réglages enregistrés.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!settings && !error) {
    return <p className="text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-muted-foreground">Newsletter</p>
          <h2 className="font-display text-4xl mt-2">Réglages &amp; abonnés</h2>
        </div>
        <Button variant="outline" asChild>
          <a href={adminNewsletterExportUrl()} download>
            Export CSV
          </a>
        </Button>
      </div>

      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {stats.brevoTotal != null ? "Abonnés (liste Brevo)" : "Abonnés"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl">{stats.total}</p>
              {stats.brevoListName && (
                <p className="text-xs text-muted-foreground mt-1">{stats.brevoListName}</p>
              )}
              {stats.brevoTotal != null && stats.siteSignups !== stats.brevoTotal && (
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.siteSignups} inscription{stats.siteSignups !== 1 ? "s" : ""} via le site
                </p>
              )}
            </CardContent>
          </Card>
          {Object.entries(stats.bySource).map(([source, count]) => (
            <Card key={source}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Source : {source}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl">{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {settings && (
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">Brevo</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>List ID</Label>
                <Input
                  value={settings.brevoListId}
                  onChange={(e) => setSettings({ ...settings, brevoListId: e.target.value })}
                  placeholder="3"
                />
                <p className="text-xs text-muted-foreground">
                  Liste Brevo qui reçoit les inscriptions du site.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Clé API</Label>
                <p className="text-sm pt-2">
                  {settings.hasBrevoKey ? (
                    <span className="text-foreground">Configurée (secret serveur)</span>
                  ) : (
                    <span className="text-destructive">Manquante — ajoutez BREVO_API_KEY</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Emails de campagne et bienvenue : à configurer dans le dashboard Brevo.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">Textes du formulaire (site public)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {(
                [
                  ["eyebrow", "Eyebrow"],
                  ["title", "Titre"],
                  ["description", "Description"],
                  ["placeholder", "Placeholder email"],
                  ["button", "Bouton"],
                  ["successMessage", "Message succès"],
                  ["duplicateMessage", "Message déjà inscrit"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  {key === "description" ? (
                    <Textarea
                      value={settings.copy[key]}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          copy: { ...settings.copy, [key]: e.target.value },
                        })
                      }
                      rows={2}
                    />
                  ) : (
                    <Input
                      value={settings.copy[key]}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          copy: { ...settings.copy, [key]: e.target.value },
                        })
                      }
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Derniers abonnés</CardTitle>
        </CardHeader>
        <CardContent>
          {subscribers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun abonné enregistré via le site pour l&apos;instant.
              {stats?.brevoTotal != null && stats.brevoTotal > 0
                ? ` La liste Brevo compte ${stats.brevoTotal} contact${stats.brevoTotal !== 1 ? "s" : ""}.`
                : ""}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Source</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((row) => (
                    <tr key={`${row.email}-${row.subscribedAt}`} className="border-t border-border">
                      <td className="py-2 pr-4">{row.email}</td>
                      <td className="py-2 pr-4">{row.source}</td>
                      <td className="py-2">
                        {row.subscribedAt ? new Date(row.subscribedAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
