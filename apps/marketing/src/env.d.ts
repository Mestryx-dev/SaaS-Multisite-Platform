/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_UMAMI_SCRIPT_URL?: string;
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
  readonly PUBLIC_UMAMI_SHARE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __MX_UMAMI__?: { scriptUrl: string; websiteId: string };
  __MX_SET_CONSENT__?: (value: "0" | "1") => void;
}
