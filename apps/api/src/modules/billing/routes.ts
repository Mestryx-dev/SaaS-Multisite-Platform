import { and, count, eq, ne } from "drizzle-orm";
import { Hono } from "hono";
import type Stripe from "stripe";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import { organization, plan, site, webhookEvent } from "../../db/schema.js";
import type { AppConfig } from "../../lib/config.js";
import { apiError } from "../../lib/errors.js";
import { log } from "../../lib/logger.js";
import type { Auth } from "../identity/auth.js";
import { assertOrgRole } from "../identity/rbac.js";
import { getStripe } from "./stripe.js";

export async function seedPlans(db: Db) {
  const defaults = [
    {
      id: "free",
      name: "Free",
      maxSites: 1,
      modulesAllowed: ["cms"],
      stripePriceId: null as string | null,
    },
    {
      id: "pro",
      name: "Pro",
      maxSites: 10,
      modulesAllowed: ["cms", "commerce"],
      stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,
    },
  ];
  for (const p of defaults) {
    await db
      .insert(plan)
      .values(p)
      .onConflictDoUpdate({
        target: plan.id,
        set: {
          name: p.name,
          maxSites: p.maxSites,
          modulesAllowed: p.modulesAllowed,
          stripePriceId: p.stripePriceId,
        },
      });
  }
}

const checkoutSchema = z.object({
  organizationId: z.string().uuid(),
  planId: z.string().min(1),
});

const portalSchema = z.object({
  organizationId: z.string().uuid(),
});

async function ensureStripeCustomer(
  db: Db,
  stripe: Stripe,
  org: typeof organization.$inferSelect,
  email: string,
): Promise<string> {
  if (org.stripeCustomerId) return org.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    name: org.name,
    metadata: { organizationId: org.id },
  });

  await db
    .update(organization)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
    .where(eq(organization.id, org.id));

  return customer.id;
}

async function applyPlanToOrg(
  db: Db,
  organizationId: string,
  planId: string,
  stripeCustomerId?: string | null,
) {
  await db
    .update(organization)
    .set({
      planId,
      ...(stripeCustomerId
        ? { stripeCustomerId, updatedAt: new Date() }
        : { updatedAt: new Date() }),
    })
    .where(eq(organization.id, organizationId));
}

async function resolveOrgIdFromCustomer(
  db: Db,
  customerId: string | null | undefined,
): Promise<string | null> {
  if (!customerId) return null;
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.stripeCustomerId, customerId))
    .limit(1);
  return org?.id ?? null;
}

