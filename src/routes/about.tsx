import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND_CONTENT } from "@/data/brand-content";
import { IMG } from "@/data/lifestyle-content";

const { about } = BRAND_CONTENT;

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "La marque — Bingin Diaries" },
      {
        name: "description",
        content: "L'histoire de Bingin Diaries — chapeaux artisanaux entre Bali, le Portugal et la France.",
      },
      { property: "og:image", content: IMG.craft.hands },
    ],
  }),
  component: About,
});

const SUBNAV = [
  { label: "Vision", hash: "vision" },
  { label: "Artisans", hash: "artisans" },
  { label: "Matières", hash: "quality" },
  { label: "France", hash: "france" },
  { label: "Entretien", to: "/care" as const },
  { label: "Tailles", to: "/sizing" as const },
];

function About() {
  return (
    <>
      <section className="page-wrap section-pad pt-24 pb-12 max-w-5xl">
        <p className="text-eyebrow text-muted-foreground">{about.eyebrow}</p>
        <h1 className="font-display text-5xl md:text-8xl mt-4 leading-[0.95] tracking-tight">
          {about.title}
        </h1>
        <nav className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-eyebrow">
          {SUBNAV.map((item) =>
            item.to ? (
              <Link key={item.label} to={item.to} className="link-underline">
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={`#${item.hash}`} className="link-underline">
                {item.label}
              </a>
            ),
          )}
        </nav>
      </section>

      {about.youtubeId && (
        <section className="page-wrap section-pad pb-16">
          <div className="aspect-video max-w-4xl bg-muted overflow-hidden">
            <iframe
              title="Bingin Diaries — la marque"
              src={`https://www.youtube.com/embed/${about.youtubeId}`}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {about.sections.map((section, i) => (
        <section
          key={section.id}
          id={section.id}
          className={`scroll-mt-24 ${i % 2 === 0 ? "bg-background" : "bg-secondary/30"}`}
        >
          <div className="page-wrap section-pad py-16 md:py-24 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {i % 2 === 0 && (
              <img
                src={[IMG.craft.hands, IMG.craft.fabric, IMG.editorial, IMG.craft.travel][i] ?? IMG.craft.hands}
                alt={section.title}
                className="w-full aspect-[4/5] object-cover image-editorial order-2 md:order-1"
                loading="lazy"
              />
            )}
            <div className={i % 2 === 0 ? "order-1 md:order-2" : ""}>
              <p className="text-eyebrow text-muted-foreground">{section.eyebrow}</p>
              <h2 className="font-display text-3xl md:text-4xl mt-4 leading-tight">{section.title}</h2>
              <p className="mt-6 text-muted-foreground leading-relaxed">{section.body}</p>
            </div>
            {i % 2 !== 0 && (
              <img
                src={[IMG.craft.hands, IMG.craft.fabric, IMG.editorial, IMG.craft.travel][i] ?? IMG.craft.fabric}
                alt={section.title}
                className="w-full aspect-[4/5] object-cover image-editorial"
                loading="lazy"
              />
            )}
          </div>
        </section>
      ))}

      <section className="page-wrap section-pad py-24 grid md:grid-cols-3 gap-12">
        {about.values.map((b) => (
          <div key={b.n}>
            <p className="font-mono text-accent">{b.n}</p>
            <h3 className="font-display text-2xl mt-3">{b.t}</h3>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{b.d}</p>
          </div>
        ))}
      </section>

      <section className="page-wrap section-pad pb-24 flex flex-wrap gap-4 text-sm">
        <Link to="/care" className="btn-secondary">
          Guide d'entretien
        </Link>
        <Link to="/sizing" className="btn-secondary">
          Guide des tailles
        </Link>
        <Link to="/find-us" className="btn-secondary">
          Find us
        </Link>
      </section>
    </>
  );
}
