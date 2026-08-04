import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import {
  orderEvent,
  returnRequest,
  storeOrder,
} from "../../db/schema.js";
import type { AppConfig } from "../../lib/config.js";
import { apiError } from "../../lib/errors.js";
import type { Auth } from "../identity/auth.js";
import { assertOrgRole } from "../identity/rbac.js";
import { ensureStorefrontCustomer } from "./customer.js";
import { issueCreditNote } from "./order-ops.js";

const createReturnSchema = z.object({
  siteId: z.string().uuid(),
  reason: z.string().min(3).max(2000),
  itemsJson: z.array(z.record(z.string(), z.unknown())).optional(),
});

const patchReturnSchema = z.object({
  status: z.enum(["approved", "rejected", "cancelled"]),
});

export function returnRoutes(db: Db, auth: Auth, config: AppConfig) {
  const app = new Hono();

  /** Storefront — customer creates return on own order */
  app.post("/storefront/orders/:publicId/returns", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const parsed = createReturnSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const cust = await ensureStorefrontCustomer(db, {
      siteId: parsed.data.siteId,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });
    if (!cust) return apiError(c, 404, "NOT_FOUND", "Site not found");

    const [order] = await db
      .select()
      .from(storeOrder)
      .where(
        and(
          eq(storeOrder.publicId, c.req.param("publicId")),
          eq(storeOrder.siteId, parsed.data.siteId),
          eq(storeOrder.customerId, cust.id),
        ),
      )
      .limit(1);
    if (!order) return apiError(c, 404, "NOT_FOUND", "Order not found");
    if (order.status !== "paid" && order.status !== "fulfilled") {
      return apiError(
        c,
        400,
        "INVALID_STATUS",
        "Returns only allowed for paid or fulfilled orders",
      );
    }

    const [existing] = await db
      .select()
      .from(returnRequest)
      .where(
        and(
          eq(returnRequest.orderId, order.id),
          eq(returnRequest.status, "requested"),
        ),
      )
      .limit(1);
    if (existing) {
      return apiError(c, 409, "ALREADY_EXISTS", "A return is already requested");
    }

    const [created] = await db
      .insert(returnRequest)
      .values({
        organizationId: order.organizationId,
        siteId: order.siteId,
        orderId: order.id,
        reason: parsed.data.reason,
        itemsJson: parsed.data.itemsJson ?? [],
        status: "requested",
      })
      .returning();

    await db.insert(orderEvent).values({
      orderId: order.id,
      type: "return_requested",
      message: `Return requested: ${parsed.data.reason.slice(0, 200)}`,
    });

    return c.json({ returnRequest: created }, 201);
  });

  app.get("/storefront/returns", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const siteId = c.req.query("siteId");
    if (!siteId || !z.string().uuid().safeParse(siteId).success) {
      return apiError(c, 400, "VALIDATION_ERROR", "siteId query required");
    }
    const cust = await ensureStorefrontCustomer(db, {
      siteId,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });
    if (!cust) return apiError(c, 404, "NOT_FOUND", "Site not found");

    const rows = await db
      .select({
        id: returnRequest.id,
        status: returnRequest.status,
        reason: returnRequest.reason,
        createdAt: returnRequest.createdAt,
        orderPublicId: storeOrder.publicId,
      })
      .from(returnRequest)
      .innerJoin(storeOrder, eq(returnRequest.orderId, storeOrder.id))
      .where(
        and(
          eq(returnRequest.siteId, siteId),
          eq(storeOrder.customerId, cust.id),
        ),
      )
      .orderBy(desc(returnRequest.createdAt));

    return c.json({ returns: rows });
  });

  /** Admin — list returns for org */
  app.get("/organizations/:orgId/returns", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const rows = await db
      .select({
        id: returnRequest.id,
        status: returnRequest.status,
        reason: returnRequest.reason,
        createdAt: returnRequest.createdAt,
        updatedAt: returnRequest.updatedAt,
        orderId: storeOrder.id,
        orderPublicId: storeOrder.publicId,
        orderStatus: storeOrder.status,
        siteId: returnRequest.siteId,
      })
      .from(returnRequest)
      .innerJoin(storeOrder, eq(returnRequest.orderId, storeOrder.id))
      .where(eq(returnRequest.organizationId, orgId))
      .orderBy(desc(returnRequest.createdAt));

    return c.json({ returns: rows });
  });

  app.patch("/returns/:returnId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const parsed = patchReturnSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const returnId = c.req.param("returnId");
    const [existing] = await db
      .select()
      .from(returnRequest)
      .where(eq(returnRequest.id, returnId))
      .limit(1);
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Return not found");

    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const [updated] = await db
      .update(returnRequest)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(returnRequest.id, returnId))
      .returning();

    await db.insert(orderEvent).values({
      orderId: existing.orderId,
      type: `return_${parsed.data.status}`,
      message: `Return ${parsed.data.status}`,
    });

    let creditNote: unknown = null;
    if (parsed.data.status === "approved") {
      const cn = await issueCreditNote(db, existing.orderId, config);
      if (cn.ok) {
        creditNote = {
          invoiceId: cn.invoice.id,
          number: cn.invoice.number,
          idempotent: cn.idempotent,
          fiscalOnly: true,
        };
      }
    }

    return c.json({ returnRequest: updated, creditNote });
  });

  return app;
}
