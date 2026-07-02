import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchCheckoutStatus } from "@/lib/checkout";
import { useCart } from "@/lib/cart";

type SuccessSearch = {
  session_id?: string;
  order_id?: string;
  free?: string;
};

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search: Record<string, unknown>): SuccessSearch => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
    order_id: typeof search.order_id === "string" ? search.order_id : undefined,
    free: typeof search.free === "string" ? search.free : undefined,
  }),
  head: () => ({
    meta: [{ title: "Order confirmed — Bingin Diaries" }],
  }),
  component: CheckoutSuccessPage,
});

function CheckoutSuccessPage() {
  const { session_id: sessionId, order_id: orderId, free } = Route.useSearch();
  const isFreeGift = free === "1";
  const { clear } = useCart();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId && !orderId) {
      setLoading(false);
      return;
    }
    void fetchCheckoutStatus(sessionId, orderId).then((data) => {
      if (data?.status === "paid" || isFreeGift) clear();
      setEmail(data?.customerEmail ?? null);
      setLoading(false);
    });
  }, [sessionId, orderId, isFreeGift, clear]);

  return (
    <section className="page-wrap section-pad py-24 md:py-32 max-w-2xl mx-auto text-center">
      <p className="text-eyebrow">Order confirmed</p>
      <h1 className="font-display text-5xl md:text-6xl mt-4 leading-[0.95]">Thank you</h1>
      <p className="text-caption mt-6 max-w-md mx-auto">
        {loading ?
          isFreeGift ? "Confirming your order…" : "Confirming your payment…"
        : isFreeGift ?
          "Your gift order is confirmed. We are preparing your pieces with care."
        : "Your payment was received. We are preparing your pieces with care."}
      </p>
      {email && (
        <p className="text-sm mt-4 text-muted-foreground">
          Confirmation details will be sent to <span className="text-foreground">{email}</span>.
        </p>
      )}
      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/collection" className="btn-outline">
          Continue shopping
        </Link>
        <Link to="/" className="btn-primary">
          Back home
        </Link>
      </div>
    </section>
  );
}
