/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WEB_ORIGIN?: string;
  readonly VITE_PUBLIC_SITES_HOST_SUFFIX?: string;
  /** When "true", public demo: auto session + read-only UX (ADR-0007). */
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
