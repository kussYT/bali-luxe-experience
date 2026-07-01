import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/checkout/resume")({
  validateSearch: (search: Record<string, unknown>) => ({
    order: typeof search.order === "string" ? search.order : undefined,
  }),
  head: () => ({
    meta: [{ title: "Reprendre le paiement — Bingin Diaries" }],
  }),
  component: CheckoutResumePage,
});

function CheckoutResumePage() {
  const { order } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!order) {
      setError("Lien invalide — aucune commande indiquée.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/checkout/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Impossible de reprendre le paiement");
          return;
        }
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        if (!cancelled) setError("Réponse checkout invalide");
      } catch {
        if (!cancelled) setError("Erreur réseau — réessayez dans un instant");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [order]);

  return (
    <section className="page-wrap section-pad py-24 md:py-32 max-w-2xl mx-auto text-center">
      <p className="text-eyebrow">Checkout</p>
      {error ? (
        <>
          <h1 className="font-display text-4xl md:text-5xl mt-4 leading-[0.95]">Lien expiré ou invalide</h1>
          <p className="text-caption mt-6 max-w-md mx-auto">{error}</p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cart" className="btn-primary">
              Voir mon panier
            </Link>
            <Link to="/collection" className="btn-outline">
              Continuer mes achats
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="font-display text-4xl md:text-5xl mt-4 leading-[0.95]">Redirection vers le paiement…</h1>
          <p className="text-caption mt-6">Un instant, nous préparons votre session sécurisée Stripe.</p>
        </>
      )}
    </section>
  );
}
