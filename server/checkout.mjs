import { readCatalog } from "./catalog-store.mjs";
import { availableForCheckoutSync, getVariant, getFulfillmentZones, fulfillmentWarehouseForCountry } from "./warehouse-allocation.mjs";
import {
  createPendingOrder,
  attachStripeSession,
  findOrderBySessionId,
  findOrderById,
  markOrderPaid,
  holdOrderAfterPaymentBlocked,
} from "./orders-store.mjs";
import { isDatabaseConfigured } from "./db/pool.mjs";
import { buildOrderItemFromCartLine, isManualInvoiceOrder } from "./db/orders.mjs";
import { getStripe, getSiteUrl } from "./stripe-client.mjs";
import {
  shippingDetailsFromStripeSession,
  hasUsableShippingAddress,
  mergeShippingForFulfillment,
} from "./shipping-address.mjs";
import {
  isMondialRelayCountry,
  normalizePickupPoint,
  isMondialRelayAddress,
  getMondialRelayBrandId,
} from "./mondial-relay.mjs";
import {
  unitPrice,
  toStripeAmount,
  stripeCurrency,
} from "./pricing.mjs";
import { sendOrderConfirmationEmail, notifyOrderPaid } from "./emails/order-emails.mjs";
import { validatePromoCode, incrementPromoUsage } from "./db/promo-codes.mjs";
import { computePromoAmounts, lineUnitAfterPromo } from "./promo-apply.mjs";
import { shippingAmountForCountry } from "./shipping-rates.mjs";
import { isCountryShippingEnabled } from "./db/country-shipping.mjs";
import { getSetting } from "./db/settings-store.mjs";

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

function lineDisplayName(product, variant) {
  if (variant?.title && variant.title !== "Default") {
    return `${product.name} — ${variant.title}`;
  }
  return product.name;
}

export async function validateCartItems(catalog, lineItems, countryCode) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    const err = new Error("Cart is empty");
    err.status = 400;
    throw err;
  }

  const countryShipping = await getSetting("countryShipping", null);
  if (countryShipping?.countries && Object.keys(countryShipping.countries).length > 0) {
    if (!(await isCountryShippingEnabled(countryCode))) {
      const err = new Error("Livraison non disponible pour ce pays");
      err.status = 400;
      throw err;
    }
  }

  const zones = await getFulfillmentZones();
  const resolved = [];
  for (const line of lineItems) {
    const slug = line?.slug;
    const variantId = line?.variantId || null;
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

    const variant = getVariant(product, variantId);
    const stockCheck = availableForCheckoutSync(product, countryCode, qty, variant?.id, zones);
    if (!stockCheck.ok) {
      const label = lineDisplayName(product, variant);
      const warehouse = fulfillmentWarehouseForCountry(countryCode, zones, product);
      const hub = warehouse === "france" ? "Paris" : "Bali";
      const err = new Error(
        stockCheck.available === 0
          ? `${label} is not available for delivery from ${hub}`
          : `Insufficient stock for ${label} (${hub})`,
      );
      err.status = 409;
      throw err;
    }

    if (isDatabaseConfigured()) {
      if (!variant?.id) {
        const err = new Error(`Product has no variant in database: ${slug}`);
        err.status = 500;
        throw err;
      }
      if (!stockCheck.warehouse) {
        const err = new Error(`Could not determine fulfillment warehouse for ${slug}`);
        err.status = 500;
        throw err;
      }
    }

    resolved.push({ product, variant, qty, fulfillmentWarehouse: stockCheck.warehouse });
  }
  return resolved;
}

function normalizeCheckoutCountry(raw, fallback = "FR") {
  const code = (raw || fallback).trim().toUpperCase();
  if (!SHIPPING_COUNTRY_CODES.includes(code)) {
    const err = new Error(`Unsupported shipping country: ${code}`);
    err.status = 400;
    throw err;
  }
  return code;
}

