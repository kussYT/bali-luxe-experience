import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart, cartLineKey } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { getUnitPrice, formatMoney } from "@/lib/pricing";
import { maxCartQty } from "@/lib/warehouse-allocation";
import { CheckoutButton } from "@/components/site/CheckoutButton";
import { Minus, Plus, X } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Bingin Diaries" }] }),
  component: CartPage,
});

function CartPage() {
  const { resolved, remove, updateQty } = useCart();
  const { country, shipping } = useCurrency();
  const currency = country.currency;

  const total = resolved.reduce(
    (s, { product, qty }) => s + getUnitPrice(product, currency) * qty,
    0,
  );

  return (
    <section className="page-wrap section-pad py-20 max-w-6xl">
      <p className="text-eyebrow text-muted-foreground">Your bag — {resolved.length} pieces</p>
      <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[0.95]">Cart</h1>

      {resolved.length === 0 ? (
        <div className="text-center py-32">
          <p className="font-display text-3xl">Your cart is empty</p>
          <Link to="/collection" className="mt-8 inline-block btn-primary">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_minmax(280px,360px)] gap-8 lg:gap-16 mt-10 md:mt-16">
          <ul className="divide-y divide-border">
            {resolved.map(({ product, variant, qty }) => {
              const max = maxCartQty(product, shipping.code, variant?.id);
              const lineKey = cartLineKey({ slug: product.slug, variantId: variant?.id });

              return (
                <li key={lineKey} className="flex flex-col sm:flex-row gap-4 sm:gap-6 py-6 sm:py-8">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="size-24 sm:size-32 md:size-40 object-cover bg-secondary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-xl sm:text-2xl truncate">{product.name}</p>
                        <p className="text-eyebrow text-muted-foreground mt-1">
                          {product.collection}
                          {variant && variant.title !== "Default" ? ` · ${variant.title}` : ""}
                          {" — "}
                          {product.origin}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(product.slug, variant?.id)}
                        aria-label="Remove"
                        className="shrink-0"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-6 sm:mt-8">
                      <div className="flex items-center border border-border rounded-sm">
                        <button
                          type="button"
                          onClick={() => updateQty(product.slug, qty - 1, variant?.id)}
                          className="size-10 flex items-center justify-center hover:bg-secondary transition-colors"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-10 text-center text-sm">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(product.slug, qty + 1, variant?.id)}
                          disabled={qty >= max}
                          className="size-10 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <p className="text-sm">{formatMoney(getUnitPrice(product, currency) * qty, currency)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="bg-secondary p-8 h-fit space-y-6 border border-border">
            <h3 className="font-display text-2xl">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(total, currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>At checkout</span>
              </div>
            </div>
            <div className="border-t border-border pt-4 flex justify-between font-display text-xl">
              <span>Subtotal</span>
              <span>{formatMoney(total, currency)}</span>
            </div>
            <CheckoutButton className="w-full bg-foreground text-surface py-4 text-eyebrow hover:opacity-90 transition-opacity" />
            <p className="text-caption text-center">Secure payment by Stripe</p>
          </aside>
        </div>
      )}
    </section>
  );
}
