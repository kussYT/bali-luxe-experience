import { createFileRoute } from "@tanstack/react-router";
import { IMG } from "@/data/lifestyle-content";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Atelier — Bingin Diaries" },
      { name: "description", content: "A small house woven between Bali and France." },
      { property: "og:image", content: IMG.editorial },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <section className="page-wrap section-pad pt-24 pb-20 max-w-5xl">
        <p className="text-eyebrow text-muted-foreground">The atelier</p>
        <h1 className="font-display text-5xl md:text-8xl mt-4 leading-[0.95] tracking-tight">
          Two homes,
          <br />
          one diary.
        </h1>
      </section>

      <section id="atelier" className="grid md:grid-cols-2 gap-px bg-border scroll-mt-24">
        <img
          src={IMG.craft.hands}
          alt="Hand weaving"
          className="size-full object-cover aspect-[4/5] image-editorial"
          loading="lazy"
        />
        <div className="bg-background p-8 md:p-16 flex flex-col justify-center">
          <p className="text-eyebrow text-muted-foreground">Origin</p>
          <h2 className="font-display text-3xl md:text-4xl mt-4 leading-tight">
            Born from a long, slow ride between Canggu and the South of France.
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Bingin Diaries is a small house of hand-woven hats — designed in France, made in Bali, finished by hand. We
            work with a few artisans we know by name, in a rhythm that lets each piece breathe.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We believe in a quieter kind of fashion. One that travels well, that ages well, and that carries the memory
            of the place it came from.
          </p>
        </div>
      </section>

      <section className="page-wrap section-pad py-24 grid md:grid-cols-3 gap-12">
        {[
          { n: "01", t: "Hand-woven", d: "Each hat is woven by a single artisan, start to finish." },
          { n: "02", t: "Two ateliers", d: "Designed in France. Hand-made in Bali. Shipped from both." },
          { n: "03", t: "Slow by design", d: "Small drops, considered details, no waste." },
        ].map((b) => (
          <div key={b.n}>
            <p className="font-mono text-accent">{b.n}</p>
            <h3 className="font-display text-2xl mt-3">{b.t}</h3>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{b.d}</p>
          </div>
        ))}
      </section>

      <section className="relative h-[70vh] overflow-hidden">
        <img
          src={IMG.editorial}
          alt="Bali rice fields"
          className="absolute inset-0 size-full object-cover image-editorial"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-foreground/30" />
        <div className="relative h-full flex items-end page-wrap section-pad pb-10 md:pb-14 text-surface">
          <p className="font-display text-3xl md:text-5xl max-w-3xl leading-tight">
            From the rice fields of Ubud to the limestone cliffs of Cassis — every piece is a small diary entry.
          </p>
        </div>
      </section>
    </>
  );
}
