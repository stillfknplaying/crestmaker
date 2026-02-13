import { test, expect } from "@playwright/test";

test("cookie consent persists after accept", async ({ page }) => {
  await page.goto("/en/");

  // Reset cookie consent state (CI may reuse storageState between tests).
  await page.context().clearCookies();
  await page.evaluate(() => {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
  });
  await page.reload();

  const banner = page.getByTestId("cookie-banner");
  await expect(banner).toBeVisible({ timeout: 10000 });

  await page.getByTestId("cookie-accept").click();
  await expect(banner).toBeHidden({ timeout: 10000 });

  // Reload and ensure banner stays hidden (persisted consent).
  await page.reload();
  await expect(banner).toBeHidden({ timeout: 10000 });
});
