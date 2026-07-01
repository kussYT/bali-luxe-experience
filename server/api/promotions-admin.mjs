import {
  listPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
} from "../db/promo-codes.mjs";
import { readCatalog } from "../catalog-store.mjs";
import { validateCartItems } from "../checkout.mjs";
import { shippingAmountForCountry } from "../shipping-rates.mjs";
import { computePromoAmounts } from "../promo-apply.mjs";
import { toStripeAmount } from "../pricing.mjs";

export async function getAdminPromotionsResponse() {
  const promos = await listPromoCodes();
  return { promos, source: "postgres" };
}

export async function postAdminPromotion(body) {
  const promo = await createPromoCode(body);
  return { promo, source: "postgres" };
}

export async function patchAdminPromotion(id, body) {
  const promo = await updatePromoCode(id, body);
  return { promo, source: "postgres" };
}

export async function removeAdminPromotion(id) {
  await deletePromoCode(id);
  return { ok: true };
}

export async function postValidatePromo(body) {
  const code = body.code?.trim();
  const currency = body.currency || "EUR";
  const countryCode = body.countryCode || "FR";
  const items = body.items || [];

  const promo = await validatePromoCode(code);
  const catalog = await readCatalog();
  const resolved = items.length ? validateCartItems(catalog, items, countryCode) : [];

  const shippingDisplay = await shippingAmountForCountry(countryCode, currency);
  const shippingSmallest = toStripeAmount(shippingDisplay, currency);

  const amounts =
    resolved.length > 0
      ? computePromoAmounts({ promo, resolved, currency, shippingSmallest })
      : {
          subtotalSmallest: 0,
          productDiscount: 0,
          shippingDiscount: promo.freeShipping ? shippingSmallest : 0,
          totalSmallest: 0,
          isFullyFree: promo.discountType === "free" && promo.freeShipping,
        };

  return {
    valid: true,
    promo: {
      code: promo.code,
      label: promo.label,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      freeShipping: promo.freeShipping,
      influencerName: promo.influencerName,
    },
    amounts,
  };
}
