/** Build-time flag for Dokploy demo Admin (never merchant prod). */
export const isDemoMode =
  import.meta.env.VITE_DEMO_MODE === "true" ||
  import.meta.env.VITE_DEMO_MODE === "1";
