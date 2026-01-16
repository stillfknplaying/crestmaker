import { test, expect } from "@playwright/test";

test("app boots and shows key controls", async ({ page }) => {
  await page.goto("/#/");

  await expect(page.getByTestId("upload-input")).toBeAttached(); 
  await expect(page.getByTestId("download")).toBeVisible();
  await expect(page.getByTestId("mode")).toBeVisible();
  await expect(page.getByTestId("pipeline")).toBeVisible();
  await expect(page.getByTestId("preset")).toBeVisible();
});
