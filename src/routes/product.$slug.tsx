import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, Plus, Minus } from "lucide-react";
import { useRegionalCatalog } from "@/lib/use-regional-catalog";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { useSiteContent } from "@/lib/content-context";
import { fillProductMessage } from "@/lib/product-messages";
import { ProductCard } from "@/components/site/ProductCard";
import { PageMeta } from "@/components/site/PageMeta";
import { VariantSelector } from "@/components/site/VariantSelector";
import { getDefaultVariant, getVariant, maxCartQty } from "@/lib/warehouse-allocation";
import { productObjectPosition, focalObjectPosition } from "@/lib/image-focal";
import { trackProductEvent, productFocalAt } from "@/lib/track-product-analytics";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${params.slug} — Bingin Diaries` }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { publishedProducts, regionalProducts, isRegionallyAvailable, maxQty: regionalMaxQty, warehouseLabel, countryCode, zones } =
    useRegionalCatalog();
  const product = publishedProducts.find((p) => p.slug === slug);
  const { add, toggleWish, wishlist } = useCart();
  const { format, formatEur, shipping } = useCurrency();
  const { productMessages } = useSiteContent();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const wished = wishlist.includes(slug);

  const initialVariantId = useMemo(() => {
    if (!product?.variants?.length) return null;
    const inStock = product.variants.find((v) => maxCartQty(product, countryCode, v.id, zones) > 0);
    return (inStock ?? getDefaultVariant(product))?.id ?? null;
  }, [product, countryCode, zones]);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(initialVariantId);

  useEffect(() => {
    setSelectedVariantId(initialVariantId);
    setQty(1);
    setActiveImage(0);
  }, [slug, initialVariantId]);

  useEffect(() => {
    if (product?.slug) trackProductEvent(product.slug, "view");
  }, [product?.slug]);

  if (!product) {
    return (
      <div className="page-wrap section-pad py-32 text-center">
        <h1 className="font-display text-5xl">Piece not found</h1>
        <Link to="/collection" className="mt-6 inline-block text-eyebrow link-underline !text-foreground">
          Back to collection
        </Link>
      </div>
    );
  }

  const selectedVariant = getVariant(product, selectedVariantId);
  const maxQty = regionalMaxQty(product, selectedVariant?.id);
  const hasVariants = (product.variants?.length ?? 0) > 1;
  const regionallyAvailable = isRegionallyAvailable(product);
  const canAdd = maxQty > 0 && product.available && regionallyAvailable;

  const related = regionalProducts
    .filter((p) => p.slug !== product.slug && p.collectionSlug === product.collectionSlug)
    .slice(0, 3);
  const suggestions =
    related.length > 0 ?
      related
    : regionalProducts.filter((p) => p.slug !== product.slug).slice(0, 3);

  const gallery = product.images.length > 0 ? product.images : [product.image];
  const showVideo = Boolean(product.videoUrl);
  const isVideoActive = showVideo && activeImage === 0;
  const imageIndex = showVideo ? activeImage - 1 : activeImage;
  const displayImageIndex = Math.max(0, imageIndex);
  const displayFocal =
    productFocalAt(product, displayImageIndex) ??
    (displayImageIndex === 0 ? productObjectPosition(product) : focalObjectPosition());
  const pageTitle = product.seoTitle?.trim() || `${product.name} — Bingin Diaries`;
  const pageDescription = product.metaDescription?.trim() || undefined;

  return (
    <>
      <PageMeta title={pageTitle} description={pageDescription} />
      <section className="grid md:grid-cols-[1.1fr_0.9fr] min-h-[calc(100vh-4.25rem)] md:min-h-[calc(100vh-5.25rem)]">
        <div className="bg-secondary md:sticky md:top-[5.25rem] md:self-start md:max-h-[calc(100vh-5.25rem)] overflow-hidden">
          {isVideoActive ? (
            <video
              src={product.videoUrl}
              className="w-full h-full object-cover aspect-[4/5] md:aspect-auto md:min-h-[calc(100vh-5.25rem)]"
              autoPlay
              muted
              loop
              playsInline
              poster={gallery[0]}
            />
          ) : (
            <img
              src={gallery[displayImageIndex] ?? gallery[0]}
              alt={product.name}
              className="w-full h-full object-cover aspect-[4/5] md:aspect-auto md:min-h-[calc(100vh-5.25rem)] image-editorial animate-fade-in"
              style={{ objectPosition: displayFocal }}
            />
          )}
          {(gallery.length > 1 || showVideo) && (
            <div className="flex gap-2 p-4 overflow-x-auto border-t border-border bg-surface/90">
              {showVideo && (
                <button
                  type="button"
                  onClick={() => setActiveImage(0)}
                  className={`shrink-0 size-14 overflow-hidden rounded-sm border transition-colors duration-300 flex items-center justify-center text-[0.6rem] uppercase tracking-wider ${activeImage === 0 ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  Video
                </button>
              )}
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(showVideo ? i + 1 : i)}
                  className={`shrink-0 size-14 overflow-hidden rounded-sm border transition-colors duration-300 ${activeImage === (showVideo ? i + 1 : i) ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img
                    src={src}
                    alt=""
                    className="size-full object-cover image-editorial"
                    style={{ objectPosition: productFocalAt(product, i) ?? focalObjectPosition() }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="page-wrap section-pad py-12 md:py-20 flex flex-col justify-center bg-surface animate-fade-up">
          <p className="text-eyebrow">
            {product.collection}
            {product.subcategory ? ` — ${product.subcategory}` : ""}
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl mt-3 leading-[1.02]">{product.name}</h1>
          <p className="mt-6 text-caption max-w-md leading-relaxed">{product.story}</p>

          <div className="mt-8 flex items-baseline gap-4">
            <p className="text-xl tracking-wide">{format(product)}</p>
            {product.onSale && product.compareAtEUR != null && (
              <p className="text-sm text-muted-foreground line-through">{formatEur(product.priceEUR)}</p>
            )}
            {product.onSale && (
              <span className="text-eyebrow !text-accent">Sale</span>
            )}
          </div>

          {!regionallyAvailable && (
            <p className="mt-6 text-sm text-muted-foreground border border-border rounded-sm p-4 max-w-md leading-relaxed">
              {fillProductMessage(productMessages.regionalUnavailable, {
                warehouse: warehouseLabel,
                country: shipping.name,
              })}
            </p>
          )}

          <VariantSelector
            product={product}
            selectedId={selectedVariantId}
            countryCode={countryCode}
            zones={zones}
            onSelect={(id) => {
              setSelectedVariantId(id);
              setQty(1);
            }}
          />

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center border border-border rounded-sm w-fit">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="size-11 flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <Minus className="size-3 stroke-[1.25]" />
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(Math.min(maxQty, qty + 1))}
                disabled={qty >= maxQty}
                className="size-11 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40"
              >
                <Plus className="size-3 stroke-[1.25]" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => add(product.slug, qty, selectedVariant?.id)}
              disabled={!canAdd || (hasVariants && !selectedVariant)}
              className="btn-primary flex-1 sm:flex-none disabled:opacity-45"
            >
              {canAdd
                ? productMessages.addToBag
                : regionallyAvailable
                  ? productMessages.soldOut
                  : productMessages.unavailableInRegion}
            </button>
            <button
              type="button"
              onClick={() => toggleWish(product.slug)}
              className="size-11 border border-border rounded-sm flex items-center justify-center hover:border-foreground transition-colors"
              aria-label="Wishlist"
            >
              <Heart className={`size-3.5 stroke-[1.25] ${wished ? "fill-accent text-accent" : ""}`} />
            </button>
          </div>

          <p className="mt-5 text-caption">
            {maxQty > 0
              ? fillProductMessage(productMessages.inStock, {
                  count: String(maxQty),
                  variant:
                    selectedVariant && selectedVariant.title !== "Default"
                      ? ` (${selectedVariant.title})`
                      : "",
                  warehouse: warehouseLabel,
                })
              : productMessages.soldOut}
          </p>
        </div>
      </section>

      <section className="page-wrap section-pad section-gap editorial-rule">
        <p className="text-eyebrow mb-3">Complete the look</p>
        <h2 className="font-display text-3xl md:text-4xl mb-10 md:mb-14">You may also like</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-14">
          {suggestions.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
