import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import {
  readStoredPromo,
  writeStoredPromo,
  validatePromo,
  type PromoPreview,
} from "@/lib/promo";

export function PromoCodeField() {
  const { items } = useCart();
  const { shipping } = useCurrency();
  const [code, setCode] = useState(readStoredPromo);
  const [preview, setPreview] = useState<PromoPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const stored = readStoredPromo();
    if (stored && items.length > 0) {
      void applyCode(stored, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyCode(nextCode: string, save = true) {
    const trimmed = nextCode.trim();
    if (!trimmed) {
      setPreview(null);
      setError(null);
      writeStoredPromo("");
      return;
    }
    if (items.length === 0) {
      setError("Ajoutez un article au panier d'abord.");
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const result = await validatePromo(trimmed, items, shipping.currency, shipping.code);
      setPreview(result);
      if (save) writeStoredPromo(trimmed);
    } catch (e) {
      setPreview(null);
      writeStoredPromo("");
      setError(e instanceof Error ? e.message : "Code invalide");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-[0.625rem] tracking-[0.18em] uppercase text-muted-foreground">
        Code promo
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ex. INFLUENCE2026"
          className="flex-1 border border-border bg-background px-3 py-2 text-sm uppercase"
        />
        <button
          type="button"
          onClick={() => applyCode(code)}
          disabled={checking || !code.trim()}
          className="px-3 py-2 text-[0.625rem] tracking-[0.15em] uppercase border border-border hover:border-foreground/40 transition-colors disabled:opacity-50"
        >
          {checking ? "…" : "OK"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600/90">{error}</p>}
      {preview?.promo && (
        <p className="text-xs text-muted-foreground">
          {preview.promo.label || preview.promo.code}
          {preview.promo.influencerName ? ` · ${preview.promo.influencerName}` : ""}
          {preview.amounts?.isFullyFree ? " — commande offerte" : ""}
        </p>
      )}
    </div>
  );
}

export function readAppliedPromo() {
  return readStoredPromo();
}
