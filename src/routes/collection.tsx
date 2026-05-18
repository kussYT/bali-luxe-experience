import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { products, collections } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: "The Collection — Bingin Diaries" },
      { name: "description", content: "Browse all hats — Sunburn, Juicy Record and Endless Summer." },
    ],
  }),
  component: Collection,
});

function Collection() {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? products : products.filter((p) => p.collection.toLowerCase().replace(" ", "-") === filter);

  return (
    <>
      <section className="px-6 md:px-14 pt-20 pb-12 border-b border-border">
        <p className="text-eyebrow text-muted-foreground">All hats — {filtered.length} pieces</p>
        <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[1]">The Collection</h1>
        <p className="mt-6 max-w-xl text-muted-foreground">
          Hand-woven, slow-finished, and shipped from our two ateliers in Canggu and Paris.
        </p>
      </section>

      <div className="px-6 md:px-14 py-6 flex items-center gap-6 text-eyebrow border-b border-border overflow-x-auto">
        <button onClick={() => setFilter("all")} className={`whitespace-nowrap ${filter === "all" ? "text-ink" : "text-muted-foreground"} link-underline`}>
          All
        </button>
        {collections.map((c) => {
          const key = c.name.toLowerCase().replace(" ", "-");
          return (
            <button
              key={c.slug}
              onClick={() => setFilter(key)}
              className={`whitespace-nowrap ${filter === key ? "text-ink" : "text-muted-foreground"} link-underline`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      <section className="px-6 md:px-14 py-14 grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-10">
        {filtered.map((p, i) => (
          <ProductCard key={p.slug} product={p} index={i} />
        ))}
      </section>
    </>
  );
}