function stripeSessionMetadata({ orderId, promoCode, countryCode, shippingMethod, pickupId }) {
  return {
    orderId,
    promoCode: promoCode || "",
    countryCode: normalizeCheckoutCountry(countryCode),
    shippingMethod: shippingMethod || "home",
    pickupId: pickupId || "",
  };
}

function shippingCountryFromStripeSession(session) {
  return (
    session.shipping_details?.address?.country ||
    session.customer_details?.address?.country ||
    null
  )?.toUpperCase() || null;
}

function stripeShippingAddressCollection(countryCode) {
  return { allowed_countries: [normalizeCheckoutCountry(countryCode)] };
}

async function validatePaidCheckout(order, stripeSession) {
  const isRelay =
    isMondialRelayAddress(order.shippingAddress) ||
    stripeSession.metadata?.shippingMethod === "mondial_relay";

  const shippingCountry =
    shippingCountryFromStripeSession(stripeSession) ||
    (isRelay ? order.shippingAddress?.country || order.shippingCountryCode : null);
  const expectedCountry = normalizeCheckoutCountry(
    stripeSession.metadata?.countryCode || order.countryCode,
  );

  if (!shippingCountry) {
    return { ok: false, reason: "Adresse de livraison manquante sur le paiement Stripe" };
  }

  if (shippingCountry !== expectedCountry) {
    return {
      ok: false,
      reason: `Pays de livraison (${shippingCountry}) différent du pays sélectionné (${expectedCountry})`,
    };
  }

  const catalog = await readCatalog();
  const cartLines = (order.items || []).map((item) => ({
    slug: item.slug,
    variantId: item.variantId || undefined,
    qty: item.qty,
  }));

  try {
    const resolved = await validateCartItems(catalog, cartLines, shippingCountry);
    for (const item of order.items || []) {
      const line = resolved.find(
        (r) => r.product.slug === item.slug && (r.variant?.id || null) === (item.variantId || null),
      );
      if (!line) {
        return { ok: false, reason: `Article introuvable pour validation: ${item.slug}` };
      }
      if (line.fulfillmentWarehouse !== item.warehouseId) {
        return {
          ok: false,
          reason: `Entrepôt invalide pour ${item.slug} (attendu ${line.fulfillmentWarehouse}, commande ${item.warehouseId})`,
        };
      }
    }
    return { ok: true, shippingCountry, resolved };
  } catch (e) {
    return { ok: false, reason: e.message || "Validation panier échouée" };
  }
}

function paymentMetaFromStripeSession(stripeSession, stripeEventId = null, existingOrder = null) {
  const fromStripe = shippingDetailsFromStripeSession(stripeSession);
  const shippingAddress = mergeShippingForFulfillment(existingOrder?.shippingAddress, fromStripe);
  return {
    stripeSessionId: stripeSession.id,
    stripePaymentIntentId:
      typeof stripeSession.payment_intent === "string"
        ? stripeSession.payment_intent
        : stripeSession.payment_intent?.id,
    stripeEventId,
    customerEmail: stripeSession.customer_details?.email || stripeSession.customer_email,
    customerName:
      shippingAddress?.name ||
      existingOrder?.customerName ||
      stripeSession.customer_details?.name ||
      null,
    customerPhone:
      shippingAddress?.phone ||
      fromStripe?.phone ||
      existingOrder?.customerPhone ||
      stripeSession.customer_details?.phone ||
      null,
    shippingAddress,
    amountTotal: stripeSession.amount_total,
    amountSubtotal: stripeSession.amount_subtotal,
    amountShipping: stripeSession.total_details?.amount_shipping ?? null,
    currency: stripeSession.currency?.toUpperCase(),
    shippingCountryCode:
      shippingAddress?.country ||
      shippingCountryFromStripeSession(stripeSession) ||
      existingOrder?.shippingCountryCode ||
      null,
  };
}

