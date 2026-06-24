import { sendEmail, siteUrl } from "../email.mjs";
import {
  createCustomerMagicToken,
  createCustomerSessionToken,
  customerSessionCookieHeader,
  clearCustomerSessionCookieHeader,
  upsertCustomer,
  getCustomerById,
  updateCustomerWishlist,
  getCustomerOrders,
  createWishlistShare,
  getWishlistShare,
  requireCustomerSession,
  verifyCustomerMagicToken,
} from "../customer-auth.mjs";

import { isDatabaseConfigured } from "../db/pool.mjs";

function requireAccountsDb() {
  if (!isDatabaseConfigured()) {
    const err = new Error("Customer accounts require DATABASE_URL");
    err.status = 503;
    throw err;
  }
}

export async function postAccountRequestLink(body) {
  requireAccountsDb();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    const err = new Error("Valid email required");
    err.status = 400;
    throw err;
  }

  const token = createCustomerMagicToken(email);
  const link = `${siteUrl()}/account?verify=${encodeURIComponent(token)}`;

  const result = await sendEmail({
    to: email,
    subject: "Sign in to Bingin Diaries",
    html: `
      <p>Click below to sign in to your Bingin Diaries account. This link expires in one hour.</p>
      <p><a href="${link}">Sign in</a></p>
      <p style="color:#666;font-size:13px;">If you did not request this, you can ignore this email.</p>
    `,
  });

  const response = { ok: true, message: "Sign-in link sent" };
  if (result.provider === "console") {
    response.devLink = link;
  }
  return response;
}

export async function getAccountVerify(token, request) {
  requireAccountsDb();
  const data = verifyCustomerMagicToken(token);
  if (!data?.email) {
    const err = new Error("Invalid or expired link");
    err.status = 400;
    throw err;
  }

  const customer = await upsertCustomer(data.email);
  const session = createCustomerSessionToken(customer.id, customer.email);

  return {
    ok: true,
    customer: { email: customer.email, wishlist: customer.wishlist },
    headers: { "Set-Cookie": customerSessionCookieHeader(session, request) },
  };
}

export async function getAccountMe(request) {
  const session = requireCustomerSession(request);
  const customer = await getCustomerById(session.customerId);
  if (!customer) {
    const err = new Error("Customer not found");
    err.status = 404;
    throw err;
  }
  const orders = await getCustomerOrders(customer.email);
  return {
    customer: { email: customer.email, wishlist: customer.wishlist },
    orders,
  };
}

export async function postAccountWishlist(request, body) {
  const session = requireCustomerSession(request);
  const slugs = Array.isArray(body.slugs) ? body.slugs : [];
  const wishlist = await updateCustomerWishlist(session.customerId, slugs);
  return { wishlist };
}

export async function postAccountLogout() {
  return {
    ok: true,
    headers: { "Set-Cookie": clearCustomerSessionCookieHeader() },
  };
}

export async function postWishlistShare(body) {
  requireAccountsDb();
  const slugs = Array.isArray(body.slugs) ? body.slugs : [];
  if (!slugs.length) {
    const err = new Error("Wishlist is empty");
    err.status = 400;
    throw err;
  }
  const share = await createWishlistShare(slugs);
  return {
    token: share.token,
    url: `${siteUrl()}/wishlist/${share.token}`,
    slugs: share.slugs,
  };
}

export async function getWishlistShareResponse(token) {
  requireAccountsDb();
  const slugs = await getWishlistShare(token);
  if (!slugs) {
    const err = new Error("Share link not found or expired");
    err.status = 404;
    throw err;
  }
  return { slugs };
}