async function handleStripeEvent(db: Db, event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId =
        session.metadata?.organizationId ??
        session.client_reference_id ??
        (await resolveOrgIdFromCustomer(
          db,
          typeof session.customer === "string" ? session.customer : session.customer?.id,
        ));
      const planId = session.metadata?.planId;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      if (orgId && planId) {
        await applyPlanToOrg(db, orgId, planId, customerId);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId =
        sub.metadata?.organizationId ??
        (await resolveOrgIdFromCustomer(
          db,
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
        ));
      const planId = sub.metadata?.planId;
      if (orgId && planId && (sub.status === "active" || sub.status === "trialing")) {
        await applyPlanToOrg(db, orgId, planId);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId =
        sub.metadata?.organizationId ??
        (await resolveOrgIdFromCustomer(
          db,
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
        ));
      if (orgId) {
        await applyPlanToOrg(db, orgId, "free");
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      log("warn", "stripe_payment_failed", {
        customerId,
        invoiceId: invoice.id,
      });
      break;
    }
    default:
      break;
  }
}

export function billingRoutes(db: Db, auth: Auth, config: AppConfig) {
  const app = new Hono();

  app.get("/plans", async (c) => {
    const plans = await db.select().from(plan);
    return c.json({ plans });
  });

  app.get("/organizations/:orgId/billing", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, orgId))
      .limit(1);
    if (!org) return apiError(c, 404, "NOT_FOUND", "Organization not found");

    const planId = org.planId ?? "free";
    const [planRow] = await db
      .select()
      .from(plan)
      .where(eq(plan.id, planId))
      .limit(1);

    const siteCountRows = await db
      .select({ value: count() })
      .from(site)
      .where(and(eq(site.organizationId, org.id), ne(site.status, "archived")));
    const sitesUsed = Number(siteCountRows[0]?.value ?? 0);

    return c.json({
      billing: {
        organizationId: org.id,
        planId,
        planName: planRow?.name ?? planId,
        maxSites: planRow?.maxSites ?? 1,
        sitesUsed,
        planModulesAllowed: (planRow?.modulesAllowed ?? ["cms"]) as string[],
        orgModulesAllowed: (org.modulesAllowed ?? ["cms"]) as string[],
        stripeCustomerId: org.stripeCustomerId,
        stripeConfigured: Boolean(config.stripeSecretKey),
        canManage: access.membership.role === "owner" || access.membership.role === "admin",
      },
    });
  });

  app.post("/billing/checkout-session", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const parsed = checkoutSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const { organizationId, planId } = parsed.data;
    const access = await assertOrgRole(db, session.user.id, organizationId, "admin");
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }

    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);
    if (!org) return apiError(c, 404, "NOT_FOUND", "Organization not found");

    const [planRow] = await db
      .select()
      .from(plan)
      .where(eq(plan.id, planId))
      .limit(1);
    if (!planRow) return apiError(c, 404, "NOT_FOUND", "Plan not found");

    const stripe = getStripe(config);
    if (!stripe) {
      return c.json(
        {
          mode: "test_stub",
          message:
            "Stripe not configured — set STRIPE_SECRET_KEY (test) to create real sessions",
          organizationId,
          planId,
          url: `${config.adminOrigin}/billing?stub=1&plan=${encodeURIComponent(planId)}`,
        },
        200,
      );
    }

    if (!planRow.stripePriceId) {
      return apiError(
        c,
        400,
        "NO_PRICE",
        "Plan has no Stripe price (set STRIPE_PRICE_PRO for Pro)",
      );
    }

    const customerId = await ensureStripeCustomer(
      db,
      stripe,
      org,
      session.user.email,
    );

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: organizationId,
      line_items: [{ price: planRow.stripePriceId, quantity: 1 }],
      success_url: `${config.adminOrigin}/billing?success=1`,
      cancel_url: `${config.adminOrigin}/billing?canceled=1`,
      metadata: { organizationId, planId },
      subscription_data: {
        metadata: { organizationId, planId },
      },
    });

    return c.json({
      mode: "stripe",
      url: checkout.url,
      sessionId: checkout.id,
    });
  });

  app.post("/billing/portal-session", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const parsed = portalSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const { organizationId } = parsed.data;
    const access = await assertOrgRole(db, session.user.id, organizationId, "admin");
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }

    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);
    if (!org) return apiError(c, 404, "NOT_FOUND", "Organization not found");

    const stripe = getStripe(config);
    if (!stripe) {
      return c.json(
        {
          mode: "test_stub",
          message:
            "Stripe not configured — set STRIPE_SECRET_KEY (test) for Customer Portal",
          organizationId,
          url: `${config.adminOrigin}/billing?stub_portal=1`,
        },
        200,
      );
    }

    const customerId = await ensureStripeCustomer(
      db,
      stripe,
      org,
      session.user.email,
    );

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${config.adminOrigin}/billing`,
    });

    return c.json({
      mode: "stripe",
      url: portal.url,
    });
  });

  app.post("/billing/webhooks/stripe", async (c) => {
    const stripe = getStripe(config);
    let event: Stripe.Event | null = null;

    if (stripe && config.stripeWebhookSecret) {
      const signature = c.req.header("stripe-signature");
      if (!signature) {
        return apiError(c, 400, "MISSING_SIGNATURE", "stripe-signature required");
      }
      const rawBody = await c.req.text();
      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          config.stripeWebhookSecret,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log("error", "stripe_webhook_signature_failed", { error: message });
        return apiError(c, 400, "INVALID_SIGNATURE", "Webhook signature invalid");
      }
    } else {
      // Stub / unsigned path for local tests without webhook secret
      const payload = (await c.req.json().catch(() => ({}))) as {
        id?: string;
        type?: string;
        data?: Stripe.Event.Data;
      };
      event = {
        id: payload.id ?? c.req.header("stripe-event-id") ?? `evt_${Date.now()}`,
        object: "event",
        type: (payload.type ?? "unknown") as Stripe.Event.Type,
        data: payload.data ?? { object: {} as Stripe.Event.Data.Object },
        api_version: null,
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      } as Stripe.Event;
    }

    const existing = await db
      .select()
      .from(webhookEvent)
      .where(eq(webhookEvent.id, event.id))
      .limit(1);
    if (existing[0]) {
      return c.json({ received: true, duplicate: true });
    }

    await db.insert(webhookEvent).values({
      id: event.id,
      provider: "stripe",
      payloadType: event.type,
    });

    await handleStripeEvent(db, event);
    log("info", "stripe_webhook", { eventId: event.id, type: event.type });
    return c.json({ received: true });
  });

  return app;
}
