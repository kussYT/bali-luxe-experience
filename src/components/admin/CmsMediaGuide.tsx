const GUIDE_ROWS = [
  { usage: "Fiche produit", ratio: "4:5 portrait", size: "1200 × 1500 px", note: "Recadrage automatique sur la grille" },
  { usage: "Hero (poster)", ratio: "16:9 paysage", size: "1920 × 1080 px", note: "Visible pendant le chargement vidéo" },
  { usage: "Hero (vidéo)", ratio: "16:9", size: "720p, 2–4 Mo max", note: "MP4, 15–20 s recommandé" },
  { usage: "Bande photos home", ratio: "3:4 portrait", size: "900 × 1200 px", note: "Tuiles sous le hero" },
  { usage: "Menu / editorial", ratio: "4:3", size: "800 × 600 px", note: "Vignettes navigation" },
  { usage: "Instagram", ratio: "1:1", size: "1080 × 1080 px", note: "Carré" },
] as const;

export function CmsMediaGuide({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-sm border border-border bg-muted/20 text-sm text-muted-foreground leading-relaxed ${
        compact ? "p-3" : "p-4 md:p-5"
      }`}
    >
      <p className={`font-medium text-foreground ${compact ? "text-sm mb-2" : "mb-3"}`}>
        Guide des tailles d&apos;images
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-xs md:text-sm">
          <thead>
            <tr className="border-b border-border text-foreground/70">
              <th className="py-2 pr-4 font-medium">Usage</th>
              <th className="py-2 pr-4 font-medium">Ratio</th>
              <th className="py-2 pr-4 font-medium">Taille conseillée</th>
              {!compact && <th className="py-2 font-medium">Note</th>}
            </tr>
          </thead>
          <tbody>
            {GUIDE_ROWS.map((row) => (
              <tr key={row.usage} className="border-b border-border/60 last:border-0">
                <td className="py-2 pr-4 text-foreground/90">{row.usage}</td>
                <td className="py-2 pr-4">{row.ratio}</td>
                <td className="py-2 pr-4">{row.size}</td>
                {!compact && <td className="py-2 text-muted-foreground">{row.note}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
