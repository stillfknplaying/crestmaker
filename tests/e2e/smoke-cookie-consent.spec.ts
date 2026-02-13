import { test, expect } from "@playwright/test";

test("cookie banner can be accepted and cookie settings modal opens", async ({ page }) => {
  await page.goto("/en/");

  const banner = page.getByTestId("cookie-banner");
  await expect(banner).toBeVisible({ timeout: 10000 });

  // Open settings modal via "Manage options"
  await page.getByTestId("cookie-manage").click();
  const modal = page.getByTestId("cookie-modal");
  await expect(modal).toBeVisible({ timeout: 10000 });

  // Close modal without accepting yet (saving preferences would hide the banner).
  await page.locator("#cookieCancel").click();
  await expect(modal).toBeHidden({ timeout: 10000 });

  // Accept all from the banner
  await page.getByTestId("cookie-accept").click();
  await expect(banner).toBeHidden({ timeout: 10000 });
});
