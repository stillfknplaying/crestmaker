import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturePath = path.resolve(__dirname, "../fixtures/sample.png");

async function pickDifferentSelectValue(page: import("@playwright/test").Page, testId: string) {
  const select = page.getByTestId(testId);
  const values = await select
    .locator("option")
    .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
  if (values.length === 0) return;
  const current = await select.inputValue().catch(() => "");
  const target = values.find((v) => v !== current);
  if (target) await select.selectOption(target);
}

test("download still works after changing mode/pipeline/preset and toggling crop", async ({ page }, testInfo) => {
  await page.goto("/#/");

  await page.getByTestId("upload-input").setInputFiles(fixturePath);
  await expect(page.getByTestId("download")).toBeEnabled({ timeout: 15000 });

  // Change a few selectors (if alternatives exist).
  await pickDifferentSelectValue(page, "mode");
  await pickDifferentSelectValue(page, "pipeline");
  await pickDifferentSelectValue(page, "preset");

  // Toggle crop off/on (should not break).
  const cropToggle = page.getByTestId("use-crop");
  await expect(cropToggle).toBeAttached(); 
  await page.evaluate(() => {
  const el = document.querySelector<HTMLInputElement>('[data-testid="use-crop"]');
  if (!el) throw new Error("use-crop toggle not found");

  el.checked = false;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));

  el.checked = true;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await expect(page.getByTestId("download")).toBeEnabled({ timeout: 15000 });

  // Download should still produce a BMP (signature "BM").
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download").click();
  const download = await downloadPromise;

  const outPath = testInfo.outputPath("export-after-changes.bmp");
  await download.saveAs(outPath);

  const buf = fs.readFileSync(outPath);
  expect(buf[0]).toBe(0x42);
  expect(buf[1]).toBe(0x4d);
});
