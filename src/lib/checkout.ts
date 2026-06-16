import type { CartItem } from "@/lib/cart";
import type { Currency } from "@/lib/currency";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function startCheckout(
  items: CartItem[],
  currency: Currency,
  countryCode: string,
): Promise<CheckoutResult> {
  try {
    const res = await fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, currency, countryCode }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      return { ok: false, error: data.error || "Unable to start checkout. Please try again." };
    }
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, error: "Network error. Check your connection and try again." };
  }
}

export type CheckoutStatus = {
  status: string;
  customerEmail?: string | null;
  order?: {
    id: string;
    status: string;
    countryCode?: string | null;
    shippingCountryCode?: string | null;
    fulfillmentWarehouse?: string | null;
    items: {
      name: string;
      qty: number;
      warehouseId?: string;
      slug?: string;
    }[];
  };
};

export async function fetchCheckoutStatus(sessionId: string): Promise<CheckoutStatus | null> {
  try {
    const res = await fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`);
    if (!res.ok) return null;
    return (await res.json()) as CheckoutStatus;
  } catch {
    return null;
  }
}
