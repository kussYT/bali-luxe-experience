import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Plus, Minus } from "lucide-react";
import { useCatalog } from "@/lib/catalog-context";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${params.slug} — Bingin Diaries` }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { publishedProducts } = useCatalog();
  const product = publishedProducts.find((p) => p.slug === slug);
  const { add, toggleWish, wishlist } = useCart();
  const { format } = useCurrency();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const wished = wishlist.includes(slug);

  if (!product) {
    return (
      <div className="px-6 md:px-14 py-32 text-center">
        <h1 className="font-display text-5xl">Piece not found</h1>
        <Link to="/collection" className="mt-6 inline-block text-eyebrow link-underline">
          Back to collection
        </Link>
      </div>
    );
  }

  const related = publishedProducts
    .filter((p) => p.slug !== product.slug && p.collectionSlug === product.collectionSlug)
    .slice(0, 3);
  const suggestions =
    related.length > 0 ?
      related
    : publishedProducts.filter((p) => p.slug !== product.slug).slice(0, 3);

  const gallery = product.images.length > 0 ? product.images : [product.image];

  return (
    <>
      <section className="grid md:grid-cols-2 gap-px bg-border">
        <div className="bg-sand md:sticky md:top-20 md:self-start">
          <img
            src={gallery[activeImage]}
            alt={product.name}
            className="size-full object-cover aspect-square md:aspect-auto md:max-h-[90vh] animate-fade-in"
          />
          {gallery.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto border-t border-border/40 bg-background/80">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 size-16 overflow-hidden border-2 transition ${activeImage === i ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 md:p-14 flex flex-col justify-center bg-background animate-fade-up">
          <p className="text-eyebrow text-muted-foreground">
            {product.collection}
            {product.subcategory ? ` — ${product.subcategory}` : ""}
          </p>
          <h1 className="font-display text-4xl md:text-6xl mt-4 leading-[1]">{product.name}</h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">{product.story}</p>

          <div className="mt-8 flex items-baseline gap-3">
            <p className="font-mono text-2xl">{format(product)}</p>
            {product.onSale && product.compareAtEUR != null && (
              <p className="font-mono text-lg text-muted-foreground line-through">€{product.priceEUR}</p>
            )}
            {product.onSale && <span className="text-eyebrow text-clay">Sale</span>}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-border">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="size-12 flex items-center justify-center"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-10 text-center font-mono text-sm">{qty}</span>
              <button type="button" onClick={() => setQty(qty + 1)} className="size-12 flex items-center justify-center">
                <Plus className="size-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => Array.from({ length: qty }).forEach(() => add(product.slug))}
              disabled={!product.available || product.stock <= 0}
              className="flex-1 bg-ink text-bone py-4 text-eyebrow hover:bg-clay transition-colors disabled:opacity-50"
            >
              {product.available ? "Add to cart" : "Sold out"}
            </button>
            <button
              type="button"
              onClick={() => toggleWish(product.slug)}
              className="size-12 border border-border flex items-center justify-center hover:border-ink"
              aria-label="Wishlist"
            >
              <Heart className={`size-4 ${wished ? "fill-clay text-clay" : ""}`} />
            </button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
        </div>
      </section>

      <section className="px-6 md:px-14 py-24">
        <h2 className="font-display text-3xl md:text-4xl mb-10">You may also like</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
          {suggestions.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
