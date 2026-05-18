import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — Bingin Diaries" }] }),
  component: Account,
});

function Account() {
  const [tab, setTab] = useState<"login" | "wishlist" | "orders">("login");
  const { wishlist } = useCart();
  const wished = products.filter((p) => wishlist.includes(p.slug));

  return (
    <section className="px-6 md:px-14 py-20 max-w-6xl">
      <p className="text-eyebrow text-muted-foreground">Your account</p>
      <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[0.95]">Bonjour.</h1>

      <div className="flex gap-8 mt-12 border-b border-border">
        {(["login", "wishlist", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-4 text-eyebrow ${tab === t ? "text-ink border-b border-ink -mb-px" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-12">
        {tab === "login" && (
          <div className="grid md:grid-cols-2 gap-12 max-w-3xl">
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <h2 className="font-display text-2xl">Sign in</h2>
              <input type="email" placeholder="Email" className="w-full bg-transparent border-b border-border py-3 outline-none focus:border-ink" />
              <input type="password" placeholder="Password" className="w-full bg-transparent border-b border-border py-3 outline-none focus:border-ink" />
              <button className="bg-ink text-bone px-8 py-3.5 text-eyebrow w-full">Sign in</button>
              <a href="#" className="text-eyebrow text-muted-foreground link-underline block">Forgot password?</a>
            </form>
            <div className="border-l border-border pl-12">
              <h2 className="font-display text-2xl">New here?</h2>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Create an account to track orders, save your favourites, and receive private invitations.
              </p>
              <button className="mt-6 border border-ink text-ink px-8 py-3.5 text-eyebrow hover:bg-ink hover:text-bone transition">
                Create account
              </button>
            </div>
          </div>
        )}

        {tab === "wishlist" && (
          wished.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
              {wished.map((p, i) => <ProductCard key={p.slug} product={p} index={i} />)}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="font-display text-3xl">Your wishlist is empty</p>
              <Link to="/collection" className="mt-6 inline-block text-eyebrow link-underline">Begin browsing</Link>
            </div>
          )
        )}

        {tab === "orders" && (
          <div className="text-center py-20">
            <p className="font-display text-3xl">No orders yet</p>
            <p className="text-muted-foreground mt-3">When you place an order, it will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
