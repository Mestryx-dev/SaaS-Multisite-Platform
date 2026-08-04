import type { MiddlewareHandler } from "hono";
import { apiError } from "../lib/errors.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * When DEMO_MODE is on, reject mutating /v1 requests (seeded catalog stays intact).
 * Allow POST /v1/demo/enter so the admin can obtain a seed session.
 */
export function demoReadOnlyMiddleware(demoMode: boolean): MiddlewareHandler {
  return async (c, next) => {
    if (!demoMode) return next();
    const method = c.req.method.toUpperCase();
    if (SAFE_METHODS.has(method)) return next();

    const path = c.req.path;
    if (path === "/v1/demo/enter" || path.endsWith("/demo/enter")) {
      return next();
    }

    return apiError(
      c,
      403,
      "DEMO_READ_ONLY",
      "Demo environment is read-only. Changes are not persisted.",
    );
  };
}
