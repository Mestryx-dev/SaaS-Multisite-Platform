import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { hashPassword } from "better-auth/crypto";
import type { Db } from "../../db/client.js";
import { account, user } from "../../db/schema.js";
import type { Auth } from "../identity/auth.js";
import type { AppConfig } from "../../lib/config.js";
import { apiError } from "../../lib/errors.js";
import { rateLimit } from "../../lib/redis.js";
import { log } from "../../lib/logger.js";

/**
 * Align Better Auth credential hash with DEMO_MODE seed password so demo-enter
 * works even when the DB was seeded with a different (unknown) password.
 * Demo hosts only — never enable DEMO_MODE on merchant prod.
 */
async function syncSeedCredentialPassword(
  db: Db,
  email: string,
  password: string,
): Promise<boolean> {
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (!existing) return false;

  const hashed = await hashPassword(password);
  const updated = await db
    .update(account)
    .set({ password: hashed, updatedAt: new Date() })
    .where(
      and(eq(account.userId, existing.id), eq(account.providerId, "credential")),
    )
    .returning({ id: account.id });
  return updated.length > 0;
}

/**
 * Demo-only routes: auto session as the Luna seed user (DEMO_MODE).
 */
export function demoRoutes(auth: Auth, config: AppConfig, db: Db) {
  const app = new Hono();

  app.post("/demo/enter", async (c) => {
    if (!config.demoMode) {
      return apiError(c, 404, "NOT_FOUND", "Not found");
    }
    if (!config.demoSeedEmail || !config.demoSeedPassword) {
      return apiError(
        c,
        503,
        "DEMO_NOT_CONFIGURED",
        "Demo seed credentials are not configured",
      );
    }

    const ip = c.req.header("x-forwarded-for") ?? "local";
    const rl = await rateLimit(`demo-enter:${ip}`, 20, 60);
    if (!rl.allowed) {
      return apiError(c, 429, "RATE_LIMITED", "Too many demo enter attempts");
    }

    const synced = await syncSeedCredentialPassword(
      db,
      config.demoSeedEmail,
      config.demoSeedPassword,
    );
    if (!synced) {
      log("warn", "demo_enter_seed_user_missing", {});
      return apiError(
        c,
        503,
        "DEMO_ENTER_FAILED",
        "Could not enter demo session — ensure the database is seeded",
      );
    }

    const signInUrl = new URL("/api/auth/sign-in/email", c.req.url);
    const headers = new Headers({
      "content-type": "application/json",
      origin: c.req.header("origin") ?? config.adminOrigin,
    });
    const cookie = c.req.header("cookie");
    if (cookie) headers.set("cookie", cookie);

    const signInReq = new Request(signInUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: config.demoSeedEmail,
        password: config.demoSeedPassword,
      }),
    });

    try {
      const res = await auth.handler(signInReq);
      if (!res.ok) {
        log("warn", "demo_enter_failed", { status: res.status });
        return apiError(
          c,
          503,
          "DEMO_ENTER_FAILED",
          "Could not enter demo session — ensure the database is seeded",
        );
      }
      return res;
    } catch (err) {
      log("error", "demo_enter_error", {
        error: err instanceof Error ? err.message : String(err),
      });
      return apiError(
        c,
        503,
        "DEMO_ENTER_FAILED",
        "Could not enter demo session",
      );
    }
  });

  return app;
}
