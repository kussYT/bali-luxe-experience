import { createFileRoute, Link } from "@tanstack/react-router";
import { useCatalog } from "@/lib/catalog-context";
import { useSiteContent } from "@/lib/content-context";
import { PageMeta } from "@/components/site/PageMeta";
import { ProductCard } from "@/components/site/ProductCard";
import { CinematicHero } from "@/components/lifestyle/CinematicHero";
import { HomePhotoStrip } from "@/components/lifestyle/HomePhotoStrip";
import { SpotlightProduct } from "@/components/lifestyle/SpotlightProduct";
import { InstagramSection } from "@/components/lifestyle/InstagramSection";
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
  const { homepage } = useSiteContent();
  const featured = homepage.featuredSection;
  const seo = homepage.seo ?? {
    title: "Bingin Diaries — Hand-woven hats from Bali & France",
    metaDescription:
      "A boutique house of sun-soaked hats, hand-woven between Canggu and Paris.",
  };

  return (
    <>
      <PageMeta title={seo.title} description={seo.metaDescription} />
      <CinematicHero />

      <HomePhotoStrip />

      <SpotlightProduct />

      <section className="page-wrap section-pad section-gap bg-white">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10 md:mb-14">
            <div>
              <p className="text-eyebrow">{featured.eyebrow}</p>
              <h2 className="font-display text-3xl md:text-5xl mt-2 text-foreground">{featured.title}</h2>
            </div>
            <Link
              to="/collection"
              className="text-eyebrow link-underline text-muted-foreground hover:!text-foreground"
            >
              Shop all
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-5 md:gap-y-14">
          {featuredProducts.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>

      <InstagramSection />
    </>
  );
}
