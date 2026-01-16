import { test, expect } from "@playwright/test";

test("cookie consent persists after accept", async ({ page }) => {
  await page.goto("/#/");

  const banner = page.getByTestId("cookie-banner");
  await expect(banner).toBeVisible({ timeout: 10000 });

  await page.getByTestId("cookie-accept").click();
  await expect(banner).toBeHidden({ timeout: 10000 });

  // Reload and ensure banner stays hidden (persisted consent).
  await page.reload();
  await expect(banner).toBeHidden({ timeout: 10000 });
});
