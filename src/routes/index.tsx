import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import collection1 from "@/assets/collection-1.jpg";
import collection2 from "@/assets/collection-2.jpg";
import collection3 from "@/assets/collection-3.jpg";
import { featuredProducts } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bingin Diaries — Hand-woven hats from Bali & France" },
      { name: "description", content: "A boutique house of sun-soaked hats, hand-woven between Canggu and Paris." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative h-[92vh] overflow-hidden bg-ink">
        <img
          src={hero}
          alt="Sunburn Fall Winter 2025"
          className="absolute inset-0 size-full object-cover animate-zoom-out"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink/50" />
        <div className="relative h-full flex flex-col justify-end p-6 md:p-14 text-bone animate-fade-up">
          <p className="text-eyebrow opacity-80 mb-5">Fall/Winter 2025 — The sunburn effect</p>
          <h1 className="font-display text-[14vw] md:text-[8.5vw] leading-[0.9] max-w-[14ch]">
            For the endless<br />summer days.
          </h1>
          <div className="mt-8 flex flex-col md:flex-row items-start md:items-center gap-5">
            <Link to="/collection" className="bg-bone text-ink px-8 py-3.5 text-eyebrow hover:bg-clay hover:text-bone transition-colors">
              Order now
            </Link>
            <Link to="/collection" className="text-eyebrow link-underline opacity-90">Shop all</Link>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="px-6 md:px-14 py-32 max-w-5xl">
        <p className="text-eyebrow text-muted-foreground mb-6">House — Est. Canggu / Paris</p>
        <h2 className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight">
          A small house of hats, woven slowly between two homes — the black sand of Bali and the limestone light of the South of France.
        </h2>
      </section>

      {/* EDITORIAL TRIPTYCH */}
      <section className="grid md:grid-cols-3 gap-px bg-border">
        {[
          { img: collection1, title: "Sunburn", caption: "For the endless summer days" },
          { img: collection2, title: "Juicy Record", caption: "Woven by hand in Bali" },
          { img: collection3, title: "Endless Summer", caption: "From Riviera terraces" },
        ].map((c, i) => (
          <Link
            key={c.title}
            to="/collection"
            className="group relative bg-background animate-fade-up"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <div className="overflow-hidden aspect-[3/4] bg-sand">
              <img
                src={c.img}
                alt={c.title}
                loading="lazy"
                className="size-full object-cover transition-transform duration-[1400ms] group-hover:scale-105"
              />
            </div>
            <div className="p-6 md:p-8">
              <p className="text-eyebrow text-muted-foreground">{c.caption}</p>
              <h3 className="font-display text-3xl md:text-4xl mt-2">{c.title}</h3>
            </div>
          </Link>
        ))}
      </section>

      {/* PRODUCTS */}
      <section className="px-6 md:px-14 py-28">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-eyebrow text-muted-foreground">Featured</p>
            <h2 className="font-display text-4xl md:text-5xl mt-2">The hats of the season</h2>
          </div>
          <Link to="/collection" className="text-eyebrow link-underline hidden md:inline">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
          {featuredProducts.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* QUOTE */}
      <section className="bg-sand px-6 md:px-14 py-32 text-center">
        <p className="font-display text-3xl md:text-5xl max-w-4xl mx-auto leading-[1.15] tracking-tight">
          "Each piece carries the memory of the hands that made it — a small diary of sun, salt, and slow time."
        </p>
        <p className="text-eyebrow text-muted-foreground mt-8">— The atelier</p>
      </section>

      {/* INSTAGRAM */}
      <section className="px-6 md:px-14 py-28">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-eyebrow text-muted-foreground">@bingindiaries</p>
            <h2 className="font-display text-4xl md:text-5xl mt-2">Diaries</h2>
          </div>
          <a href="https://instagram.com" className="text-eyebrow link-underline">Follow</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {[hero, collection1, collection2, collection3].map((src, i) => (
            <a key={i} href="#" className="block aspect-square overflow-hidden bg-sand">
              <img src={src} alt="" loading="lazy" className="size-full object-cover hover:scale-105 transition-transform duration-700" />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
