import Stripe from "stripe";
import { siteUrl } from "./email.mjs";

let stripe;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    const err = new Error("STRIPE_SECRET_KEY is not configured");
    err.status = 500;
    throw err;
  }
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

export function getSiteUrl() {
  return siteUrl();
}
