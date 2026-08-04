/**
 * Build-time public site knobs (Astro `PUBLIC_*` / Docker build-args).
 * Unset Umami vars = no tracker.
 * Forks: leave PRODUCT hosts empty and set PUBLIC_* at build time — no silent Mestryx defaults.
 */
export type SiteConfig = {
  contactEmail: string;
  demoAdminUrl: string;
  demoStoreUrl: string;
  portfolioUrl: string;
  siteUrl: string;
  /** Origin used in privacy copy when Umami is configured */
  analyticsHost: string;
  umamiScriptUrl: string;
  umamiWebsiteId: string;
  umamiShareUrl: string;
};

function trim(value: string | undefined): string {
  return (value ?? "").trim();
}

function originFromScript(scriptUrl: string): string {
  try {
    return new URL(scriptUrl).origin;
  } catch {
    return "";
  }
}

export function getSiteConfig(): SiteConfig {
  const umamiScriptUrl = trim(import.meta.env.PUBLIC_UMAMI_SCRIPT_URL);
  const analyticsHost =
    trim(import.meta.env.PUBLIC_ANALYTICS_HOST) || originFromScript(umamiScriptUrl);

  return {
    contactEmail: trim(import.meta.env.PUBLIC_CONTACT_EMAIL),
    demoAdminUrl: trim(import.meta.env.PUBLIC_LINK_DEMO_ADMIN),
    demoStoreUrl: trim(import.meta.env.PUBLIC_LINK_DEMO_STORE),
    portfolioUrl: trim(import.meta.env.PUBLIC_LINK_PORTFOLIO),
    siteUrl: trim(import.meta.env.PUBLIC_SITE_URL) || "https://example.com",
    analyticsHost,
    umamiScriptUrl,
    umamiWebsiteId: trim(import.meta.env.PUBLIC_UMAMI_WEBSITE_ID),
    umamiShareUrl: trim(import.meta.env.PUBLIC_UMAMI_SHARE_URL),
  };
}

/** Flat map for `t()` interpolation (`{{contactEmail}}`, `{{year}}`, …). */
export function siteInterpolateVars(): Record<string, string> {
  const s = getSiteConfig();
  return {
    contactEmail: s.contactEmail || "contact@example.com",
    demoAdminUrl: s.demoAdminUrl || "#",
    demoStoreUrl: s.demoStoreUrl || "#",
    portfolioUrl: s.portfolioUrl || "#",
    siteUrl: s.siteUrl,
    analyticsHost: s.analyticsHost || "your analytics host",
    year: String(new Date().getFullYear()),
  };
}
