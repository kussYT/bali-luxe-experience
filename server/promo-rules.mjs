import { unitPriceEur } from "./pricing.mjs";

export const DEFAULT_PROMO_RULES = {
  scope: "all",
  collectionSlugs: [],
  productSlugs: [],
  minSubtotalEur: null,
  startsAt: null,
  countryCodes: [],
};

export function normalizePromoRules(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PROMO_RULES };
  const scope = ["all", "collections", "products"].includes(raw.scope) ? raw.scope : "all";
  return {
    scope,
    collectionSlugs: Array.isArray(raw.collectionSlugs)
      ? raw.collectionSlugs.map((s) => String(s).trim()).filter(Boolean)
      : [],
    productSlugs: Array.isArray(raw.productSlugs)
      ? raw.productSlugs.map((s) => String(s).trim()).filter(Boolean)
      : [],
    minSubtotalEur:
      raw.minSubtotalEur != null && raw.minSubtotalEur !== ""
        ? Number(raw.minSubtotalEur)
        : null,
    startsAt: raw.startsAt || null,
    countryCodes: Array.isArray(raw.countryCodes)
      ? [...new Set(raw.countryCodes.map((c) => String(c).trim().toUpperCase()).filter(Boolean))]
      : [],
  };
}

export function productCollectionSlugs(product) {
  if (Array.isArray(product.collectionSlugs) && product.collectionSlugs.length > 0) {
    return product.collectionSlugs;
  }
  if (product.collectionSlug) return [product.collectionSlug];
  return [];
}

export function isLineEligible(line, rules) {
  const r = normalizePromoRules(rules);
  if (r.scope === "all") return true;
  const { product } = line;
  if (r.scope === "products") {
    return r.productSlugs.includes(product.slug);
  }
  if (r.scope === "collections") {
    const slugs = productCollectionSlugs(product);
    return r.collectionSlugs.some((s) => slugs.includes(s));
  }
  return false;
}

export function splitResolvedByPromo(resolved, rules) {
  const eligible = [];
  const ineligible = [];
  for (const line of resolved) {
    if (isLineEligible(line, rules)) eligible.push(line);
    else ineligible.push(line);
  }
  return { eligible, ineligible };
}

export function eligibleSubtotalEur(eligible) {
  return eligible.reduce((sum, { product, qty }) => sum + unitPriceEur(product) * qty, 0);
}

export function validatePromoEligibility(promo, resolved, { countryCode } = {}) {
  const rules = normalizePromoRules(promo.rules);
  const { eligible, ineligible } = splitResolvedByPromo(resolved, rules);

  if (rules.countryCodes.length > 0) {
    const code = String(countryCode || "").trim().toUpperCase();
    if (!code || !rules.countryCodes.includes(code)) {
      const err = new Error("Ce code n'est pas valable pour votre pays de livraison");
      err.status = 400;
      throw err;
    }
  }

  if (rules.scope !== "all" && eligible.length === 0) {
    const err = new Error("Ce code ne s'applique pas aux articles de votre panier");
    err.status = 400;
    throw err;
  }

  if (rules.startsAt && new Date(rules.startsAt) > new Date()) {
    const err = new Error("Ce code promo n'est pas encore actif");
    err.status = 400;
    throw err;
  }

  if (rules.minSubtotalEur != null && rules.minSubtotalEur > 0) {
    const subEur = eligibleSubtotalEur(eligible);
    if (subEur < rules.minSubtotalEur) {
      const err = new Error(
        `Montant minimum ${rules.minSubtotalEur} € sur les articles éligibles (actuellement ${Math.round(subEur)} €)`,
      );
      err.status = 400;
      throw err;
    }
  }

  return { eligible, ineligible, rules };
}

export function promoScopeLabel(rules) {
  const r = normalizePromoRules(rules);
  if (r.scope === "all") return "Tout le panier";
  if (r.scope === "collections") {
    if (r.collectionSlugs.length === 1) return `Collection · ${r.collectionSlugs[0]}`;
    return `${r.collectionSlugs.length} collection(s)`;
  }
  if (r.scope === "products") {
    if (r.productSlugs.length === 1) return `1 produit`;
    return `${r.productSlugs.length} produits`;
  }
  return "Tout le panier";
}

export function promoApplyMessage({ eligible, ineligible, rules }) {
  const r = normalizePromoRules(rules);
  if (r.scope === "all") return null;
  const parts = [];
  if (eligible.length > 0) {
    parts.push(
      `réduction sur ${eligible.length} article${eligible.length > 1 ? "s" : ""} éligible${eligible.length > 1 ? "s" : ""}`,
    );
  }
  if (ineligible.length > 0) {
    parts.push(`${ineligible.length} article${ineligible.length > 1 ? "s" : ""} non éligible${ineligible.length > 1 ? "s" : ""}`);
  }
  return parts.length ? parts.join(" · ") : null;
}
