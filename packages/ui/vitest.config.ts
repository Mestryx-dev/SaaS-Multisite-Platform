import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import tailwindcss from "@tailwindcss/vite";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

/** Browser Storybook vitest — opt in: VITEST_STORYBOOK=1 (needs Playwright browsers). */
const enableStorybookBrowser = process.env.VITEST_STORYBOOK === "1";

const unitProject = {
  extends: true as const,
  test: {
    name: "unit",
    environment: "happy-dom" as const,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: [path.join(dirname, "src/__tests__/setup.ts")],
  },
};

const storybookProject = {
  extends: true as const,
  plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
  test: {
    name: "storybook",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({}),
      instances: [{ browser: "chromium" as const }],
    },
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", ".storybook/preview.tsx"],
      exclude: [
        "src/**/*.stories.tsx",
        "src/**/index.ts",
        "src/__tests__/**",
        ".storybook/**",
      ],
      // Full thresholds assume Storybook browser coverage; unit-only runs skip them.
      ...(enableStorybookBrowser
        ? {
            thresholds: {
              statements: 95,
              branches: 90,
              functions: 95,
              lines: 95,
            },
          }
        : {}),
      reporter: ["text", "text-summary", "html"],
    },
    projects: enableStorybookBrowser
      ? [storybookProject, unitProject]
      : [unitProject],
  },
});
