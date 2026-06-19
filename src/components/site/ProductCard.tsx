import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/catalog-types";
import { useCurrency } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import { productMiniDescription } from "@/lib/product-display";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { format } = useCurrency();
  const { toggleWish, wishlist } = useCart();
  const wished = wishlist.includes(product.slug);
  const mini = productMiniDescription(product);

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block animate-fade-up bg-white"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="product-image-wrap relative mb-3 md:mb-4 bg-white">
        <img src={product.image} alt={product.name} loading="lazy" className="image-editorial" />
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWish(product.slug);
          }}
          className="absolute top-2 right-2 size-8 flex items-center justify-center bg-white/90 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-500"
          aria-label="Wishlist"
        >
          <Heart
            className={`size-3 stroke-[1.2] ${wished ? "fill-foreground text-foreground" : "text-foreground/70"}`}
          />
        </button>
        {product.onSale && (
          <span className="absolute top-2 left-2 text-[0.625rem] font-medium tracking-[0.2em] uppercase text-foreground bg-white px-2 py-1">
            Sale
          </span>
        )}
      </div>
      <div className="space-y-1 text-foreground">
        <p className="text-[0.8125rem] md:text-sm font-medium tracking-[0.06em] uppercase leading-snug">
          {product.name}
        </p>
        <p className="text-[0.6875rem] md:text-xs tracking-[0.12em] uppercase text-foreground/55 leading-relaxed line-clamp-2">
          {mini}
        </p>
        <p className="text-sm tracking-wide pt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span>{format(product)}</span>
          {product.onSale && product.compareAtEUR != null && (
            <span className="text-xs text-foreground/40 line-through">€{product.priceEUR}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