function buildOrderItems(resolved, currency) {
  return resolved.map(({ product, variant, qty, fulfillmentWarehouse }) => {
    const price = unitPrice(product, currency);
    const unitPriceSmallest = toStripeAmount(price, currency);
    if (isDatabaseConfigured()) {
      return buildOrderItemFromCartLine({
        product,
        variant,
        qty,
        fulfillmentWarehouse,
        unitPriceAmount: unitPriceSmallest,
      });
    }
    return {
      slug: product.slug,
      name: product.name,
      variantTitle: variant?.title || "Default",
      qty,
      unitPrice: unitPriceSmallest,
      image: product.image,
      warehouseId: fulfillmentWarehouse,
      variantId: variant?.id,
    };
  });
}

async function fulfillFreeOrder({
  orderId,
  promo,
  customerEmail,
  countryCode,
  currency,
  amounts,
  shippingAddress = null,
  customerName = null,
}) {
  const { order: paid, newlyPaid } = await markOrderPaid(orderId, {
    customerEmail,
    customerName,
    shippingAddress,
    amountTotal: 0,
    amountSubtotal: amounts.subtotalSmallest - amounts.productDiscount,
    amountShipping: amounts.shippingSmallest - amounts.shippingDiscount,
    currency: currency.toLowerCase(),
    shippingCountryCode: shippingAddress?.country || countryCode,
    promoCode: promo.code,
  });
  if (isDatabaseConfigured() && newlyPaid) {
    await incrementPromoUsage(promo.code);
  }
  if (newlyPaid && paid) notifyOrderPaid(paid);
  return paid;
}

