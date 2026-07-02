/** Order status labels (admin UI — French, aligned with Shopify ops). */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Paiement en attente",
  paid: "À traiter",
  processing: "En cours",
  on_hold: "En attente",
  shipped: "Traitée",
  cancelled: "Annulée",
  refunded: "Remboursée",
  partially_refunded: "Partiellement remboursée",
};

export const ORDER_STATUS_OPTIONS = [
  "paid",
  "processing",
  "on_hold",
  "shipped",
  "cancelled",
  "refunded",
  "partially_refunded",
] as const;

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
