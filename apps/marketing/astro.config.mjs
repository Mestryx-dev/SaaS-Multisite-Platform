import { defineConfig } from "astro/config";

// Manual locale folders via `[locale]` + getStaticPaths (FR default redirect from /).
export default defineConfig({
  output: "static",
  trailingSlash: "never",
  vite: {
    ssr: {
      noExternal: ["@mestryx/tokens"],
    },
  },
});
