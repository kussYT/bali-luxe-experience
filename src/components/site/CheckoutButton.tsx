import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { startCheckout } from "@/lib/checkout";
import { readStoredPromo, validatePromo } from "@/lib/promo";
import {
  isMondialRelayCountry,
  type MondialRelayPickup,
  type ShippingMethod,
} from "@/lib/mondial-relay";
import { MondialRelayPicker } from "@/components/site/MondialRelayPicker";
import { useLocale } from "@/lib/i18n/locale-context";

type CheckoutButtonProps = {
  className?: string;
  onStarted?: () => void;
};

type ShippingOptionsResponse = {
  methods: ShippingMethod[];
  mondialRelay: { enabled: boolean; brandId: string | null };
};

export function CheckoutButton({ className = "btn-primary w-full", onStarted }: CheckoutButtonProps) {
  const { items, resolved } = useCart();
  const { shipping } = useCurrency();
  const { locale } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<ShippingMethod>("home");
  const [pickup, setPickup] = useState<MondialRelayPickup | null>(null);
  const [mrBrandId, setMrBrandId] = useState<string | null>(null);
  const [mrEnabled, setMrEnabled] = useState(false);

  const countryAllowsMr = isMondialRelayCountry(shipping.code);

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

  useEffect(() => {
    setPickup(null);
    setMethod("home");
    if (!countryAllowsMr) {
      setMrEnabled(false);
      setMrBrandId(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/shipping/options?country=${encodeURIComponent(shipping.code)}`)
      .then((r) => r.json())
      .then((data: ShippingOptionsResponse) => {
        if (cancelled) return;
        setMrEnabled(Boolean(data.mondialRelay?.enabled));
        setMrBrandId(data.mondialRelay?.brandId || null);
      })
      .catch(() => {
        if (!cancelled) {
          setMrEnabled(false);
          setMrBrandId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shipping.code, countryAllowsMr]);

  async function handleCheckout() {
    if (items.length === 0 || resolved.length === 0) {
      setError("Your bag is empty.");
      return;
    }
    if (needsEmail && !email.trim()) {
      setError("Email requis pour une commande cadeau.");
      return;
    }
    if (method === "mondial_relay" && !pickup?.id) {
      setError("Sélectionnez un Point Relais Mondial Relay.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await startCheckout(items, shipping.currency, shipping.code, {
      promoCode: readStoredPromo() || undefined,
      customerEmail: needsEmail ? email.trim() : undefined,
      shippingMethod: method,
      pickupPoint: method === "mondial_relay" ? pickup || undefined : undefined,
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
    <div className="space-y-4">
      {mrEnabled && mrBrandId && (
        <div className="space-y-3">
          <p className="text-[0.625rem] tracking-[0.18em] uppercase text-muted-foreground">
            Livraison
          </p>
          <div className="grid gap-2">
            <label className="flex items-start gap-3 border border-border bg-background px-3 py-2.5 cursor-pointer">
              <input
                type="radio"
                name="shipping-method"
                className="mt-1"
                checked={method === "home"}
                onChange={() => {
                  setMethod("home");
                  setPickup(null);
                }}
              />
              <span className="text-sm">
                <span className="font-medium">À domicile</span>
                <span className="block text-caption text-muted-foreground">
                  Adresse complète sur la page de paiement Stripe
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 border border-border bg-background px-3 py-2.5 cursor-pointer">
              <input
                type="radio"
                name="shipping-method"
                className="mt-1"
                checked={method === "mondial_relay"}
                onChange={() => setMethod("mondial_relay")}
              />
              <span className="text-sm">
                <span className="font-medium">Point Relais Mondial Relay</span>
                <span className="block text-caption text-muted-foreground">
                  Retrait en locker / magasin partenaire
                </span>
              </span>
            </label>
          </div>

          {method === "mondial_relay" && (
            <div className="space-y-3">
              {pickup && (
                <div className="border border-border bg-secondary/40 px-3 py-2 text-sm">
                  <p className="font-medium">{pickup.name}</p>
                  <p className="text-muted-foreground">
                    {[pickup.line1, pickup.line2, `${pickup.postalCode} ${pickup.city}`, pickup.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-caption mt-1">ID Point Relais : {pickup.id}</p>
                </div>
              )}
              <MondialRelayPicker
                brandId={mrBrandId}
                countryCode={shipping.code}
                language={locale}
                onSelect={setPickup}
              />
            </div>
          )}
        </div>
      )}

      {needsEmail && (
        <div className="space-y-1">
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
      {error && <p className="text-caption text-red-600/90 mt-1">{error}</p>}
    </div>
  );
}
