import { cors } from "hono/cors";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { resolveHostKind } from "@mestryx/host-resolution";
import type { Db } from "./db/client.js";
import { domain, site } from "./db/schema.js";
import { loadConfig, type AppConfig } from "./lib/config.js";
import { apiError } from "./lib/errors.js";
import { captureException, log } from "./lib/logger.js";
import { rateLimit } from "./lib/redis.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { securityHeadersMiddleware } from "./middleware/security-headers.js";
import { createAuth, type Auth } from "./modules/identity/auth.js";
import { billingRoutes, seedPlans } from "./modules/billing/routes.js";
import { cmsRoutes } from "./modules/cms/routes.js";
import { menuRoutes } from "./modules/cms/menu-routes.js";
import { catalogRoutes } from "./modules/commerce/catalog-routes.js";
import { commerceRoutes } from "./modules/commerce/routes.js";
import { couponRoutes } from "./modules/commerce/coupon-routes.js";
import { bannerRoutes } from "./modules/commerce/banner-routes.js";
import { mediaRoutes } from "./modules/commerce/media-routes.js";
import { shippingRoutes } from "./modules/commerce/shipping-routes.js";
import { storefrontAccountRoutes } from "./modules/commerce/storefront-account-routes.js";
import { abandonedCartRoutes } from "./modules/commerce/abandoned-cart-routes.js";
import { returnRoutes } from "./modules/commerce/return-routes.js";
import { domainRoutes } from "./modules/domains/routes.js";
import { tenancyRoutes } from "./modules/tenancy/routes.js";
import { membersRoutes } from "./modules/tenancy/members-routes.js";

export type AppEnv = {
  Variables: {
    db: Db | null;
    requestId: string;
  };
};

export type CreateAppOptions = {
  db?: Db | null;
  auth?: Auth | null;
  config?: AppConfig;
};

/** Hosts allowed to resolve via WEB_DEV_SITE_ID (local + Dokploy smoke WEB_ORIGIN). */
function isWebDevSiteHost(host: string, webOrigin: string): boolean {
  if (host === "localhost" || host === "127.0.0.1") return true;
  const smokeHosts = new Set<string>();
  const publicWebHost = process.env.PUBLIC_WEB_HOST?.trim().toLowerCase();
  if (publicWebHost) smokeHosts.add(publicWebHost.split(":")[0]!);
  try {
    const originHost = new URL(webOrigin).hostname.toLowerCase();
    if (originHost) smokeHosts.add(originHost);
  } catch {
    // ignore invalid WEB_ORIGIN
  }
  return smokeHosts.has(host);
}

