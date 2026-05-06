import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Plus, Minus } from "lucide-react";
import { products } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = products.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — Bing in Diaries` },
          { name: "description", content: loaderData.product.story },
          { property: "og:image", content: loaderData.product.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="px-6 md:px-14 py-32 text-center">
      <h1 className="font-display text-5xl">Piece not found</h1>
      <Link to="/collection" className="mt-6 inline-block text-eyebrow link-underline">Back to collection</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="px-6 md:px-14 py-32 text-center">
      <h1 className="font-display text-5xl">Something went wrong</h1>
      <p className="text-muted-foreground mt-4">{error.message}</p>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { add, toggleWish, wishlist } = useCart();
  const { format } = useCurrency();
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("M");
  const wished = wishlist.includes(product.slug);

  const related = products.filter((p) => p.slug !== product.slug).slice(0, 3);

  return (
    <>
      <section className="grid md:grid-cols-2 gap-px bg-border">
        <div className="bg-sand">
          <img
            src={product.image}
            alt={product.name}
            className="size-full object-cover aspect-square md:aspect-auto md:h-[90vh] animate-fade-in"
          />
        </div>

        <div className="p-8 md:p-14 flex flex-col justify-center bg-background animate-fade-up">
          <p className="text-eyebrow text-muted-foreground">{product.collection} — Made in {product.origin}</p>
          <h1 className="font-display text-4xl md:text-6xl mt-4 leading-[1]">{product.name}</h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">{product.story}</p>

          <p className="mt-8 font-mono text-2xl">{format(product)}</p>

          <div className="mt-8">
            <p className="text-eyebrow mb-3">Size</p>
            <div className="flex gap-2">
              {["S", "M", "L"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`size-12 border text-sm transition ${size === s ? "border-ink bg-ink text-bone" : "border-border hover:border-ink"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="size-12 flex items-center justify-center"><Minus className="size-3.5" /></button>
              <span className="w-10 text-center font-mono text-sm">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="size-12 flex items-center justify-center"><Plus className="size-3.5" /></button>
            </div>
            <button
              onClick={() => Array.from({ length: qty }).forEach(() => add(product.slug))}
              className="flex-1 bg-ink text-bone py-4 text-eyebrow hover:bg-clay transition-colors"
            >
              Add to cart
            </button>
            <button
              onClick={() => toggleWish(product.slug)}
              className="size-12 border border-border flex items-center justify-center hover:border-ink"
              aria-label="Wishlist"
            >
              <Heart className={`size-4 ${wished ? "fill-clay text-clay" : ""}`} />
            </button>
          </div>

          <div className="mt-12 border-t border-border pt-8">
            <p className="text-eyebrow mb-4">The detail</p>
            <ul className="space-y-2 text-sm">
              {product.details.map((d) => (
                <li key={d} className="flex items-start gap-3">
                  <span className="text-clay mt-2 block size-1 rounded-full bg-clay" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-14 py-24">
        <h2 className="font-display text-3xl md:text-4xl mb-10">You may also like</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
          {related.map((p, i) => <ProductCard key={p.slug} product={p} index={i} />)}
        </div>
      </section>
    </>
  );
}
