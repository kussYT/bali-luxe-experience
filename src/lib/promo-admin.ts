export const PROMO_CATEGORIES = [
  { id: "newsletter", label: "Newsletter" },
  { id: "loyalty", label: "Fidélité / 2e commande" },
  { id: "friends", label: "Amis proches" },
  { id: "influencer", label: "Influenceur" },
  { id: "seasonal", label: "Saison / soldes" },
  { id: "other", label: "Autre" },
] as const;

export type PromoCategoryId = (typeof PROMO_CATEGORIES)[number]["id"];

export function promoCategoryLabel(category: string | null | undefined) {
  return PROMO_CATEGORIES.find((c) => c.id === category)?.label ?? "Autre";
}

export function promoStatus(promo: {
  active: boolean;
  expiresAt: string | null;
  rules?: { startsAt?: string | null };
  maxUses: number | null;
  usedCount: number;
}) {
  const now = Date.now();
  if (!promo.active) return "inactive" as const;
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return "exhausted" as const;
  const startsAt = promo.rules?.startsAt;
  if (startsAt && new Date(startsAt).getTime() > now) return "scheduled" as const;
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < now) return "expired" as const;
  return "active" as const;
}

export function promoStatusLabel(status: ReturnType<typeof promoStatus>) {
  if (status === "active") return "Actif";
  if (status === "scheduled") return "Programmé";
  if (status === "expired") return "Expiré";
  if (status === "exhausted") return "Limite atteinte";
  return "Inactif";
}

export function formatPromoDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}
