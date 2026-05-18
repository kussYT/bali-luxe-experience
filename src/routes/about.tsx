import { createFileRoute } from "@tanstack/react-router";
import about from "@/assets/about.jpg";
import collection2 from "@/assets/collection-2.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Atelier — Bingin Diaries" },
      { name: "description", content: "A small house woven between Bali and France." },
      { property: "og:image", content: about },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <section className="px-6 md:px-14 pt-24 pb-20 max-w-5xl">
        <p className="text-eyebrow text-muted-foreground">The atelier</p>
        <h1 className="font-display text-5xl md:text-8xl mt-4 leading-[0.95] tracking-tight">
          Two homes,<br />one diary.
        </h1>
      </section>

      <section className="grid md:grid-cols-2 gap-px bg-border">
        <img src={about} alt="Hand weaving" className="size-full object-cover aspect-[4/5]" loading="lazy" />
        <div className="bg-background p-8 md:p-16 flex flex-col justify-center">
          <p className="text-eyebrow text-muted-foreground">Origin</p>
          <h2 className="font-display text-3xl md:text-4xl mt-4 leading-tight">
            Born from a long, slow ride between Canggu and the South of France.
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Bingin Diaries is a small house of hand-woven hats — designed in France, made in Bali, finished by hand. We work with a few artisans we know by name, in a rhythm that lets each piece breathe.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We believe in a quieter kind of fashion. One that travels well, that ages well, and that carries the memory of the place it came from.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-14 py-24 grid md:grid-cols-3 gap-12">
        {[
          { n: "01", t: "Hand-woven", d: "Each hat is woven by a single artisan, start to finish." },
          { n: "02", t: "Two ateliers", d: "Designed in France. Hand-made in Bali. Shipped from both." },
          { n: "03", t: "Slow by design", d: "Small drops, considered details, no waste." },
        ].map((b) => (
          <div key={b.n}>
            <p className="font-mono text-clay">{b.n}</p>
            <h3 className="font-display text-2xl mt-3">{b.t}</h3>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{b.d}</p>
          </div>
        ))}
      </section>

      <section className="relative h-[70vh] overflow-hidden">
        <img src={collection2} alt="Bali rice fields" className="absolute inset-0 size-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-ink/30" />
        <div className="relative h-full flex items-end p-8 md:p-14 text-bone">
          <p className="font-display text-3xl md:text-5xl max-w-3xl leading-tight">
            From the rice fields of Ubud to the limestone cliffs of Cassis — every piece is a small diary entry.
          </p>
        </div>
      </section>
    </>
  );
}
