import { test, expect } from "@playwright/test";

/**
 * Smoke E2E — requires `pnpm dev:api` + `pnpm --filter @mestryx/admin dev`.
 * Skipped in default CI until services are wired in workflow.
 */
test.describe("admin smoke", () => {
  test.skip(!process.env.RUN_E2E, "Set RUN_E2E=1 with local servers");

  test("sign-up page renders", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
