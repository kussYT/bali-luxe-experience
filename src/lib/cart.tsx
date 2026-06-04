import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product } from "@/lib/catalog-types";
import { useCatalog } from "@/lib/catalog-context";

export type CartItem = { slug: string; qty: number };

const CART_STORAGE_KEY = "bingin-cart";

type Ctx = {
  items: CartItem[];
  wishlist: string[];
  add: (slug: string, qty?: number) => void;
  remove: (slug: string) => void;
  updateQty: (slug: string, qty: number) => void;
  toggleWish: (slug: string) => void;
  clear: () => void;
  count: number;
  open: boolean;
  setOpen: (b: boolean) => void;
  resolved: { product: Product; qty: number }[];
};

const CartContext = createContext<Ctx | null>(null);

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed.filter((i) => i.slug && i.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalog();
  const [items, setItems] = useState<CartItem[]>(readStoredCart);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (slug: string, qty = 1) => {
    const product = products.find((p) => p.slug === slug);
    const max = product?.stock ?? qty;
    setItems((prev) => {
      const ex = prev.find((i) => i.slug === slug);
      if (ex) {
        const nextQty = Math.min(ex.qty + qty, max);
        return prev.map((i) => (i.slug === slug ? { ...i, qty: nextQty } : i));
      }
      return [...prev, { slug, qty: Math.min(qty, max) }];
    });
    setOpen(true);
  };

  const remove = (slug: string) => setItems((prev) => prev.filter((i) => i.slug !== slug));

  const updateQty = (slug: string, qty: number) => {
    const product = products.find((p) => p.slug === slug);
    const max = product?.stock ?? qty;
    if (qty < 1) {
      remove(slug);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.slug === slug ? { ...i, qty: Math.min(qty, max) } : i)),
    );
  };

  const clear = () => setItems([]);

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
      value={{
        items,
        wishlist,
        add,
        remove,
        updateQty,
        toggleWish,
        clear,
        count,
        open,
        setOpen,
        resolved,
      }}
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
