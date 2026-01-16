import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturePath = path.resolve(__dirname, "../fixtures/sample.png");

function readBmpWidthHeight(buf: Buffer): { width: number; height: number } {
  const width = buf.readInt32LE(18);
  const height = buf.readInt32LE(22);
  return { width, height };
}

async function downloadBmpDims(page: import("@playwright/test").Page, outPath: string) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download").click();
  const download = await downloadPromise;
  await download.saveAs(outPath);
  const buf = fs.readFileSync(outPath);
  expect(buf[0]).toBe(0x42);
  expect(buf[1]).toBe(0x4d);
  return readBmpWidthHeight(buf);
}

test("switching Mode changes exported BMP dimensions when alternative modes exist", async ({ page }, testInfo) => {
  await page.goto("/#/");

  await page.getByTestId("upload-input").setInputFiles(fixturePath);
  await expect(page.getByTestId("download")).toBeEnabled({ timeout: 15000 });

  const mode = page.getByTestId("mode");
  const values = await mode
    .locator("option")
    .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));

  // If there is only one mode option, nothing to switch; treat as pass.
  if (values.length < 2) {
    await expect(mode).toBeAttached();
    return;
  }

  const first = await downloadBmpDims(page, testInfo.outputPath("export-mode-1.bmp"));

  const current = await mode.inputValue().catch(() => "");
  const target = values.find((v) => v !== current) ?? values[0];
  await mode.selectOption(target);
  await expect(mode).toHaveValue(target);
  await expect(page.getByTestId("download")).toBeEnabled({ timeout: 15000 });

  const second = await downloadBmpDims(page, testInfo.outputPath("export-mode-2.bmp"));

  // The whole point of a different Mode is usually a different output size.
  // If your app has multiple modes that can yield the same dimensions, relax this expectation later.
  expect(`${second.width}x${second.height}`).not.toBe(`${first.width}x${first.height}`);
});
