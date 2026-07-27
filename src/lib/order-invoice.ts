import type { AdminOrder } from "@/lib/admin-api";
import { productLineRef } from "@/lib/order-display";

function formatCents(amount: number | null | undefined, currency: string) {
  if (amount == null || !Number.isFinite(amount)) return "—";
  const code = (currency || "EUR").toUpperCase();
  const major = code === "IDR" ? amount : amount / 100;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: code === "USD" ? "USD" : code === "IDR" ? "IDR" : "EUR",
      maximumFractionDigits: code === "IDR" ? 0 : 2,
    }).format(major);
  } catch {
    return `${major} ${code}`;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Open a print-ready order summary (save as PDF via the browser). */
export function printOrderInvoice(order: AdminOrder) {
  const addr = order.shippingAddress;
  const addressLines = [
    addr?.method === "mondial_relay"
      ? `Mondial Relay — Point Relais${addr.pickupId ? ` ${addr.pickupId}` : ""}`
      : null,
    order.customerName || addr?.name,
    addr?.line1,
    addr?.line2,
    [addr?.postalCode, addr?.city].filter(Boolean).join(" "),
    addr?.state,
    addr?.country || order.shippingCountryCode,
  ].filter(Boolean) as string[];

  const itemRows = (order.items || [])
    .map((item) => {
      const ref = productLineRef(item);
      const label =
        item.variantTitle && item.variantTitle !== "Default"
          ? `${item.name} — ${item.variantTitle}`
          : item.name;
      const lineTotal = item.unitPrice * item.qty;
      return `<tr>
        <td>${escapeHtml(ref)}<br/><span style="color:#555">${escapeHtml(label)}</span></td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">${escapeHtml(formatCents(item.unitPrice, order.currency))}</td>
        <td style="text-align:right">${escapeHtml(formatCents(lineTotal, order.currency))}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Facture ${escapeHtml(order.id.slice(0, 8))}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; margin: 40px; }
    h1 { font-size: 28px; margin: 0 0 4px; letter-spacing: 0.04em; }
    .muted { color: #666; font-size: 13px; }
    .grid { display: flex; justify-content: space-between; gap: 32px; margin: 28px 0; }
    .box { flex: 1; }
    .box h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #ddd; font-size: 14px; vertical-align: top; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #666; }
    .totals { margin-top: 20px; margin-left: auto; width: 280px; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals .grand { font-size: 18px; font-weight: bold; border-top: 1px solid #1a1a1a; margin-top: 8px; padding-top: 10px; }
    @media print { body { margin: 16px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()" style="margin-bottom:20px;padding:8px 14px;cursor:pointer">
    Imprimer / Enregistrer en PDF
  </button>
  <h1>Bingin Diaries</h1>
  <p class="muted">Facture récapitulative · Commande ${escapeHtml(order.id)}</p>
  <p class="muted">
    Date : ${escapeHtml(new Date(order.paidAt || order.createdAt).toLocaleString("fr-FR"))}
    ${order.status ? ` · Statut : ${escapeHtml(order.status)}` : ""}
  </p>

  <div class="grid">
    <div class="box">
      <h2>Client</h2>
      <p>${escapeHtml(order.customerName || addr?.name || "—")}</p>
      <p>${escapeHtml(order.customerEmail || "—")}</p>
      <p>${escapeHtml(order.customerPhone || addr?.phone || "—")}</p>
    </div>
    <div class="box">
      <h2>Livraison</h2>
      ${
        addressLines.length
          ? addressLines.map((l) => `<p>${escapeHtml(l)}</p>`).join("")
          : "<p>—</p>"
      }
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Article</th>
        <th style="text-align:center">Qté</th>
        <th style="text-align:right">Prix unit.</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div><span>Sous-total</span><span>${escapeHtml(formatCents(order.amountSubtotal ?? null, order.currency))}</span></div>
    <div><span>Livraison</span><span>${escapeHtml(formatCents(order.amountShipping ?? null, order.currency))}</span></div>
    <div class="grand"><span>Total</span><span>${escapeHtml(formatCents(order.amountTotal, order.currency))}</span></div>
  </div>

  <p class="muted" style="margin-top:40px">Document généré depuis l’admin Bingin Diaries — à usage interne / client.</p>
  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));</script>
</body>
</html>`;

  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
  if (!win) {
    throw new Error("Autorisez les pop-ups pour générer la facture.");
  }
  win.document.write(html);
  win.document.close();
}
