import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type CustomerOrder = {
  id: string;
  status: string;
  currency: string;
  amountTotal: number | null;
  paidAt: string | null;
  createdAt: string;
};

type AccountCtx = {
  email: string | null;
  wishlist: string[];
  orders: CustomerOrder[];
  loading: boolean;
  refresh: () => Promise<void>;
  requestLink: (email: string) => Promise<{ devLink?: string }>;
  verify: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  syncWishlist: (slugs: string[]) => Promise<void>;
};

const AccountContext = createContext<AccountCtx | null>(null);

async function accountFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await accountFetch<{ customer: { email: string; wishlist: string[] }; orders: CustomerOrder[] }>(
        "/api/account/me",
      );
      setEmail(data.customer.email);
      setWishlist(data.customer.wishlist);
      setOrders(data.orders);
    } catch {
      setEmail(null);
      setWishlist([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestLink = async (addr: string) => {
    return accountFetch<{ devLink?: string }>("/api/account/request-link", {
      method: "POST",
      body: JSON.stringify({ email: addr }),
    });
  };

  const verify = async (token: string) => {
    await accountFetch("/api/account/verify?token=" + encodeURIComponent(token));
    await refresh();
  };

  const logout = async () => {
    await accountFetch("/api/account/logout", { method: "POST" });
    setEmail(null);
    setWishlist([]);
    setOrders([]);
  };

  const syncWishlist = async (slugs: string[]) => {
    if (!email) return;
    const data = await accountFetch<{ wishlist: string[] }>("/api/account/wishlist", {
      method: "POST",
      body: JSON.stringify({ slugs }),
    });
    setWishlist(data.wishlist);
  };

  return (
    <AccountContext.Provider
      value={{ email, wishlist, orders, loading, refresh, requestLink, verify, logout, syncWishlist }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
