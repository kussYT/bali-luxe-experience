import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { Minus, Plus, X } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Bingin Diaries" }] }),
  component: CartPage,
});

function CartPage() {
  const { resolved, remove, add } = useCart();
  const { format, country } = useCurrency();

  const total = resolved.reduce((s, { product, qty }) => {
    const v = country.currency === "EUR" ? product.priceEUR : country.currency === "USD" ? product.priceUSD : product.priceIDR;
    return s + v * qty;
  }, 0);
  const symbol = country.currency === "EUR" ? "€" : country.currency === "USD" ? "$" : "Rp ";

  return (
    <section className="px-6 md:px-14 py-20 max-w-6xl">
      <p className="text-eyebrow text-muted-foreground">Your bag — {resolved.length} pieces</p>
      <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[0.95]">Cart</h1>

      {resolved.length === 0 ? (
        <div className="text-center py-32">
          <p className="font-display text-3xl">Your cart is empty</p>
          <Link to="/collection" className="mt-8 inline-block bg-ink text-bone px-10 py-4 text-eyebrow">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_360px] gap-16 mt-16">
          <ul className="divide-y divide-border">
            {resolved.map(({ product, qty }) => (
              <li key={product.slug} className="flex gap-6 py-8">
                <img src={product.image} alt={product.name} className="size-32 md:size-40 object-cover bg-sand" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-display text-2xl">{product.name}</p>
                      <p className="text-eyebrow text-muted-foreground mt-1">{product.collection} — {product.origin}</p>
                    </div>
                    <button onClick={() => remove(product.slug)} aria-label="Remove"><X className="size-4" /></button>
                  </div>
                  <div className="flex items-center justify-between mt-8">
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() => {
                          if (qty <= 1) return;
                          remove(product.slug);
                          for (let i = 0; i < qty - 1; i++) add(product.slug);
                        }}
                        className="size-10 flex items-center justify-center"
                      ><Minus className="size-3" /></button>
                      <span className="w-10 text-center font-mono text-sm">{qty}</span>
                      <button onClick={() => add(product.slug)} className="size-10 flex items-center justify-center"><Plus className="size-3" /></button>
                    </div>
                    <p className="font-mono">{format(product)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="bg-sand p-8 h-fit space-y-6">
            <h3 className="font-display text-2xl">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{symbol}{total.toLocaleString("en-US")}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>Calculated at checkout</span></div>
            </div>
            <div className="border-t border-border pt-4 flex justify-between font-display text-xl">
              <span>Total</span><span>{symbol}{total.toLocaleString("en-US")}</span>
            </div>
            <button className="w-full bg-ink text-bone py-4 text-eyebrow hover:bg-clay transition-colors">Checkout</button>
          </aside>
        </div>
      )}
    </section>
  );
}
