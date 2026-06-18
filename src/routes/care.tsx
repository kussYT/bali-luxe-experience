import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND_CONTENT } from "@/data/brand-content";

const { care } = BRAND_CONTENT;

export const Route = createFileRoute("/care")({
  head: () => ({
    meta: [
      { title: "Guide d'entretien — Bingin Diaries" },
      { name: "description", content: care.intro },
    ],
  }),
  component: CarePage,
});

function CarePage() {
  return (
    <section className="page-wrap section-pad py-24 max-w-3xl">
      <p className="text-eyebrow text-muted-foreground">{care.eyebrow}</p>
      <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[0.95]">{care.title}</h1>
      <p className="mt-8 text-muted-foreground leading-relaxed">{care.intro}</p>

      <div className="mt-14 space-y-12">
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

      <p className="mt-16 text-sm">
        <Link to="/about" className="link-underline">
          ← Retour à la marque
        </Link>
      </p>
    </section>
  );
}
