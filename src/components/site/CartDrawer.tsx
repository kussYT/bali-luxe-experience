import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { products } from "@/lib/products";
import { X, Minus } from "lucide-react";
import { Link } from "@tanstack/react-router";

const SUGGESTED = products.slice(0, 3);

export function CartDrawer() {
  const { open, setOpen, resolved, remove } = useCart();
  const { format, country } = useCurrency();

  const total = resolved.reduce((s, { product, qty }) => {
    const v =
      country.currency === "EUR"
        ? product.priceEUR
        : country.currency === "USD"
          ? product.priceUSD
          : product.priceIDR;
    return s + v * qty;
  }, 0);
  const symbol = country.currency === "EUR" ? "€" : country.currency === "USD" ? "$" : "Rp ";

  if (!open) return null;

  const close = () => setOpen(false);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={close} />
      <aside className="w-full max-w-md bg-background flex flex-col h-full shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-display text-2xl">Bag</h3>
          <button onClick={close} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        {resolved.length === 0 ? (
          <>
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
              <p className="font-display text-2xl">Your bag is empty</p>
              <Link to="/collection" onClick={close} className="mt-2 inline-block bg-ink text-bone px-8 py-3 text-eyebrow">
                Continue shopping
              </Link>
            </div>

            <div className="border-t border-border p-6 space-y-5">
              <div className="flex items-end justify-between">
                <p className="text-eyebrow text-muted-foreground">Products</p>
                <Link to="/collection" onClick={close} className="text-eyebrow link-underline">
                  See more
                </Link>
              </div>
              <ul className="space-y-4">
                {SUGGESTED.map(({ slug, name, image, collection }) => (
                  <li key={slug}>
                    <Link to="/product/$slug" params={{ slug }} onClick={close} className="flex gap-3 group">
                      <img src={image} alt={name} className="size-20 object-cover bg-sand" />
                      <div>
                        <p className="font-display text-lg leading-tight group-hover:text-clay transition-colors">{name}</p>
                        <p className="text-eyebrow text-muted-foreground mt-1">{collection}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/collection"
                onClick={close}
                className="block w-full text-center border border-border py-3.5 text-eyebrow hover:bg-muted transition-colors"
              >
                Continue shopping
              </Link>
            </div>
          </>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-border">
              {resolved.map(({ product, qty }) => (
                <li key={product.slug} className="flex gap-4 p-6">
                  <img src={product.image} alt={product.name} className="size-24 object-cover bg-sand" />
                  <div className="flex-1">
                    <p className="font-display text-lg leading-tight">{product.name}</p>
                    <p className="text-eyebrow text-muted-foreground mt-1">{product.collection}</p>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <span className="font-mono">Qty {qty}</span>
                      <span>{format(product)}</span>
                    </div>
                  </div>
                  <button onClick={() => remove(product.slug)} aria-label="Remove">
                    <Minus className="size-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="p-6 border-t border-border space-y-4">
              <div className="flex justify-between font-display text-xl">
                <span>Total</span>
                <span>
                  {symbol}
                  {total.toLocaleString("en-US")}
                </span>
              </div>
              <p className="text-eyebrow text-muted-foreground">Shipping calculated at checkout</p>
              <button className="w-full bg-ink text-bone py-4 text-eyebrow hover:bg-clay transition-colors">
                Checkout
              </button>
              <Link to="/collection" onClick={close} className="block text-center text-eyebrow link-underline">
                Continue shopping
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
