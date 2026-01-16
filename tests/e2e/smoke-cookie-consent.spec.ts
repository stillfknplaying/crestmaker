import { test, expect } from "@playwright/test";

test("cookie banner can be accepted and cookie settings modal opens", async ({ page }) => {
  await page.goto("/#/");

  // Banner should appear in a fresh context.
  const banner = page.getByTestId("cookie-banner");
  await expect(banner).toBeVisible({ timeout: 10000 });

  await page.getByTestId("cookie-accept").click();
  await expect(banner).toBeHidden({ timeout: 10000 });

  // Footer link should open settings modal.
  await page.getByTestId("cookie-settings-link").click();
  await expect(page.getByTestId("cookie-modal")).toBeVisible();

  await page.getByTestId("cookie-save").click();
  await expect(page.getByTestId("cookie-modal")).toBeHidden();
});
