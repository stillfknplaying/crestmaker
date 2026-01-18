import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturePath = path.resolve(__dirname, "../fixtures/sample.png");

async function downloadBmp(page: import("@playwright/test").Page, testInfo: import("@playwright/test").TestInfo, name: string) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download").click();
  const download = await downloadPromise;
  const outPath = testInfo.outputPath(name);
  await download.saveAs(outPath);
  return fs.readFileSync(outPath);
}

test("local and worker engines produce identical BMP output for the same input", async ({ page }, testInfo) => {
  // 1) Local (default)
  await page.goto("/#/");
  await page.getByTestId("upload-input").setInputFiles(fixturePath);
  await expect(page.getByTestId("download")).toBeEnabled({ timeout: 15000 });
  const localBuf = await downloadBmp(page, testInfo, "local.bmp");

  // 2) Worker (beta) - enabled via hidden localStorage flag
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("cm_use_worker_beta", "1");
    } catch {
      // ignore
    }
  });

  await page.goto("/#/");
  await page.getByTestId("upload-input").setInputFiles(fixturePath);
  await expect(page.getByTestId("download")).toBeEnabled({ timeout: 15000 });
  const workerBuf = await downloadBmp(page, testInfo, "worker.bmp");

  expect(workerBuf.equals(localBuf)).toBe(true);
});
