import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturePath = path.resolve(__dirname, "../fixtures/sample.png");

test("reset restores brightness/contrast to 0", async ({ page }) => {
  await page.goto("/#/");

  // Load an image so controls become available.
  await page.getByTestId("upload-input").setInputFiles(fixturePath);
  await expect(page.getByTestId("download")).toBeEnabled({ timeout: 15000 });

  // Open Advanced panel to reveal sliders and Reset button.
  await page.evaluate(() => {
  const el = document.querySelector<HTMLInputElement>('[data-testid="advanced"]');
  if (!el) throw new Error("advanced toggle not found");
  el.checked = true;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const brightness = page.locator("#brightness");
  const contrast = page.locator("#contrast");

  await expect(brightness).toBeAttached();
  await expect(contrast).toBeAttached();

  // Change slider values (dispatch input events so app reacts).
  await brightness.evaluate((el) => {
    const i = el as HTMLInputElement;
    i.value = "25";
    i.dispatchEvent(new Event("input", { bubbles: true }));
    i.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await contrast.evaluate((el) => {
    const i = el as HTMLInputElement;
    i.value = "-15";
    i.dispatchEvent(new Event("input", { bubbles: true }));
    i.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Reset flow uses a confirmation modal.
  const resetBtn = page.getByTestId("reset");
  await expect(resetBtn).toBeVisible();
  await resetBtn.click();

  await expect(page.getByTestId("reset-modal")).toBeVisible();
  await page.getByTestId("reset-confirm").click();
  await expect(page.getByTestId("reset-modal")).toBeHidden();

  // Values must be restored.
  await expect(brightness).toHaveValue("0");
  await expect(contrast).toHaveValue("0");

  // App remains usable.
  await expect(page.getByTestId("download")).toBeEnabled({ timeout: 15000 });
});
