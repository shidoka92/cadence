import Stripe from "stripe";

/** Commission Cadence sur chaque abonnement élève. */
export const PLATFORM_FEE_PERCENT = 10;

let _stripe: Stripe | null = null;

/** null si STRIPE_SECRET_KEY n'est pas configurée (dev sans Stripe, ou oubli de variable). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_stripe) _stripe = new Stripe(key);
  return _stripe;
}
