import { toStripeAmount } from "./pricing.mjs";
import { unitPrice } from "./pricing.mjs";

/** Discount amounts in Stripe smallest currency unit. */
export function computePromoAmounts({ promo, resolved, currency, shippingSmallest }) {
  const subtotalSmallest = resolved.reduce((sum, { product, variant, qty }) => {
    return sum + toStripeAmount(unitPrice(product, currency), currency) * qty;
  }, 0);

  let productDiscount = 0;
  let shippingDiscount = 0;

  if (promo.discountType === "free") {
    productDiscount = subtotalSmallest;
  } else if (promo.discountType === "percent") {
    const pct = Math.min(100, Math.max(0, promo.discountValue));
    productDiscount = Math.round((subtotalSmallest * pct) / 100);
  } else if (promo.discountType === "fixed") {
    const fixed = toStripeAmount(promo.discountValue, currency);
    productDiscount = Math.min(subtotalSmallest, fixed);
  }

  if (promo.freeShipping) {
    shippingDiscount = shippingSmallest;
  }

  const totalSmallest = Math.max(0, subtotalSmallest - productDiscount + shippingSmallest - shippingDiscount);

  return {
    subtotalSmallest,
    productDiscount,
    shippingDiscount,
    totalSmallest,
    isFullyFree: totalSmallest === 0,
  };
}

/** Apply product discount proportionally to line unit prices (display units). */
export function discountedUnitPrice(originalUnit, currency, productDiscount, subtotalSmallest, lineSmallest) {
  if (productDiscount <= 0 || subtotalSmallest <= 0) return originalUnit;
  const lineShare = lineSmallest / subtotalSmallest;
  const lineDiscountSmallest = Math.round(productDiscount * lineShare);
  const lineDiscountDisplay = lineDiscountSmallest / (currency === "IDR" ? 1 : 100);
  return Math.max(0, Math.round((originalUnit - lineDiscountDisplay) * 100) / 100);
}
