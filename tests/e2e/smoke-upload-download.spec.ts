import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturePath = path.resolve(__dirname, "../fixtures/sample.png");

test("upload renders results and allows downloading BMP", async ({ page }, testInfo) => {
  await page.goto("/#/");

  // File input is intentionally hidden in UI; Playwright can still set files.
  await page.getByTestId("upload-input").setInputFiles(fixturePath);

  // Pipeline should finish and enable download.
  await expect(page.getByTestId("download")).toBeEnabled({ timeout: 15000 });

  // Result canvas should contain non-empty pixels.
  const hasPixels = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      "[data-testid=\"canvas-result-24\"]"
    );
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a !== 0 && (r !== 0 || g !== 0 || b !== 0)) return true;
    }
    return false;
  });
  expect(hasPixels).toBe(true);

  // Download should produce a BMP file (signature "BM").
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download").click();
  const download = await downloadPromise;

  const outPath = testInfo.outputPath("export.bmp");
  await download.saveAs(outPath);

  const buf = fs.readFileSync(outPath);
  expect(buf[0]).toBe(0x42); // 'B'
  expect(buf[1]).toBe(0x4d); // 'M'
});
