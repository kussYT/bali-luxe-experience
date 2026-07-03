import { createFileRoute, Link } from "@tanstack/react-router";
import { useSiteContent } from "@/lib/content-context";
import { PageMeta } from "@/components/site/PageMeta";

export const Route = createFileRoute("/care")({
  head: () => ({
    meta: [
      { title: "Guide d'entretien — Bingin Diaries" },
      { name: "description", content: "Care guide for Bingin Diaries hats." },
    ],
  }),
  component: CarePage,
});

function CarePage() {
  const { care } = useSiteContent();
  const pdfUrl = care.pdfUrl?.trim();

  return (
    <>
      <PageMeta title={`${care.title} — Bingin Diaries`} description={care.metaDescription} />
      <section className="page-wrap section-pad py-24 max-w-4xl">
        <p className="text-eyebrow text-muted-foreground">{care.eyebrow}</p>
        <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[0.95]">{care.title}</h1>
        <p className="mt-8 text-muted-foreground leading-relaxed max-w-2xl">{care.intro}</p>

        {pdfUrl ? (
          <div className="mt-14 space-y-6">
            <iframe
              src={pdfUrl}
              title={care.title}
              className="w-full min-h-[70vh] md:min-h-[85vh] border border-border bg-secondary"
            />
            <p className="text-sm">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="link-underline">
                {care.pdfDownloadLabel?.trim() || "Download the care guide (PDF)"}
              </a>
            </p>
          </div>
        ) : (
          <div className="mt-14 space-y-12 max-w-3xl">
            {care.sections.map((section) => (
              <div key={section.title}>
                <h2 className="font-display text-2xl">{section.title}</h2>
                <ul className="mt-4 space-y-2 text-muted-foreground text-sm leading-relaxed">
                  {section.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <p className="mt-16 text-sm">
          <Link to="/about" className="link-underline">
            {care.backLink}
          </Link>
        </p>
      </section>
    </>
  );
}