export async function createCheckoutSession({
  items,
  currency,
  countryCode,
  promoCode,
  customerEmail,
  shippingMethod = "home",
  pickupPoint = null,
}) {
  const allowed = ["EUR", "USD", "IDR"];
  if (!allowed.includes(currency)) {
    const err = new Error("Unsupported currency");
    err.status = 400;
    throw err;
  }

  const checkoutCountry = normalizeCheckoutCountry(countryCode);
  const method = shippingMethod === "mondial_relay" ? "mondial_relay" : "home";
  let relayAddress = null;

  if (method === "mondial_relay") {
    if (!isMondialRelayCountry(checkoutCountry)) {
      const err = new Error("Mondial Relay n’est pas disponible pour ce pays");
      err.status = 400;
      throw err;
    }
    relayAddress = normalizePickupPoint(pickupPoint, checkoutCountry);
    if (!relayAddress) {
      const err = new Error("Sélectionnez un Point Relais Mondial Relay");
      err.status = 400;
      throw err;
    }
  }

  const catalog = await readCatalog();
  const resolved = await validateCartItems(catalog, items, checkoutCountry);
  const siteUrl = getSiteUrl();

  const shippingAmount = await shippingAmountForCountry(checkoutCountry, currency);
  const shippingSmallest = toStripeAmount(shippingAmount, currency);

  let promo = null;
  let amounts = {
    subtotalSmallest: resolved.reduce(
      (s, { product, variant, qty }) =>
        s + toStripeAmount(unitPrice(product, currency), currency) * qty,
      0,
    ),
    productDiscount: 0,
    shippingDiscount: 0,
    shippingSmallest,
    totalSmallest: 0,
    isFullyFree: false,
  };

  if (promoCode?.trim()) {
    promo = await validatePromoCode(promoCode);
    try {
      amounts = { ...computePromoAmounts({ promo, resolved, currency, shippingSmallest, countryCode: checkoutCountry }), shippingSmallest };
    } catch (e) {
      const err = new Error(e.message || "Code promo invalide pour ce panier");
      err.status = e.status || 400;
      throw err;
    }
  } else {
    amounts.totalSmallest = amounts.subtotalSmallest + shippingSmallest;
  }

  const orderItems = buildOrderItems(resolved, currency);
  const order = await createPendingOrder({
    items: orderItems,
    currency,
    countryCode: checkoutCountry,
    customerEmail: customerEmail || null,
    promoCode: promo?.code || null,
    amountSubtotal: amounts.subtotalSmallest - amounts.productDiscount,
    amountShipping: Math.max(0, amounts.shippingSmallest - amounts.shippingDiscount),
    amountTotal: amounts.totalSmallest,
    customerName: relayAddress?.name || null,
    shippingAddress: relayAddress,
  });

  if (amounts.isFullyFree) {
    if (!customerEmail?.trim()) {
      const err = new Error("Email requis pour une commande cadeau");
      err.status = 400;
      throw err;
    }
    if (method === "mondial_relay" && !relayAddress) {
      const err = new Error("Sélectionnez un Point Relais Mondial Relay");
      err.status = 400;
      throw err;
    }
    await fulfillFreeOrder({
      orderId: order.id,
      promo,
      customerEmail: customerEmail.trim(),
      countryCode: checkoutCountry,
      currency,
      amounts,
      shippingAddress: relayAddress,
      customerName: relayAddress?.name || null,
    });
    return {
      url: `${siteUrl}/checkout/success?order_id=${order.id}&free=1`,
      orderId: order.id,
      free: true,
    };
  }

  const stripe = getStripe();

  const line_items = resolved.map((line) => {
    const { product, variant, qty } = line;
    const discounted =
      promo && amounts.productDiscount > 0
        ? lineUnitAfterPromo(line, currency, amounts)
        : unitPrice(product, currency);
    const displayName = lineDisplayName(product, variant);
    return {
      quantity: qty,
      price_data: {
        currency: stripeCurrency(currency),
        unit_amount: toStripeAmount(discounted, currency),
        product_data: {
          name: displayName,
          description: product.collection,
          images: [absoluteImageUrl(siteUrl, product.image)].filter(Boolean),
          metadata: {
            slug: product.slug,
            variantId: variant?.id || "",
            variantTitle: variant?.title || "",
          },
        },
      },
    };
  });

  const finalShipping = Math.max(
    0,
    shippingSmallest - (amounts.shippingDiscount || 0),
  );

  const shippingLabel = promo?.freeShipping
    ? "Complimentary shipping"
    : method === "mondial_relay"
      ? "Mondial Relay — Point Relais"
      : "Standard shipping";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    client_reference_id: order.id,
    metadata: stripeSessionMetadata({
      orderId: order.id,
      promoCode: promo?.code,
      countryCode: checkoutCountry,
      shippingMethod: method,
      pickupId: relayAddress?.pickupId,
    }),
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
    shipping_address_collection: stripeShippingAddressCollection(checkoutCountry),
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: finalShipping,
            currency: stripeCurrency(currency),
          },
          display_name: shippingLabel,
          delivery_estimate: {
            minimum: { unit: "business_day", value: method === "mondial_relay" ? 3 : 5 },
            maximum: { unit: "business_day", value: method === "mondial_relay" ? 8 : 14 },
          },
        },
      },
    ],
    automatic_tax: { enabled: false },
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    customer_email: customerEmail?.trim() || undefined,
    custom_text:
      method === "mondial_relay"
        ? {
            shipping_address: {
              message:
                "Point Relais déjà choisi sur le site — indiquez votre adresse (facturation / contact). Le colis ira au Point Relais sélectionné.",
            },
          }
        : undefined,
  });

  await attachStripeSession(order.id, session.id);

  return { url: session.url, sessionId: session.id, orderId: order.id };
}

const CHECKOUT_RESUME_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

