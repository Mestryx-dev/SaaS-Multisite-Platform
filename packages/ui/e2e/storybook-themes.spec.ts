import { test, expect } from "@playwright/test";

/**
 * Dual-theme Storybook smoke.
 * Requires `pnpm --filter @mestryx/ui storybook` and RUN_STORYBOOK_E2E=1.
 */
test.describe("storybook dual themes", () => {
  test.skip(!process.env.RUN_STORYBOOK_E2E, "Set RUN_STORYBOOK_E2E=1 with Storybook on :6006");

  test("AppShell locks platform (dark)", async ({ page }) => {
    await page.goto("/iframe.html?id=patterns-appshell--default&viewMode=story&globals=theme:platform");
    await page.waitForSelector("#storybook-root");
    const wrap = page.locator("#storybook-root [data-theme='platform']").first();
    await expect(wrap).toBeVisible();
    await expect(wrap).toHaveCSS("background-color", "rgb(15, 20, 25)");
    await expect(page.getByText("mestryx-platform")).toBeVisible();
  });

  test("StoreHeader locks storefront (light)", async ({ page }) => {
    await page.goto(
      "/iframe.html?id=patterns-storeheader--default&viewMode=story&globals=theme:storefront",
    );
    await page.waitForSelector("#storybook-root");
    const wrap = page.locator("#storybook-root [data-theme='storefront']").first();
    await expect(wrap).toBeVisible();
    await expect(wrap).toHaveCSS("background-color", "rgb(244, 240, 232)");
    await expect(page.getByText("Luna Bijoux")).toBeVisible();
  });

  test("Foundations/Themes SideBySide shows both themes", async ({ page }) => {
    await page.goto("/iframe.html?id=foundations-themes--side-by-side&viewMode=story");
    await page.waitForSelector("#storybook-root");
    const platform = page.locator("#storybook-root [data-theme='platform']");
    const storefront = page.locator("#storybook-root [data-theme='storefront']");
    await expect(platform.first()).toBeVisible();
    await expect(storefront.first()).toBeVisible();
    await expect(storefront.first()).toHaveCSS("background-color", "rgb(244, 240, 232)");
  });
});
