# ADR-0004: End-customer payments — platform charge

**Status**: Accepted  
**Date**: 2026-07-24  
**Related**: FB-103 (seams), FB-070 (Stripe Capture — deferred), F-508

## Context

Storefront checkout creates `store_order` rows in `pending_payment` with `payment.provider: "deferred"`. SaaS org billing already uses Stripe (FB-050/051). End-customer capture (FB-070) must not rewrite order schema or ops when unlocked.

Internal-trial merchant is Mestryx-operated (Luna Bijoux); multi-tenant Connect is not required for the first money path.

## Decision

1. **Model**: **Platform charge** — Mestryx Stripe account creates PaymentIntent / Checkout Session per order; funds land on the platform. Stripe Connect for external merchants is **out of scope** until a later ADR.
2. **Seams now (FB-103)**: nullable `store_order.payment_provider`, `stripe_payment_intent_id`, `stripe_checkout_session_id` (+ unique index on PI id). Checkout behaviour unchanged (`provider: "deferred"`).
3. **When FB-070 unlocks**: test-mode Stripe first; reuse `webhook_event` idempotence pattern from billing; map paid/failed webhooks to existing `markPaid` / cancel flows in `order-ops`; refunds map to fiscal credit-note then Stripe Refund API.
4. **Live keys / Connect**: still require human confirmation (Q13 / AGENTS.md).

## Consequences

- Schema ready for FB-070 without migration churn at unlock time.  
- Admin mark-paid and credit-notes remain valid offline paths.  
- RMA approve may issue fiscal credit-note without Stripe money movement until FB-070.  
- Supersede this ADR if Connect becomes the default for third-party merchants.
