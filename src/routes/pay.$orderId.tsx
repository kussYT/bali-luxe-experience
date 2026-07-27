import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/** Short payment link used in emails — less fragile than long query-string URLs. */
export const Route = createFileRoute("/pay/$orderId")({
  head: () => ({
    meta: [{ title: "Complete your purchase — Bingin Diaries" }],
  }),
  component: PayOrderPage,
});

function PayOrderPage() {
  const { orderId } = Route.useParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId?.trim()) {
      setError("Invalid payment link — no order found.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/checkout/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: orderId.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Unable to resume payment");
          return;
        }
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        if (!cancelled) setError("Invalid checkout response");
      } catch {
        if (!cancelled) setError("Network error — please try again in a moment");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <section className="page-wrap section-pad py-24 md:py-32 max-w-2xl mx-auto text-center">
      <p className="text-eyebrow">Checkout</p>
      {error ? (
        <>
          <h1 className="font-display text-4xl md:text-5xl mt-4 leading-[0.95]">
            Link expired or invalid
          </h1>
          <p className="text-caption mt-6 max-w-md mx-auto">{error}</p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cart" className="btn-primary">
              View bag
            </Link>
            <Link to="/collection" className="btn-outline">
              Continue shopping
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="font-display text-4xl md:text-5xl mt-4 leading-[0.95]">
            Redirecting to payment…
          </h1>
          <p className="text-caption mt-6">One moment — preparing your secure Stripe checkout.</p>
        </>
      )}
    </section>
  );
}
