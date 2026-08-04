/**
 * Build-time public site knobs (Astro `PUBLIC_*` / Docker build-args).
 * Unset Umami vars = no tracker. Other knobs fall back to Mestryx defaults for dogfood.
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
    trim(import.meta.env.PUBLIC_ANALYTICS_HOST) ||
    originFromScript(umamiScriptUrl) ||
    "https://umami.mestryx.dev";

  return {
    contactEmail: trim(import.meta.env.PUBLIC_CONTACT_EMAIL) || "contact@mestryx.dev",
    demoAdminUrl:
      trim(import.meta.env.PUBLIC_LINK_DEMO_ADMIN) || "https://demo-admin-platform.mestryx.dev",
    demoStoreUrl:
      trim(import.meta.env.PUBLIC_LINK_DEMO_STORE) || "https://demo-web-platform.mestryx.dev",
    portfolioUrl: trim(import.meta.env.PUBLIC_LINK_PORTFOLIO) || "https://portfolio.mestryx.dev",
    siteUrl: trim(import.meta.env.PUBLIC_SITE_URL) || "https://mestryx.dev",
    analyticsHost,
    umamiScriptUrl,
    umamiWebsiteId: trim(import.meta.env.PUBLIC_UMAMI_WEBSITE_ID),
    umamiShareUrl: trim(import.meta.env.PUBLIC_UMAMI_SHARE_URL),
  };
}

/** Flat map for `t()` interpolation (`{{contactEmail}}`, …). */
export function siteInterpolateVars(): Record<string, string> {
  const s = getSiteConfig();
  return {
    contactEmail: s.contactEmail,
    demoAdminUrl: s.demoAdminUrl,
    demoStoreUrl: s.demoStoreUrl,
    portfolioUrl: s.portfolioUrl,
    siteUrl: s.siteUrl,
    analyticsHost: s.analyticsHost,
  };
}
