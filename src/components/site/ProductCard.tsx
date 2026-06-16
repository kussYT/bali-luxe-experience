import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/catalog-types";
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
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="product-image-wrap relative mb-4 md:mb-5">
        <img src={product.image} alt={product.name} loading="lazy" className="image-editorial" />
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWish(product.slug);
          }}
          className="absolute top-3 right-3 size-8 flex items-center justify-center bg-surface/90 backdrop-blur-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-500"
          aria-label="Wishlist"
        >
          <Heart
            className={`size-3 stroke-[1.2] ${wished ? "fill-accent text-accent" : "text-foreground/80"}`}
          />
        </button>
        {product.onSale && (
          <span className="absolute top-3 left-3 text-eyebrow !text-surface bg-accent px-2.5 py-1 rounded-sm">
            Sale
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[0.8125rem] md:text-sm leading-snug text-foreground group-hover:text-accent transition-colors duration-500">
          {product.name}
        </p>
        <p className="text-sm text-foreground/90 tracking-wide">{format(product)}</p>
      </div>
    </Link>
  );
}
