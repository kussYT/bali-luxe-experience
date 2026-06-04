import { readCatalog, writeCatalog } from "./catalog-store.mjs";
import {
  createPendingOrder,
  attachStripeSession,
  markOrderPaid,
  findOrderBySessionId,
  findOrderById,
} from "./orders-store.mjs";
import { getStripe, getSiteUrl } from "./stripe-client.mjs";
import {
  unitPrice,
  toStripeAmount,
  stripeCurrency,
  SHIPPING_FLAT,
} from "./pricing.mjs";

/** ISO codes for Stripe shipping_address_collection */
export const SHIPPING_COUNTRY_CODES = [
  "FR", "DE", "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "ES", "EE", "FI", "GR", "HU", "IE", "IT",
  "LV", "LT", "LU", "MT", "MC", "NL", "PL", "PT", "RO", "SK", "SI", "SE", "GB", "US", "CA", "AU",
  "NZ", "SG", "HK", "JP", "KR", "TW", "TH", "AE", "CH", "ID", "GP", "RE", "GF", "MQ", "YT", "BL",
  "MF", "PM", "NC", "NO", "MX", "BR", "AR", "CL", "CO", "PE", "MY", "MA", "TR", "UA", "VN", "IN",
];

function absoluteImageUrl(siteUrl, path) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function validateCartItems(catalog, lineItems) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    const err = new Error("Cart is empty");
    err.status = 400;
    throw err;
  }

  const resolved = [];
  for (const line of lineItems) {
    const slug = line?.slug;
    const qty = Number(line?.qty);
    if (!slug || !Number.isFinite(qty) || qty < 1) {
      const err = new Error("Invalid cart line");
      err.status = 400;
      throw err;
    }

    const product = catalog.products.find((p) => p.slug === slug);
    if (!product || product.status !== "published") {
      const err = new Error(`Product not available: ${slug}`);
      err.status = 400;
      throw err;
    }
    if (product.stock < qty) {
      const err = new Error(`Insufficient stock for ${product.name}`);
      err.status = 409;
      throw err;
    }

    resolved.push({ product, qty });
  }
  return resolved;
}

export async function createCheckoutSession({ items, currency, countryCode }) {
  const allowed = ["EUR", "USD", "IDR"];
  if (!allowed.includes(currency)) {
    const err = new Error("Unsupported currency");
    err.status = 400;
    throw err;
  }

  const catalog = await readCatalog();
  const resolved = validateCartItems(catalog, items);
  const siteUrl = getSiteUrl();
  const stripe = getStripe();

  const orderItems = resolved.map(({ product, qty }) => ({
    slug: product.slug,
    name: product.name,
    qty,
    unitPrice: unitPrice(product, currency),
    image: product.image,
  }));

  const order = await createPendingOrder({
    items: orderItems,
    currency,
    countryCode: countryCode || null,
  });

  const line_items = resolved.map(({ product, qty }) => {
    const amount = unitPrice(product, currency);
    return {
      quantity: qty,
      price_data: {
        currency: stripeCurrency(currency),
        unit_amount: toStripeAmount(amount, currency),
        product_data: {
          name: product.name,
          description: product.collection,
          images: [absoluteImageUrl(siteUrl, product.image)].filter(Boolean),
          metadata: { slug: product.slug },
        },
      },
    };
  });

  const shippingAmount = SHIPPING_FLAT[currency];
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    client_reference_id: order.id,
    metadata: { orderId: order.id },
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
    shipping_address_collection: {
      allowed_countries: SHIPPING_COUNTRY_CODES,
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: toStripeAmount(shippingAmount, currency),
            currency: stripeCurrency(currency),
          },
          display_name: "Standard shipping",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 5 },
            maximum: { unit: "business_day", value: 14 },
          },
        },
      },
    ],
    automatic_tax: { enabled: false },
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
  });

  await attachStripeSession(order.id, session.id);

  return { url: session.url, sessionId: session.id, orderId: order.id };
}

export async function fulfillPaidSession(stripeSession) {
  const orderId = stripeSession.metadata?.orderId || stripeSession.client_reference_id;
  if (!orderId) throw new Error("Missing order id on Stripe session");

  const existing = await findOrderById(orderId);
  if (!existing) throw new Error(`Order not found: ${orderId}`);
  if (existing.status === "paid") return existing;

  const paid = await markOrderPaid(orderId, {
    stripeSessionId: stripeSession.id,
    customerEmail: stripeSession.customer_details?.email || stripeSession.customer_email,
    amountTotal: stripeSession.amount_total,
    currency: stripeSession.currency?.toUpperCase(),
  });

  if (!paid) return null;

  const catalog = await readCatalog();
  let changed = false;

  for (const item of existing.items) {
    const idx = catalog.products.findIndex((p) => p.slug === item.slug);
    if (idx === -1) continue;
    const p = catalog.products[idx];
    const nextStock = Math.max(0, (p.stock ?? 0) - item.qty);
    if (nextStock !== p.stock) {
      catalog.products[idx] = {
        ...p,
        stock: nextStock,
        available: nextStock > 0 && p.status === "published",
      };
      changed = true;
    }
  }

  if (changed) await writeCatalog(catalog);
  return paid;
}

export async function handleStripeWebhook(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    const err = new Error("STRIPE_WEBHOOK_SECRET is not configured");
    err.status = 500;
    throw err;
  }

  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      await fulfillPaidSession(session);
    }
  }

  return { received: true };
}

export async function getCheckoutSessionStatus(sessionId) {
  if (!sessionId) {
    const err = new Error("session_id required");
    err.status = 400;
    throw err;
  }
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const order = await findOrderBySessionId(sessionId);

  if (session.payment_status === "paid" && order?.status !== "paid") {
    await fulfillPaidSession(session);
  }

  const updated = await findOrderBySessionId(sessionId);
  return {
    status: session.payment_status,
    customerEmail: session.customer_details?.email,
    order: updated,
  };
}
