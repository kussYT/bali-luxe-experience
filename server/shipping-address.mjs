/**
 * Normalize Stripe Checkout Session shipping / customer details into a stable blob.
 * Stripe fields: shipping_details, customer_details (phone, name, address).
 */

export function shippingDetailsFromStripeSession(session) {
  if (!session || typeof session !== "object") return null;

  const ship =
    session.shipping_details ||
    session.collected_information?.shipping_details ||
    null;
  const addr = ship?.address || session.customer_details?.address || null;
  const name =
    (typeof ship?.name === "string" && ship.name.trim()) ||
    (typeof session.customer_details?.name === "string" && session.customer_details.name.trim()) ||
    null;
  const phone =
    (typeof session.customer_details?.phone === "string" && session.customer_details.phone.trim()) ||
    (typeof ship?.phone === "string" && ship.phone.trim()) ||
    null;

  const line1 = typeof addr?.line1 === "string" ? addr.line1.trim() : "";
  const line2 = typeof addr?.line2 === "string" ? addr.line2.trim() : "";
  const city = typeof addr?.city === "string" ? addr.city.trim() : "";
  const state = typeof addr?.state === "string" ? addr.state.trim() : "";
  const postalCode = typeof addr?.postal_code === "string" ? addr.postal_code.trim() : "";
  const country = typeof addr?.country === "string" ? addr.country.trim().toUpperCase() : "";

  if (!name && !phone && !line1 && !city && !postalCode && !country) {
    return null;
  }

  return {
    method: "home",
    pickupId: null,
    name: name || null,
    phone: phone || null,
    line1: line1 || null,
    line2: line2 || null,
    city: city || null,
    state: state || null,
    postalCode: postalCode || null,
    country: country || null,
  };
}

export function hasUsableShippingAddress(details) {
  if (!details || typeof details !== "object") return false;
  if (details.method === "mondial_relay" && details.pickupId) return true;
  return Boolean(details.line1 || details.postalCode || details.city || details.name);
}

export function formatShippingAddressLines(details) {
  if (!details) return [];
  const lines = [];
  if (details.method === "mondial_relay") {
    lines.push(`Mondial Relay — Point Relais${details.pickupId ? ` ${details.pickupId}` : ""}`);
  }
  if (details.name) lines.push(details.name);
  if (details.line1) lines.push(details.line1);
  if (details.line2) lines.push(details.line2);
  const cityLine = [details.postalCode, details.city].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (details.state) lines.push(details.state);
  if (details.country) lines.push(details.country);
  return lines;
}

/** Prefer Point Relais snapshot over Stripe home address; keep Stripe phone. */
export function mergeShippingForFulfillment(existingAddress, stripeAddress) {
  if (existingAddress?.method === "mondial_relay" && existingAddress?.pickupId) {
    return {
      ...existingAddress,
      phone: stripeAddress?.phone || existingAddress.phone || null,
    };
  }
  return stripeAddress || existingAddress || null;
}
