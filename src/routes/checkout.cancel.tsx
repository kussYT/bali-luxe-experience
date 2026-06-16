import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout/cancel")({
  head: () => ({
    meta: [{ title: "Checkout cancelled — Bingin Diaries" }],
  }),
  component: CheckoutCancelPage,
});

function CheckoutCancelPage() {
  return (
    <section className="page-wrap section-pad py-24 md:py-32 max-w-2xl mx-auto text-center">
      <p className="text-eyebrow">Checkout</p>
      <h1 className="font-display text-5xl md:text-6xl mt-4 leading-[0.95]">Payment cancelled</h1>
      <p className="text-caption mt-6 max-w-md mx-auto">
        Your bag is still here — you can return anytime to complete your order.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/cart" className="btn-primary">
          Return to bag
        </Link>
        <Link to="/collection" className="btn-outline">
          Continue shopping
        </Link>
      </div>
    </section>
  );
}
