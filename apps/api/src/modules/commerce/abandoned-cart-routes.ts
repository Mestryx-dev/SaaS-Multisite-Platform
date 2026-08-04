import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import type { AppConfig } from "../../lib/config.js";
import { apiError } from "../../lib/errors.js";
import type { Auth } from "../identity/auth.js";
import { assertOrgRole } from "../identity/rbac.js";
import {
  findAbandonedCarts,
  runAbandonedCartEmails,
} from "./abandoned-carts.js";

export function abandonedCartRoutes(db: Db, auth: Auth, config: AppConfig) {
  const app = new Hono();

  app.get("/organizations/:orgId/abandoned-carts", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const hoursRaw = c.req.query("olderThanHours");
    const olderThanHours = hoursRaw ? Number.parseInt(hoursRaw, 10) : 24;
    const carts = await findAbandonedCarts(db, {
      organizationId: orgId,
      olderThanHours: Number.isNaN(olderThanHours) ? 24 : olderThanHours,
    });
    return c.json({ carts });
  });

  app.post("/organizations/:orgId/abandoned-carts/run", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "admin");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const body = z
      .object({ olderThanHours: z.number().int().min(1).max(720).optional() })
      .safeParse((await c.req.json().catch(() => ({}))) as unknown);
    const olderThanHours = body.success
      ? (body.data.olderThanHours ?? 24)
      : 24;

    const result = await runAbandonedCartEmails(
      db,
      config,
      orgId,
      olderThanHours,
    );
    return c.json({
      sent: result.sent,
      candidates: result.candidates.length,
      carts: result.candidates,
    });
  });

  return app;
}
