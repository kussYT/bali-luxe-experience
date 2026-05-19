import { createContext, useContext, useState, type ReactNode } from "react";
import type { Product } from "@/lib/catalog-types";
import { useCatalog } from "@/lib/catalog-context";

export type CartItem = { slug: string; qty: number };

type Ctx = {
  items: CartItem[];
  wishlist: string[];
  add: (slug: string) => void;
  remove: (slug: string) => void;
  toggleWish: (slug: string) => void;
  count: number;
  open: boolean;
  setOpen: (b: boolean) => void;
  resolved: { product: Product; qty: number }[];
};

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalog();
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const add = (slug: string) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.slug === slug);
      if (ex) return prev.map((i) => (i.slug === slug ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { slug, qty: 1 }];
    });
    setOpen(true);
  };
  const remove = (slug: string) => setItems((prev) => prev.filter((i) => i.slug !== slug));
  const toggleWish = (slug: string) =>
    setWishlist((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const resolved = items
    .map((i) => {
      const product = products.find((p) => p.slug === i.slug);
      return product ? { product, qty: i.qty } : null;
    })
    .filter(Boolean) as { product: Product; qty: number }[];

  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, wishlist, add, remove, toggleWish, count, open, setOpen, resolved }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
