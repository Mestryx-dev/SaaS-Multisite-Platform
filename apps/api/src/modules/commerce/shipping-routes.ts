import { and, asc, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import { shippingMethod, shippingZone, site } from "../../db/schema.js";
import { apiError } from "../../lib/errors.js";
import type { Auth } from "../identity/auth.js";
import { assertOrgRole } from "../identity/rbac.js";

const zoneCreateSchema = z.object({
  organizationId: z.string().uuid(),
  siteId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  countries: z.array(z.string().min(2).max(2)).min(1),
});

const methodCreateSchema = z.object({
  name: z.string().min(1).max(200),
  priceCents: z.number().int().min(0),
  currency: z.string().min(3).max(3).default("eur"),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

async function loadSite(db: Db, siteId: string) {
  const [row] = await db.select().from(site).where(eq(site.id, siteId)).limit(1);
  return row ?? null;
}

export function countryMatchesZone(
  countries: string[],
  country: string,
): boolean {
  const code = country.toUpperCase();
  return countries.some((c) => c === "*" || c.toUpperCase() === code);
}

export async function listShippingQuotes(
  db: Db,
  siteId: string,
  country: string,
) {
  const siteRow = await loadSite(db, siteId);
  if (!siteRow) return null;

  const zones = await db
    .select()
    .from(shippingZone)
    .where(
      and(
        eq(shippingZone.organizationId, siteRow.organizationId),
        or(eq(shippingZone.siteId, siteId), isNull(shippingZone.siteId)),
      ),
    );

  const matching = zones.filter((z) =>
    countryMatchesZone(z.countriesJson ?? [], country),
  );
  if (matching.length === 0) return { site: siteRow, methods: [] as const };

  const methods = [];
  for (const zone of matching) {
    const rows = await db
      .select()
      .from(shippingMethod)
      .where(
        and(eq(shippingMethod.zoneId, zone.id), eq(shippingMethod.active, true)),
      )
      .orderBy(asc(shippingMethod.sortOrder), asc(shippingMethod.priceCents));
    for (const m of rows) {
      methods.push({
        id: m.id,
        zoneId: zone.id,
        zoneName: zone.name,
        name: m.name,
        priceCents: m.priceCents,
        currency: m.currency,
      });
    }
  }
  return { site: siteRow, methods };
}

export function shippingRoutes(db: Db, auth: Auth) {
  const app = new Hono();

  app.get("/organizations/:orgId/shipping-zones", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const zones = await db
      .select()
      .from(shippingZone)
      .where(eq(shippingZone.organizationId, orgId))
      .orderBy(asc(shippingZone.name));

    const result = [];
    for (const zone of zones) {
      const methods = await db
        .select()
        .from(shippingMethod)
        .where(eq(shippingMethod.zoneId, zone.id))
        .orderBy(asc(shippingMethod.sortOrder));
      result.push({
        id: zone.id,
        organizationId: zone.organizationId,
        siteId: zone.siteId,
        name: zone.name,
        countries: zone.countriesJson,
        methods: methods.map((m) => ({
          id: m.id,
          name: m.name,
          priceCents: m.priceCents,
          currency: m.currency,
          active: m.active,
          sortOrder: m.sortOrder,
        })),
      });
    }
    return c.json({ zones: result });
  });

  app.post("/shipping-zones", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const parsed = zoneCreateSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const access = await assertOrgRole(
      db,
      session.user.id,
      parsed.data.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    let siteId: string | null = parsed.data.siteId ?? null;
    if (siteId) {
      const siteRow = await loadSite(db, siteId);
      if (!siteRow || siteRow.organizationId !== parsed.data.organizationId) {
        return apiError(c, 400, "VALIDATION_ERROR", "siteId must belong to organization");
      }
    }

    const countries = parsed.data.countries.map((c) => c.toUpperCase());
    const [created] = await db
      .insert(shippingZone)
      .values({
        organizationId: parsed.data.organizationId,
        siteId,
        name: parsed.data.name,
        countriesJson: countries,
      })
      .returning();

    return c.json(
      {
        zone: {
          id: created!.id,
          organizationId: created!.organizationId,
          siteId: created!.siteId,
          name: created!.name,
          countries: created!.countriesJson,
          methods: [],
        },
      },
      201,
    );
  });

  app.delete("/shipping-zones/:zoneId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const [zone] = await db
      .select()
      .from(shippingZone)
      .where(eq(shippingZone.id, c.req.param("zoneId")))
      .limit(1);
    if (!zone) return apiError(c, 404, "NOT_FOUND", "Zone not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      zone.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    await db.delete(shippingZone).where(eq(shippingZone.id, zone.id));
    return c.json({ ok: true });
  });

  app.post("/shipping-zones/:zoneId/methods", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const [zone] = await db
      .select()
      .from(shippingZone)
      .where(eq(shippingZone.id, c.req.param("zoneId")))
      .limit(1);
    if (!zone) return apiError(c, 404, "NOT_FOUND", "Zone not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      zone.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const parsed = methodCreateSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }

    const [created] = await db
      .insert(shippingMethod)
      .values({
        zoneId: zone.id,
        name: parsed.data.name,
        priceCents: parsed.data.priceCents,
        currency: parsed.data.currency.toLowerCase(),
        active: parsed.data.active,
        sortOrder: parsed.data.sortOrder,
      })
      .returning();

    return c.json(
      {
        method: {
          id: created!.id,
          zoneId: created!.zoneId,
          name: created!.name,
          priceCents: created!.priceCents,
          currency: created!.currency,
          active: created!.active,
          sortOrder: created!.sortOrder,
        },
      },
      201,
    );
  });

  app.delete("/shipping-methods/:methodId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const [method] = await db
      .select()
      .from(shippingMethod)
      .where(eq(shippingMethod.id, c.req.param("methodId")))
      .limit(1);
    if (!method) return apiError(c, 404, "NOT_FOUND", "Method not found");
    const [zone] = await db
      .select()
      .from(shippingZone)
      .where(eq(shippingZone.id, method.zoneId))
      .limit(1);
    if (!zone) return apiError(c, 404, "NOT_FOUND", "Zone not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      zone.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    await db.delete(shippingMethod).where(eq(shippingMethod.id, method.id));
    return c.json({ ok: true });
  });

  app.get("/public/sites/:siteId/shipping", async (c) => {
    const country = (c.req.query("country") ?? "FR").toUpperCase();
    const quoted = await listShippingQuotes(db, c.req.param("siteId"), country);
    if (!quoted) return apiError(c, 404, "NOT_FOUND", "Site not found");
    return c.json({ country, methods: quoted.methods });
  });

  return app;
}
