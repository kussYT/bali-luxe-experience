import { Link } from "@tanstack/react-router";
import { useCatalog } from "@/lib/catalog-context";
import { useSiteContent } from "@/lib/content-context";
import { useCurrency } from "@/lib/currency";
import { focalObjectPosition } from "@/lib/image-focal";

export function SpotlightProduct() {
  const { homepage, loading: contentLoading } = useSiteContent();
  const { publishedProducts, loading: catalogLoading } = useCatalog();
  const { format } = useCurrency();
  const spotlight = homepage.spotlightProduct;

  if (contentLoading || catalogLoading) return null;
  if (!spotlight?.enabled || !spotlight.productSlug) return null;

  const product = publishedProducts.find((p) => p.slug === spotlight.productSlug);
  if (!product) return null;

  const image = spotlight.image || product.image;
  const imageFocal = spotlight.image ? spotlight.imageFocal : product.imageFocal;

  return (
    <section className="page-wrap section-pad py-14 md:py-20 bg-white border-y border-border">
      <Reveal>
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 lg:gap-20 items-center">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="group block overflow-hidden bg-secondary aspect-[4/5] md:aspect-[3/4]"
          >
            <img
              src={image}
              alt={product.name}
              className="size-full object-cover image-editorial transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
              style={{ objectPosition: focalObjectPosition(imageFocal) }}
              loading="lazy"
            />
          </Link>
          <div className="max-w-md">
            <p className="text-eyebrow">{spotlight.eyebrow}</p>
            <h2 className="font-display text-3xl md:text-5xl mt-3 leading-[0.95]">
              {spotlight.title || product.name}
            </h2>
            {spotlight.description && (
              <p className="text-caption mt-5 text-foreground/75">{spotlight.description}</p>
            )}
            <p className="text-sm tracking-wide mt-6">{format(product)}</p>
            <Link
              to="/product/$slug"
              params={{ slug: product.slug }}
              className="inline-block mt-8 btn-primary"
            >
              {spotlight.ctaLabel || "Discover the piece"}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
