import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { startCheckout } from "@/lib/checkout";
import { readStoredPromo, validatePromo } from "@/lib/promo";

type CheckoutButtonProps = {
  className?: string;
  onStarted?: () => void;
};

export function CheckoutButton({ className = "btn-primary w-full", onStarted }: CheckoutButtonProps) {
  const { items, resolved } = useCart();
  const { shipping } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const promo = readStoredPromo();
    if (!promo || items.length === 0) {
      setNeedsEmail(false);
      return;
    }
    validatePromo(promo, items, shipping.currency, shipping.code)
      .then((r) => setNeedsEmail(Boolean(r.amounts?.isFullyFree)))
      .catch(() => setNeedsEmail(false));
  }, [items, shipping.currency, shipping.code]);

  async function handleCheckout() {
    if (items.length === 0 || resolved.length === 0) {
      setError("Your bag is empty.");
      return;
    }
    if (needsEmail && !email.trim()) {
      setError("Email requis pour une commande cadeau.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await startCheckout(items, shipping.currency, shipping.code, {
      promoCode: readStoredPromo() || undefined,
      customerEmail: needsEmail ? email.trim() : undefined,
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onStarted?.();
    window.location.href = result.url;
  }

  return (
    <div>
      {needsEmail && (
        <div className="mb-3 space-y-1">
          <label className="text-[0.625rem] tracking-[0.18em] uppercase text-muted-foreground">
            Email (commande cadeau)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-border bg-background px-3 py-2 text-sm"
            placeholder="vous@email.com"
          />
        </div>
      )}
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || resolved.length === 0}
        className={`${className} disabled:opacity-50`}
      >
        {loading ? "Redirecting…" : needsEmail ? "Valider la commande cadeau" : "Checkout"}
      </button>
      {error && <p className="text-caption text-red-600/90 mt-3">{error}</p>}
    </div>
  );
}
