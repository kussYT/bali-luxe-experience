import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { startCheckout } from "@/lib/checkout";

type CheckoutButtonProps = {
  className?: string;
  onStarted?: () => void;
};

export function CheckoutButton({ className = "btn-primary w-full", onStarted }: CheckoutButtonProps) {
  const { items, resolved } = useCart();
  const { shipping } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (items.length === 0 || resolved.length === 0) {
      setError("Your bag is empty.");
      return;
    }

    setLoading(true);
    setError(null);
    onStarted?.();

    const result = await startCheckout(items, shipping.currency, shipping.code);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    window.location.href = result.url;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || resolved.length === 0}
        className={`${className} disabled:opacity-50`}
      >
        {loading ? "Redirecting to Stripe…" : "Checkout"}
      </button>
      {error && <p className="text-caption text-red-600/90 mt-3">{error}</p>}
    </div>
  );
}
