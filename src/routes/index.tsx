import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import collection1 from "@/assets/collection-1.jpg";
import collection2 from "@/assets/collection-2.jpg";
import collection3 from "@/assets/collection-3.jpg";
import { useCatalog } from "@/lib/catalog-context";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bingin Diaries — Hand-woven hats from Bali & France" },
      {
        name: "description",
        content: "A boutique house of sun-soaked hats, hand-woven between Canggu and Paris.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { featuredProducts } = useCatalog();

  return (
    <>
      <section className="relative min-h-[90vh] md:min-h-[94vh] overflow-hidden bg-foreground grain">
        <img
          src={hero}
          alt="Sunburn collection"
          className="absolute inset-0 size-full object-cover image-editorial animate-zoom-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/15 to-foreground/25" />
        <div className="relative min-h-[90vh] md:min-h-[94vh] flex flex-col justify-end page-wrap section-pad pb-14 md:pb-20 text-surface animate-fade-up">
          <p className="text-eyebrow !text-surface/70 mb-5 md:mb-7">Canggu · Paris — Fall / Winter</p>
          <h1 className="font-display text-[11vw] md:text-[6.5rem] lg:text-[7.25rem] leading-[0.9] max-w-[11ch] font-light italic">
            For the endless summer days.
          </h1>
          <p className="text-caption max-w-md mt-6 md:mt-8 !text-surface/75">
            Hand-woven hats for slow mornings, salt air, and the rhythm of travel.
          </p>
          <div className="mt-9 md:mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-5 md:gap-8">
            <Link
              to="/collection"
              className="btn-primary bg-surface text-foreground hover:bg-accent hover:text-surface"
            >
              Shop the collection
            </Link>
            <Link to="/about" className="btn-ghost !text-surface">
              Our story
            </Link>
          </div>
        </div>
      </section>

      <section className="page-wrap section-pad section-gap">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="overflow-hidden aspect-[4/5] lg:aspect-[5/6] bg-secondary">
            <img
              src={collection2}
              alt="Atelier in Bali"
              loading="lazy"
              className="size-full object-cover image-editorial"
            />
          </div>
          <div className="lg:py-8">
            <p className="text-eyebrow mb-6">The house</p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.04]">
              A small diary of hats, woven slowly between black sand and limestone light.
            </h2>
            <p className="text-caption mt-8 max-w-md">
              Bingin Diaries is a luxury Bali lifestyle house — premium, solar, and quietly feminine. Each piece is
              slow-made for long summers and the art of travelling light.
            </p>
            <Link to="/about" className="inline-block mt-10 text-eyebrow link-underline !text-foreground">
              Discover the atelier
            </Link>
          </div>
        </div>
      </section>

      <section className="page-wrap section-pad pb-16 md:pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 md:mb-14">
          <div>
            <p className="text-eyebrow">Collections</p>
            <h2 className="font-display text-3xl md:text-5xl mt-2">Three moods of summer</h2>
          </div>
          <Link to="/collection" className="text-eyebrow link-underline !text-muted hover:!text-foreground">
            View all
          </Link>
        </div>
        <div className="grid md:grid-cols-12 gap-5 md:gap-6">
          <Link
            to="/collection"
            className="group md:col-span-7 block animate-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            <div className="overflow-hidden aspect-[4/5] md:aspect-[5/6] bg-secondary">
              <img
                src={collection1}
                alt="Sunburn"
                loading="lazy"
                className="size-full object-cover image-editorial transition-transform duration-[1.8s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
              />
            </div>
            <div className="pt-6 border-b border-border pb-5">
              <p className="text-eyebrow">01 — Sunburn</p>
              <h3 className="font-display text-3xl md:text-4xl mt-2 group-hover:text-accent transition-colors duration-500">
                Endless summer days
              </h3>
            </div>
          </Link>
          <div className="md:col-span-5 flex flex-col gap-5 md:gap-6">
            {[
              { img: collection2, num: "02", title: "Juicy Record", sub: "Hand-woven in Bali" },
              { img: collection3, num: "03", title: "Endless Summer", sub: "Riviera light" },
            ].map((c, i) => (
              <Link
                key={c.title}
                to="/collection"
                className="group block animate-fade-up"
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
              >
                <div className="overflow-hidden aspect-[16/10] bg-secondary">
                  <img
                    src={c.img}
                    alt={c.title}
                    loading="lazy"
                    className="size-full object-cover image-editorial transition-transform duration-[1.8s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
                  />
                </div>
                <div className="pt-4 border-b border-border pb-4">
                  <p className="text-eyebrow">
                    {c.num} — {c.title}
                  </p>
                  <p className="font-display text-xl md:text-2xl mt-1 group-hover:text-accent transition-colors duration-500">
                    {c.sub}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-wrap section-pad section-gap editorial-rule">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-12 md:mb-16">
          <div>
            <p className="text-eyebrow">Curated</p>
            <h2 className="font-display text-3xl md:text-5xl mt-2">Pieces of the season</h2>
          </div>
          <Link to="/collection" className="text-eyebrow link-underline !text-muted hover:!text-foreground">
            Shop all
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
          {featuredProducts.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>

      <section className="bg-secondary section-pad py-20 md:py-28">
        <blockquote className="page-wrap font-display text-3xl md:text-[2.75rem] lg:text-5xl max-w-4xl mx-auto text-center leading-[1.14] tracking-tight italic text-foreground/95">
          Each piece carries the memory of the hands that made it — a small diary of sun, salt, and slow time.
        </blockquote>
        <p className="text-eyebrow text-center mt-8">The atelier · Bali & France</p>
      </section>

      <section className="page-wrap section-pad section-gap">
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <div>
            <p className="text-eyebrow">@bingindiaries</p>
            <h2 className="font-display text-3xl md:text-5xl mt-2">Travel diaries</h2>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="text-eyebrow link-underline !text-muted hover:!text-foreground"
          >
            Follow
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {[hero, collection1, collection2, collection3].map((src, i) => (
            <a key={i} href="#" className="block aspect-[4/5] overflow-hidden bg-secondary group">
              <img
                src={src}
                alt=""
                loading="lazy"
                className="size-full object-cover image-editorial transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