async function createStripeSessionForPendingOrder({
  order,
  resolved,
  amounts,
  promo,
  currency,
  countryCode,
  customerEmail,
  useStoredUnitPrices = false,
}) {
  const checkoutCountry = normalizeCheckoutCountry(countryCode);
  const siteUrl = getSiteUrl();
  const stripe = getStripe();
  const shippingSmallest = amounts.shippingSmallest;

  const line_items = resolved.map((line) => {
    const { product, variant, qty } = line;
    let unitAmount;
    if (useStoredUnitPrices) {
      const stored = (order.items || []).find(
        (item) =>
          item.slug === product.slug &&
          (item.variantId == null || !variant?.id || item.variantId === variant.id),
      );
      if (stored?.unitPrice == null) {
        const err = new Error(`Prix stocké introuvable pour ${product.slug}`);
        err.status = 400;
        throw err;
      }
      unitAmount = Number(stored.unitPrice);
    } else {
      const discounted =
        promo && amounts.productDiscount > 0
          ? lineUnitAfterPromo(line, currency, amounts)
          : unitPrice(product, currency);
      unitAmount = toStripeAmount(discounted, currency);
    }
    const displayName = lineDisplayName(product, variant);
    return {
      quantity: qty,
      price_data: {
        currency: stripeCurrency(currency),
        unit_amount: unitAmount,
        product_data: {
          name: displayName,
          description: product.collection,
          images: [absoluteImageUrl(siteUrl, product.image)].filter(Boolean),
          metadata: {
            slug: product.slug,
            variantId: variant?.id || "",
            variantTitle: variant?.title || "",
          },
        },
      },
    };
  });

  const finalShipping = Math.max(0, shippingSmallest - (amounts.shippingDiscount || 0));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    client_reference_id: order.id,
    metadata: stripeSessionMetadata({ orderId: order.id, promoCode: promo?.code, countryCode: checkoutCountry }),
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
    shipping_address_collection: stripeShippingAddressCollection(checkoutCountry),
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: finalShipping,
            currency: stripeCurrency(currency),
          },
          display_name: promo?.freeShipping ? "Complimentary shipping" : "Standard shipping",
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
    customer_email: customerEmail?.trim() || undefined,
  });

  await attachStripeSession(order.id, session.id);
  return session;
}

/** Resume Stripe checkout for an existing pending order (recovery link in emails). */
export async function resumeCheckoutSession(orderId) {
  const order = await findOrderById(orderId);
  if (!order) {
    const err = new Error("Commande introuvable");
    err.status = 404;
    throw err;
  }
  if (order.status !== "pending") {
    const err = new Error("Cette commande a déjà été finalisée");
    err.status = 400;
    throw err;
  }
  if (order.channel && order.channel !== "website") {
    const err = new Error("Reprise de paiement indisponible pour cette commande");
    err.status = 400;
    throw err;
  }
  const age = Date.now() - new Date(order.createdAt).getTime();
  if (age > CHECKOUT_RESUME_MAX_AGE_MS) {
    const err = new Error("Ce lien de paiement a expiré — recommencez depuis la boutique");
    err.status = 410;
    throw err;
  }
  if (!order.items?.length) {
    const err = new Error("Panier vide");
    err.status = 400;
    throw err;
  }

  const currency = order.currency || "EUR";
  const checkoutCountry = normalizeCheckoutCountry(order.countryCode || order.shippingCountryCode);
  const catalog = await readCatalog();
  const cartLines = order.items.map((item) => ({
    slug: item.slug,
    variantId: item.variantId || undefined,
    qty: item.qty,
  }));
  const resolved = await validateCartItems(catalog, cartLines, checkoutCountry);
  const manualInvoice = isManualInvoiceOrder(order);

  const shippingAmount = await shippingAmountForCountry(checkoutCountry, currency);
  const shippingSmallest = manualInvoice && order.amountShipping != null
    ? Number(order.amountShipping)
    : toStripeAmount(shippingAmount, currency);

  let promo = null;
  let amounts = {
    subtotalSmallest: resolved.reduce(
      (s, { product, variant, qty }) =>
        s + toStripeAmount(unitPrice(product, currency), currency) * qty,
      0,
    ),
    productDiscount: 0,
    shippingDiscount: 0,
    shippingSmallest,
    totalSmallest: 0,
    isFullyFree: false,
  };

  if (manualInvoice) {
    amounts.subtotalSmallest =
      order.amountSubtotal != null
        ? Number(order.amountSubtotal)
        : (order.items || []).reduce((s, i) => s + Number(i.unitPrice) * i.qty, 0);
    amounts.totalSmallest =
      order.amountTotal != null
        ? Number(order.amountTotal)
        : amounts.subtotalSmallest + shippingSmallest;
  } else {
    const promoCode = order.promoCode?.trim();
    if (promoCode) {
      promo = await validatePromoCode(promoCode);
      amounts = { ...computePromoAmounts({ promo, resolved, currency, shippingSmallest, countryCode: checkoutCountry }), shippingSmallest };
    } else {
      amounts.totalSmallest = amounts.subtotalSmallest + shippingSmallest;
    }
  }

  if (amounts.isFullyFree || amounts.totalSmallest <= 0) {
    const err = new Error("Commande gratuite — contactez-nous pour finaliser");
    err.status = 400;
    throw err;
  }

  const session = await createStripeSessionForPendingOrder({
    order,
    resolved,
    amounts,
    promo,
    currency,
    countryCode: checkoutCountry,
    customerEmail: order.customerEmail,
    useStoredUnitPrices: manualInvoice,
  });

  return { url: session.url, sessionId: session.id, orderId: order.id };
}

