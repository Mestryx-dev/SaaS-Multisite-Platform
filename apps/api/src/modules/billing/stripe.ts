import Stripe from "stripe";
import type { AppConfig } from "../../lib/config.js";

/** Stripe client when `STRIPE_SECRET_KEY` is set (test mode only per Q13). */
export function getStripe(config: AppConfig): Stripe | null {
  if (!config.stripeSecretKey) return null;
  return new Stripe(config.stripeSecretKey, {
    apiVersion: "2026-07-29.dahlia",
  });
}
