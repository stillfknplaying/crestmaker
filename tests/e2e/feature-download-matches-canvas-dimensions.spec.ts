import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.resolve(__dirname, "../fixtures/sample.png");

function readBmpWidthHeight(buf: Buffer): { width: number; height: number } {
  return { width: buf.readInt32LE(18), height: buf.readInt32LE(22) };
}

test("download 24x12 produces 3 BMPs with expected dimensions", async ({ page }, testInfo) => {
  await page.goto("/#/");
  await page.getByTestId("upload-input").setInputFiles(fixturePath);
  await expect(page.getByTestId("download")).toBeEnabled({ timeout: 15000 });

  // Optional: explicitly set size to 24×12 if needed
  // await page.getByTestId("size").selectOption({ label: "24×12" });

  const downloads: import("@playwright/test").Download[] = [];
  page.on("download", (d) => downloads.push(d));

  await page.getByTestId("download").click();

  // Wait until all 3 downloads arrive
  await expect.poll(() => downloads.length, { timeout: 15000 }).toBe(3);

  const dims: Array<[number, number]> = [];

  for (const d of downloads) {
    const outPath = testInfo.outputPath(d.suggestedFilename());
    await d.saveAs(outPath);
    const buf = fs.readFileSync(outPath);
    expect(buf[0]).toBe(0x42);
    expect(buf[1]).toBe(0x4d);
    const { width, height } = readBmpWidthHeight(buf);
    dims.push([width, height]);
  }

  // Order doesn't matter
  expect(dims).toEqual(expect.arrayContaining([[24, 12], [16, 12], [8, 12]]));
});
