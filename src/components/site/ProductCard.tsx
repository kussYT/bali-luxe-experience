import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/products";
import { useCurrency } from "@/lib/currency";
import { useCart } from "@/lib/cart";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { format } = useCurrency();
  const { toggleWish, wishlist } = useCart();
  const wished = wishlist.includes(product.slug);

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative overflow-hidden bg-sand aspect-[4/5]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
        />
        <button
          onClick={(e) => { e.preventDefault(); toggleWish(product.slug); }}
          className="absolute top-4 right-4 size-9 rounded-full bg-bone/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          aria-label="Wishlist"
        >
          <Heart className={`size-4 ${wished ? "fill-clay text-clay" : ""}`} />
        </button>
        {product.onSale && (
          <span className="absolute top-4 left-4 text-eyebrow bg-clay text-bone px-2.5 py-1">
            Sale
          </span>
        )}
      </div>
      <div className="pt-4 flex items-baseline justify-between">
        <div>
          <p className="font-display text-lg leading-tight">{product.name}</p>
          <p className="text-eyebrow text-muted-foreground mt-1">{product.collection}</p>
        </div>
        <p className="text-sm font-mono">{format(product)}</p>
      </div>
    </Link>
  );
}
