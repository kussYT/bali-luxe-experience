import { toStripeAmount, unitPrice } from "./pricing.mjs";
import { validatePromoEligibility } from "./promo-rules.mjs";

/** Discount amounts in Stripe smallest currency unit (eligible lines only). */
export function computePromoAmounts({ promo, resolved, currency, shippingSmallest }) {
  const { eligible, ineligible } = validatePromoEligibility(promo, resolved);

  const subtotalSmallest = resolved.reduce((sum, { product, variant, qty }) => {
    return sum + toStripeAmount(unitPrice(product, currency), currency) * qty;
  }, 0);

  const eligibleSubtotalSmallest = eligible.reduce((sum, { product, qty }) => {
    return sum + toStripeAmount(unitPrice(product, currency), currency) * qty;
  }, 0);

  let productDiscount = 0;
  let shippingDiscount = 0;

  if (promo.discountType === "free") {
    productDiscount = eligibleSubtotalSmallest;
  } else if (promo.discountType === "percent") {
    const pct = Math.min(100, Math.max(0, promo.discountValue));
    productDiscount = Math.round((eligibleSubtotalSmallest * pct) / 100);
  } else if (promo.discountType === "fixed") {
    const fixed = toStripeAmount(promo.discountValue, currency);
    productDiscount = Math.min(eligibleSubtotalSmallest, fixed);
  }

  if (promo.freeShipping && eligible.length > 0) {
    shippingDiscount = shippingSmallest;
  }

  const totalSmallest = Math.max(
    0,
    subtotalSmallest - productDiscount + shippingSmallest - shippingDiscount,
  );

  return {
    subtotalSmallest,
    eligibleSubtotalSmallest,
    productDiscount,
    shippingDiscount,
    totalSmallest,
    isFullyFree: totalSmallest === 0,
    eligibleCount: eligible.length,
    ineligibleCount: ineligible.length,
    eligible,
    ineligible,
  };
}

/** Per-line discounted unit price for Stripe (display units). */
export function lineUnitAfterPromo({ product, qty }, currency, amounts) {
  const unit = unitPrice(product, currency);
  const lineSmallest = toStripeAmount(unit, currency) * qty;
  const isEligible = amounts.eligible.some((l) => l.product.slug === product.slug);
  if (!isEligible || amounts.productDiscount <= 0 || amounts.eligibleSubtotalSmallest <= 0) {
    return unit;
  }
  const lineShare = lineSmallest / amounts.eligibleSubtotalSmallest;
  const lineDiscountSmallest = Math.round(amounts.productDiscount * lineShare);
  const lineDiscountDisplay = lineDiscountSmallest / (currency === "IDR" ? 1 : 100);
  const perUnitDiscount = lineDiscountDisplay / qty;
  return Math.max(0, Math.round((unit - perUnitDiscount) * 100) / 100);
}