export async function fulfillPaidSession(stripeSession, stripeEventId = null) {
  const orderId = stripeSession.metadata?.orderId || stripeSession.client_reference_id;
  if (!orderId) throw new Error("Missing order id on Stripe session");

  const existing = await findOrderById(orderId);
  if (!existing) throw new Error(`Order not found: ${orderId}`);
  if (existing.status === "paid") return existing;
  if (existing.status === "on_hold") return existing;

  const promoCode = stripeSession.metadata?.promoCode?.trim() || null;
  const paymentMeta = paymentMetaFromStripeSession(stripeSession, stripeEventId, existing);
  const validation = await validatePaidCheckout(existing, stripeSession);

  if (!validation.ok) {
    console.error("[checkout] payment blocked:", validation.reason, orderId);
    return holdOrderAfterPaymentBlocked(orderId, {
      reason: validation.reason,
      ...paymentMeta,
    });
  }

  const paid = await markOrderPaid(orderId, {
    ...paymentMeta,
    promoCode: promoCode || undefined,
  });

  if (promoCode && isDatabaseConfigured() && paid.newlyPaid) {
    await incrementPromoUsage(promoCode);
  }

  if (paid.newlyPaid && paid.order) {
    notifyOrderPaid(paid.order);
    return paid.order;
  }

  return paid.order ?? existing;
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
    const orderId = session.metadata?.orderId || session.client_reference_id;
    if (!orderId) {
      return { received: true, type: event.type, ignored: "no order id on session" };
    }
    if (session.payment_status === "paid") {
      await fulfillPaidSession(session, event.id);
    }
  }

  return { received: true, type: event.type };
}

export async function getCheckoutSessionStatus(sessionId, orderId) {
  if (orderId) {
    const order = await findOrderById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.status = 404;
      throw err;
    }
    return {
      status: order.status === "paid" ? "paid" : "pending",
      customerEmail: order.customerEmail,
      order,
    };
  }

  if (!sessionId) {
    const err = new Error("session_id or order_id required");
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

/**
 * For older paid orders: pull shipping from Stripe Checkout Session and persist.
 */
export async function enrichOrderShippingFromStripe(order) {
  if (!order?.stripeSessionId) return order;
  if (hasUsableShippingAddress(order.shippingAddress)) return order;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
  const shippingAddress = shippingDetailsFromStripeSession(session);
  if (!hasUsableShippingAddress(shippingAddress)) return order;

  const { updateOrderShippingDetails } = await import("./db/orders.mjs");
  const saved = await updateOrderShippingDetails(order.id, shippingAddress);
  return saved || { ...order, shippingAddress, customerName: shippingAddress.name, customerPhone: shippingAddress.phone };
}

/** Public config for cart shipping method UI. */
export function getShippingOptionsForCountry(countryCode) {
  const code = normalizeCheckoutCountry(countryCode);
  const mondialEnabled = isMondialRelayCountry(code);
  return {
    countryCode: code,
    methods: mondialEnabled ? ["home", "mondial_relay"] : ["home"],
    mondialRelay: mondialEnabled
      ? {
          enabled: true,
          brandId: getMondialRelayBrandId(),
          countries: ["FR", "BE", "LU", "NL", "ES"],
        }
      : { enabled: false, brandId: null, countries: [] },
  };
}
