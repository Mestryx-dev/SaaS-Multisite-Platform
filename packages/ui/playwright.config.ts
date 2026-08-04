import { defineConfig, devices } from "@playwright/test";

/**
 * Storybook dual-theme smoke — requires Storybook on STORYBOOK_URL (default :6006).
 * Run: RUN_STORYBOOK_E2E=1 pnpm --filter @mestryx/ui storybook:smoke
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
