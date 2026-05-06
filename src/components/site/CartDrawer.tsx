import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { X, Minus } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CartDrawer() {
  const { open, setOpen, resolved, remove } = useCart();
  const { format, country } = useCurrency();

  const total = resolved.reduce((s, { product, qty }) => {
    const v = country.currency === "EUR" ? product.priceEUR : country.currency === "USD" ? product.priceUSD : product.priceIDR;
    return s + v * qty;
  }, 0);
  const symbol = country.currency === "EUR" ? "€" : country.currency === "USD" ? "$" : "Rp ";

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
      <aside className="w-full max-w-md bg-background flex flex-col h-full shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-display text-2xl">Your cart</h3>
          <button onClick={() => setOpen(false)} aria-label="Close"><X className="size-5" /></button>
        </div>

        {resolved.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
            <p className="font-display text-2xl">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Begin somewhere quiet.</p>
            <Link
              to="/collection"
              onClick={() => setOpen(false)}
              className="mt-3 inline-block bg-ink text-bone px-8 py-3 text-eyebrow"
            >
              Continue shopping
            </Link>
          </div>
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
                <span>{symbol}{total.toLocaleString("en-US")}</span>
              </div>
              <p className="text-eyebrow text-muted-foreground">Shipping calculated at checkout</p>
              <button className="w-full bg-ink text-bone py-4 text-eyebrow hover:bg-clay transition-colors">
                Checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