export function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? loadConfig();
  const db = options.db ?? null;
  const auth = options.auth ?? (db ? createAuth(db, config) : null);

  const app = new Hono<AppEnv>();

  app.use("*", requestIdMiddleware);
  app.use("*", securityHeadersMiddleware());
  app.use(
    "*",
    cors({
      origin: config.trustedOrigins,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization", "x-request-id"],
      exposeHeaders: ["x-request-id"],
    }),
  );

  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });

  app.onError((err, c) => {
    captureException(err, { requestId: c.get("requestId") });
    return apiError(c, 500, "INTERNAL_ERROR", "Unexpected server error");
  });

  app.get("/", (c) =>
    c.json({
      service: "mestryx-platform-api",
      docs: "See repository docs/ for product specs",
      openapi: "/openapi.json",
    }),
  );

  app.get("/health", (c) =>
    c.json({
      status: "ok",
      service: "api",
      time: new Date().toISOString(),
      requestId: c.get("requestId"),
    }),
  );

  app.get("/health/ready", async (c) => {
    const database = c.get("db");
    if (!database) {
      return c.json(
        {
          status: "degraded",
          database: "not_configured",
          time: new Date().toISOString(),
        },
        200,
      );
    }
    try {
      const { sql } = await import("drizzle-orm");
      await database.execute(sql`select 1`);
      return c.json({
        status: "ok",
        database: "up",
        time: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      return c.json(
        {
          status: "error",
          database: "down",
          error: message,
          time: new Date().toISOString(),
        },
        503,
      );
    }
  });

  /** Minimal OpenAPI stub — expand as routes land; sdk consumes this later */
  app.get("/openapi.json", (c) =>
    c.json({
      openapi: "3.1.0",
      info: {
        title: "mestryx-platform API",
        version: "0.1.0",
      },
      paths: {
        "/health": {
          get: {
            summary: "Liveness",
            responses: { "200": { description: "OK" } },
          },
        },
        "/v1/organizations": {
          get: { summary: "List organizations for session" },
          post: { summary: "Create organization" },
        },
        "/v1/organizations/{orgId}/members": {
          get: { summary: "List org members (FB-035)" },
        },
        "/v1/organizations/{orgId}/members/{membershipId}": {
          patch: { summary: "Change member role" },
          delete: { summary: "Remove member" },
        },
        "/v1/organizations/{orgId}/invites": {
          get: { summary: "List pending invites" },
          post: { summary: "Create invite (admin/editor/viewer)" },
        },
        "/v1/organizations/{orgId}/invites/{inviteId}": {
          delete: { summary: "Revoke invite" },
        },
        "/v1/invites/{token}": {
          get: { summary: "Public invite metadata" },
        },
        "/v1/invites/{token}/accept": {
          post: { summary: "Accept invite (signed-in, email match)" },
        },
        "/v1/plans": { get: { summary: "List platform plans" } },
        "/v1/organizations/{orgId}/billing": {
          get: { summary: "Org billing summary (FB-051)" },
        },
        "/v1/billing/checkout-session": {
          post: { summary: "Stripe Checkout session (or stub)" },
        },
        "/v1/billing/portal-session": {
          post: { summary: "Stripe Customer Portal session (or stub)" },
        },
        "/v1/billing/webhooks/stripe": {
          post: { summary: "Stripe webhooks (signed when secret set)" },
        },
        "/v1/sites": { post: { summary: "Create site" } },
      },
    }),
  );

  if (auth && db) {
    app.on(["POST", "GET"], "/api/auth/*", async (c) => {
      const ip = c.req.header("x-forwarded-for") ?? "local";
      if (c.req.path.includes("sign-in") || c.req.path.includes("sign-up")) {
        const rl = await rateLimit(`auth:${ip}`, 30, 60);
        if (!rl.allowed) {
          return apiError(c, 429, "RATE_LIMITED", "Too many auth attempts");
        }
      }
      return auth.handler(c.req.raw);
    });

    app.route("/v1", tenancyRoutes(db, auth));
    app.route("/v1", membersRoutes(db, auth, config));
    app.route("/v1", cmsRoutes(db, auth, config));
    app.route("/v1", menuRoutes(db, auth));
    app.route("/v1", catalogRoutes(db, auth));
    app.route("/v1", shippingRoutes(db, auth));
    app.route("/v1", couponRoutes(db, auth));
    app.route("/v1", bannerRoutes(db, auth));
    app.route("/v1", mediaRoutes(db, auth, config));
    app.route("/v1", commerceRoutes(db, auth, config));
    app.route("/v1", storefrontAccountRoutes(db, auth, config));
    app.route("/v1", abandonedCartRoutes(db, auth, config));
    app.route("/v1", returnRoutes(db, auth, config));
    app.route("/v1", domainRoutes(db, auth));
    app.route("/v1", billingRoutes(db, auth, config));

    /** Public host → site resolution */
    app.get("/v1/public/resolve-host", async (c) => {
      const host = (c.req.query("host") ?? "").toLowerCase().split(":")[0];
      if (!host) {
        return apiError(c, 400, "VALIDATION_ERROR", "host query required");
      }

      // Missing domain table / schema drift must not 500 the whole resolve path
      try {
        const [custom] = await db
          .select({ site, domain })
          .from(domain)
          .innerJoin(site, eq(domain.siteId, site.id))
          .where(eq(domain.hostname, host))
          .limit(1);

        if (custom && custom.domain.verificationStatus === "verified") {
          return c.json({
            site: custom.site,
            hostname: host,
            source: "custom_domain",
          });
        }
      } catch (err) {
        log("warn", "resolve_host_domain_lookup_failed", {
          host,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      const kind = resolveHostKind({
        host,
        sitesHostSuffix: config.publicSitesHostSuffix,
      });
      if (kind.kind === "platform_subdomain") {
        const [row] = await db
          .select()
          .from(site)
          .where(eq(site.slug, kind.slug))
          .limit(1);
        if (row) {
          return c.json({ site: row, hostname: host, source: "platform_subdomain" });
        }
      }

      // Local / smoke SSR (WEB_DEV_SITE_ID) — no platform subdomain or custom domain
      const webDevSiteId = process.env.WEB_DEV_SITE_ID?.trim();
      if (webDevSiteId && isWebDevSiteHost(host, config.webOrigin)) {
        const [row] = await db
          .select()
          .from(site)
          .where(eq(site.id, webDevSiteId))
          .limit(1);
        if (row) {
          return c.json({
            site: row,
            hostname: host,
            source: "web_dev_site_id",
          });
        }
      }

      return apiError(c, 404, "NOT_FOUND", "No site for host");
    });
  }

  log("info", "app_created", { auth: Boolean(auth), db: Boolean(db) });
  return app;
}

export { seedPlans };
