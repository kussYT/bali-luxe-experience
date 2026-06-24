import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Product } from "@/lib/catalog-types";
import { useCatalog } from "@/lib/catalog-context";
import { useCurrency } from "@/lib/currency";
import { useAccount } from "@/lib/account-context";
import { maxCartQty } from "@/lib/warehouse-allocation";
import {
  type CartItem,
  type ResolvedCartLine,
  cartLineKey,
  normalizeCartItem,
  resolveCartLine,
} from "@/lib/cart-lines";

const CART_STORAGE_KEY = "bingin-cart";
const WISHLIST_STORAGE_KEY = "bingin-wishlist";

type Ctx = {
  items: CartItem[];
  wishlist: string[];
  add: (slug: string, qty?: number, variantId?: string) => void;
  remove: (slug: string, variantId?: string) => void;
  updateQty: (slug: string, qty: number, variantId?: string) => void;
  toggleWish: (slug: string) => void;
  clear: () => void;
  count: number;
  open: boolean;
  setOpen: (b: boolean) => void;
  resolved: ResolvedCartLine[];
};

const CartContext = createContext<Ctx | null>(null);

function readStoredWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string" && s.length > 0) : [];
  } catch {
    return [];
  }
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed)
      ? parsed.filter((i) => i.slug && i.qty > 0).map((i) => ({ ...i, qty: Math.max(1, i.qty) }))
      : [];
  } catch {
    return [];
  }
}

function sameLine(a: CartItem, slug: string, variantId?: string) {
  return a.slug === slug && (a.variantId || undefined) === (variantId || undefined);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalog();
  const { shipping } = useCurrency();
  const { email, wishlist: accountWishlist, loading: accountLoading, syncWishlist } = useAccount();
  const [items, setItems] = useState<CartItem[]>(readStoredCart);
  const [wishlist, setWishlist] = useState<string[]>(readStoredWishlist);
  const [open, setOpen] = useState(false);
  const mergedForEmail = useRef<string | null>(null);

  useEffect(() => {
    if (accountLoading || !email) {
      mergedForEmail.current = null;
      return;
    }
    if (mergedForEmail.current === email) return;
    mergedForEmail.current = email;

    setWishlist((local) => {
      const merged = [...new Set([...accountWishlist, ...local])];
      const needsSync =
        merged.length !== accountWishlist.length || merged.some((slug) => !accountWishlist.includes(slug));
      if (needsSync) {
        void syncWishlist(merged).catch(() => {});
      }
      return merged;
    });
  }, [email, accountLoading, accountWishlist, syncWishlist]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const add = (slug: string, qty = 1, variantId?: string) => {
    const product = products.find((p) => p.slug === slug);
    const line = normalizeCartItem({ slug, qty, variantId }, product);
    const max = product ? maxCartQty(product, shipping.code, line.variantId) : qty;
    if (max < 1) {
      setOpen(true);
      return;
    }
    setItems((prev) => {
      const ex = prev.find((i) => sameLine(i, line.slug, line.variantId));
      if (ex) {
        const nextQty = Math.max(1, Math.min(ex.qty + line.qty, max));
        return prev.map((i) =>
          sameLine(i, line.slug, line.variantId) ? { ...i, qty: nextQty } : i,
        );
      }
      return [...prev, { ...line, qty: Math.max(1, Math.min(line.qty, max)) }];
    });
    setOpen(true);
  };

  const remove = (slug: string, variantId?: string) =>
    setItems((prev) => prev.filter((i) => !sameLine(i, slug, variantId)));

  const updateQty = (slug: string, qty: number, variantId?: string) => {
    const product = products.find((p) => p.slug === slug);
    const max = product ? maxCartQty(product, shipping.code, variantId) : qty;
    if (qty < 1) {
      remove(slug, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        sameLine(i, slug, variantId) ? { ...i, qty: Math.min(qty, max) } : i,
      ),
    );
  };

  const clear = () => setItems([]);

  const toggleWish = (slug: string) => {
    setWishlist((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      if (email) {
        void syncWishlist(next).catch(() => {});
      }
      return next;
    });
  };

  const resolved = items
    .map((i) => {
      const product = products.find((p) => p.slug === i.slug);
      return product ? resolveCartLine(product, i) : null;
    })
    .filter(Boolean) as ResolvedCartLine[];

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

export type { CartItem };
export { cartLineKey };
