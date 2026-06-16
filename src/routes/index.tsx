import { createFileRoute, Link } from "@tanstack/react-router";
import { IMG } from "@/data/lifestyle-content";
import { useCatalog } from "@/lib/catalog-context";
import { ProductCard } from "@/components/site/ProductCard";
import { CinematicHero } from "@/components/lifestyle/CinematicHero";
import { EditorialStrip } from "@/components/lifestyle/EditorialStrip";
import { JournalSection } from "@/components/lifestyle/JournalSection";
import { LookbookSection } from "@/components/lifestyle/LookbookSection";
import { ShopTheMood } from "@/components/lifestyle/ShopTheMood";
import { CraftSection } from "@/components/lifestyle/CraftSection";
import { BinginSounds } from "@/components/lifestyle/BinginSounds";
import { InstagramSection } from "@/components/lifestyle/InstagramSection";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { Reveal } from "@/components/lifestyle/Reveal";

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
      <CinematicHero poster={IMG.hero} />

      <EditorialStrip />

      <section className="page-wrap section-pad section-gap editorial-rule">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-12 md:mb-16">
            <div>
              <p className="text-eyebrow">Curated</p>
              <h2 className="font-display text-3xl md:text-5xl mt-2">Pieces of the season</h2>
            </div>
            <Link
              to="/collection"
              className="text-eyebrow link-underline !text-muted-foreground hover:!text-foreground"
            >
              Shop all
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
          {featuredProducts.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>

      <LookbookSection />

      <ShopTheMood />

      <JournalSection />

      <CraftSection />

      <section className="bg-secondary section-pad py-20 md:py-28">
        <Reveal>
          <blockquote className="page-wrap font-display text-3xl md:text-[2.75rem] lg:text-5xl max-w-4xl mx-auto text-center leading-[1.14] tracking-tight italic text-foreground/95">
            Each piece carries the memory of the hands that made it — a small diary of sun, salt, and slow time.
          </blockquote>
          <p className="text-eyebrow text-center mt-8">The atelier · Bali & France</p>
        </Reveal>
      </section>

      <InstagramSection />

      <NewsletterForm source="homepage" variant="section" />

      <BinginSounds />
    </>
  );
}
