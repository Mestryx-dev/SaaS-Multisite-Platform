import type { MiddlewareHandler } from "hono";

/**
 * FB-098: sensible default security headers for API + web.
 * Override CSP via SECURITY_CSP env (empty string disables CSP).
 */
export function securityHeadersMiddleware(opts?: {
  csp?: string | null;
}): MiddlewareHandler {
  const cspEnv = process.env.SECURITY_CSP;
  const csp =
    opts?.csp !== undefined
      ? opts.csp
      : cspEnv === ""
        ? null
        : (cspEnv ??
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");

  return async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    if (csp) {
      c.header("Content-Security-Policy", csp);
    }
  };
}
